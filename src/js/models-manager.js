export class ModelsManager {
  constructor(storageService) {
    this.storageService = storageService;
    this.modeSelect = document.getElementById('model-mode');
    this.levelInput = document.getElementById('model-level');
    this.levelLabel = document.getElementById('model-level-label');
    this.apiInput = document.getElementById('model-api-key');
    this.saveBtn = document.getElementById('models-save');
    this.statusEl = document.getElementById('model-status');
    this.state = { mode: 'hybrid', level: 3, apiKey: '' };
  }

  init() {
    this.load();
    this.applyToUI();
    this.updateStatus();
    if (this.modeSelect) {
      this.modeSelect.addEventListener('change', () => {
        this.state.mode = this.modeSelect.value;
        this.updateStatus();
      });
    }
    if (this.levelInput) {
      this.levelInput.addEventListener('input', () => {
        if (this.levelLabel) this.levelLabel.textContent = this.levelInput.value;
      });
    }
    if (this.apiInput) {
      this.apiInput.addEventListener('input', () => {
        this.state.apiKey = this.apiInput.value.trim();
        this.updateStatus();
      });
    }
    if (this.saveBtn) this.saveBtn.addEventListener('click', () => this.saveFromUI());
  }

  load() {
    this.state = this.storageService ? this.storageService.loadModels() : this.state;
  }

  persist() { if (this.storageService) this.storageService.saveModels(this.state); }

  applyToUI() {
    if (this.modeSelect) this.modeSelect.value = this.state.mode || 'hybrid';
    if (this.levelInput) this.levelInput.value = this.state.level || 3;
    if (this.levelLabel) this.levelLabel.textContent = this.state.level || 3;
    if (this.apiInput) this.apiInput.value = this.state.apiKey || '';
  }

  saveFromUI() {
    if (this.modeSelect) this.state.mode = this.modeSelect.value;
    if (this.levelInput) this.state.level = Number(this.levelInput.value || 3);
    if (this.apiInput) this.state.apiKey = this.apiInput.value.trim();
    this.persist();

    if (this.state.mode === 'cloud' && !this.state.apiKey) {
      this.updateStatus('Cloud mode requiere API Key para funcionar. Ingresa tu clave y guarda de nuevo.', 'warning');
    } else {
      this.updateStatus('Configuración guardada. ', 'success');
    }

    if (this.saveBtn) {
      const originalText = this.saveBtn.textContent;
      this.saveBtn.textContent = 'Guardado';
      setTimeout(() => {
        this.saveBtn.textContent = originalText || 'Guardar';
      }, 1200);
    }
  }

  updateStatus(message, type = 'default') {
    if (!this.statusEl) return;
    if (!message) {
      if (this.state.mode === 'cloud' && !this.state.apiKey) {
        message = 'Cloud mode activo pero sin API Key. No se podrá usar la IA remota.';
        type = 'warning';
      } else if (this.state.mode === 'cloud') {
        message = 'Cloud mode activo. La IA usará tu API Key cuando procese texto.';
        type = 'success';
      } else if (this.state.mode === 'hybrid') {
        message = 'Hybrid mode activo. Se usará OpenAI si hay API Key, de lo contrario local.';
        type = 'default';
      } else {
        message = 'Local mode activo. La IA responderá con simulación local.';
        type = 'default';
      }
    }

    this.statusEl.textContent = message;
    this.statusEl.className = `info-text info-text-${type}`;
  }
}
