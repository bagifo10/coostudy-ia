import { UIManager } from './ui-manager.js';
import { NavigationManager } from './navigation-manager.js';
import { NotesManager } from './notes-manager.js';
import { ModelsManager } from './models-manager.js';
import { SettingsManager } from './settings-manager.js';
import { AIManager } from './ai-manager.js';
import { TranscriptManager } from './transcript-manager.js';
import { MemoryManager } from './memory-manager.js';
import { StorageService } from './storage-service.js';
import { AudioService } from './audio-service.js';
import { AIService } from './ai-service.js';
import { TranscriptionService } from './transcription-service.js';

class App {
  constructor() {
    this.uiManager = new UIManager();
    this.navigationManager = new NavigationManager(this.uiManager);
    this.storageService = new StorageService();
    this.audioService = new AudioService();
    this.memoryManager = new MemoryManager(this.storageService);
    this.notesManager = new NotesManager(this.storageService);
    this.notesManager.onChange = () => {
      const latest = this.notesManager.notes[0];
      this.uiManager.updateLatestNote(latest);
    };
    this.modelsManager = new ModelsManager(this.storageService);
    this.settingsManager = new SettingsManager(this.storageService);
    this.aiService = new AIService(this.modelsManager, this.memoryManager, this.storageService);
    this.transcriptionService = new TranscriptionService(this.modelsManager);
    this.aiManager = new AIManager(this.aiService, this.memoryManager, this.notesManager, this.storageService, this.uiManager);
    this.transcriptManager = new TranscriptManager();
    this.assistantRunning = false;
    this.permissionOverlay = null;
    this.permissionAllowBtn = null;
    this.permissionDenyBtn = null;
  }

