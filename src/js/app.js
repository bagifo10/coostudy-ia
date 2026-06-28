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

class App {
  constructor() {
    this.uiManager = new UIManager();
    this.navigationManager = new NavigationManager(this.uiManager);
    this.storageService = new StorageService();
    this.audioService = new AudioService();
    this.memoryManager = new MemoryManager(this.storageService);
    this.notesManager = new NotesManager(this.storageService);
    this.modelsManager = new ModelsManager(this.storageService);
    this.settingsManager = new SettingsManager(this.storageService);
    this.aiService = new AIService(this.modelsManager, this.memoryManager, this.storageService);
    this.aiManager = new AIManager(this.aiService, this.memoryManager, this.notesManager, this.storageService);
    this.transcriptManager = new TranscriptManager();
    this.assistantRunning = false;
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
    }
    // (import/export UI removed per user request)
    console.log('CooStudy app initialized');
  }

  startAssistant(btn) {
    this.audioService.onTranscript((text, isFinal) => {
      if (isFinal) {
        this.transcriptManager.append(text);
        if (this.aiManager) this.aiManager.processChunk(text);
      } else {
        // interim transcript can be shown in UI later
      }
    });

    const started = this.audioService.start();
    if (!started) {
      alert('SpeechRecognition no disponible en este entorno.');
      return;
    }
    this.assistantRunning = true;
    btn.textContent = 'Detener asistente';
  }

  _loadChatHistory() {
    const chatContainer = document.getElementById('chat-output');
    if (!chatContainer || !this.storageService) return;
    const history = this.storageService.loadChatHistory();
    if (!history || history.length === 0) {
      chatContainer.innerHTML = '<p>La IA aún no ha respondido.</p>';
      return;
    }
    chatContainer.innerHTML = '';
    history.forEach(item => {
      const msg = document.createElement('div');
      msg.className = `chat-message ${item.role === 'user' ? 'chat-user' : 'chat-assistant'}`;
      msg.textContent = item.text;
      chatContainer.appendChild(msg);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  stopAssistant(btn) {
    this.audioService.stop();
    this.assistantRunning = false;
    if (btn) btn.textContent = 'Iniciar asistente';
  }
}

const app = new App();
app.init();