  init() {
    this.uiManager.init();
    this.navigationManager.init();
    // initialize managers
    try { this.notesManager.init(); } catch (e) { console.warn('notes init failed', e); }
    try { this.modelsManager.init(); } catch (e) { console.warn('models init failed', e); }
    try { this.settingsManager.load(); } catch (e) { console.warn('settings load failed', e); }
    try {
      const latest = this.notesManager.notes[0];
      this.uiManager.updateLatestNote(latest);
    } catch (e) { console.warn('update latest note failed', e); }
    try {
      this.memoryManager.load();
      this._loadChatHistory();
    } catch (e) {
      console.warn('chat history load failed', e);
    }
    try {
      this.settingsManager.load();
      this.settingsManager.applyTheme(this.settingsManager.state.theme);
      // populate mic list if present
      const micSelect = document.getElementById('mic-select');
      if (micSelect && navigator && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        this.settingsManager.getAvailableMicrophones().then(devs => {
          micSelect.innerHTML = '';
          devs.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.deviceId || '';
            opt.textContent = d.label || 'Mic';
            micSelect.appendChild(opt);
          });
          // set saved
          if (this.settingsManager.state && this.settingsManager.state.micDeviceId) micSelect.value = this.settingsManager.state.micDeviceId;
        }).catch(()=>{});
      }
      const settingsSave = document.getElementById('settings-save');
      if (settingsSave) settingsSave.addEventListener('click', () => {
        const mic = document.getElementById('mic-select');
        const theme = document.getElementById('theme-select');
        if (mic) this.settingsManager.state.micDeviceId = mic.value;
        if (theme) this.settingsManager.state.theme = theme.value;
        this.settingsManager.persist();
        settingsSave.textContent = 'Guardado';
        setTimeout(()=> settingsSave.textContent = 'Guardar',900);
      });
    } catch (e) { console.warn('settings init failed', e); }
    // Assistant toggle
    const assistantBtn = document.getElementById('assistant-toggle');
    if (assistantBtn) {
      assistantBtn.addEventListener('click', () => {
        if (!this.assistantRunning) this.startAssistant(assistantBtn);
        else this.stopAssistant(assistantBtn);
      });

      if (!AudioService.isSupported()) {
        assistantBtn.disabled = true;
        assistantBtn.textContent = 'STT no compatible';
        this.uiManager.setTranscriptMessage('El reconocimiento de voz no es compatible en este entorno. En Electron este backend no está disponible.', 'warning');
      }
    }

    this.permissionOverlay = document.getElementById('mic-permission-overlay');
    this.permissionAllowBtn = document.getElementById('mic-permission-allow');
    this.permissionDenyBtn = document.getElementById('mic-permission-deny');
    if (this.permissionAllowBtn) {
      this.permissionAllowBtn.addEventListener('click', () => {
        this._hideMicPermissionPrompt();
        this._confirmMicPermission(assistantBtn);
      });
    }
    if (this.permissionDenyBtn) {
      this.permissionDenyBtn.addEventListener('click', () => {
        this._hideMicPermissionPrompt();
        this.uiManager.setTranscriptMessage('Permiso de micrófono cancelado. No se iniciará la transcripción.', 'warning');
      });
    }

    this.chunkCount = 0;
    this.audioService.onAudioChunk(async (chunk) => {
      this.chunkCount += 1;
      if (!this.transcriptionService.isReady()) {
        this.uiManager.setTranscriptMessage('No hay API Key para transcripción. Guarda tu clave en Modelos.', 'warning');
        return;
      }

      this.uiManager.updateTranscriptLive(`Transcribiendo chunk ${this.chunkCount}...`, false);
      try {
        const text = await this.transcriptionService.transcribeAudio(chunk);
        this.uiManager.updateTranscriptLive(`Chunk ${this.chunkCount}: ${text}`, true);
        if (this.aiManager) this.aiManager.processChunk(text);
      } catch (error) {
        this.uiManager.setTranscriptMessage(`Error de transcripción: ${error.message}`, 'warning');
      }
    });
    this.audioService.onError((error) => {
      const message = error.error === 'microphone'
        ? 'Permiso de micrófono denegado.'
        : `Error de audio: ${error.message || error.error || 'desconocido'}`;
      this.uiManager.setTranscriptMessage(message, 'warning');
      this.stopAssistant(assistantBtn);
    });
    // (import/export UI removed per user request)
    console.log('CooStudy app initialized');
  }

  async startAssistant(btn) {
    if (!AudioService.isSupported()) {
      this.uiManager.setTranscriptMessage('SpeechRecognition no disponible en este entorno. Ejecuta en un navegador compatible o usa Electron con soporte de reconocimiento.', 'warning');
      return;
    }

    if (this.assistantRunning) {
      return;
    }

    this._showMicPermissionPrompt();
  }

  async _confirmMicPermission(btn) {
    this.uiManager.setTranscriptMessage('Solicitando permiso de micrófono y preparando transcripción...', 'default');
    const started = await this.audioService.start();
    if (!started) {
      this.uiManager.setTranscriptMessage('No se pudo iniciar el reconocimiento de voz. Revisa permisos de micrófono y compatibilidad del navegador.', 'warning');
      return;
    }
    this.assistantRunning = true;
    if (btn) btn.textContent = 'Detener asistente';
  }

  _showMicPermissionPrompt() {
    if (this.permissionOverlay) {
      this.permissionOverlay.classList.remove('hidden');
      this.permissionOverlay.setAttribute('aria-hidden', 'false');
    }
  }

  _hideMicPermissionPrompt() {
    if (this.permissionOverlay) {
      this.permissionOverlay.classList.add('hidden');
      this.permissionOverlay.setAttribute('aria-hidden', 'true');
    }
  }

  _loadChatHistory() {
    if (!this.storageService) return;
    const history = this.storageService.loadChatHistory();
    if (!history || history.length === 0) return;
    history.forEach(item => {
      const role = item.role === 'user' ? 'user' : 'assistant';
      this.uiManager.appendChatMessage(item.text, role);
    });
  }

  stopAssistant(btn) {
    this.audioService.stop();
    this.assistantRunning = false;
    if (btn) btn.textContent = 'Iniciar asistente';
  }
}

const app = new App();
app.init();
