export class ModelsManager {
  constructor(storageService) {
    this.storageService = storageService;
    this.modeSelect = document.getElementById('model-mode');
    this.levelInput = document.getElementById('model-level');
    this.levelLabel = document.getElementById('model-level-label');
    this.apiInput = document.getElementById('model-api-key');
    this.saveBtn = document.getElementById('models-save');
    this.state = { mode: 'hybrid', level: 3, apiKey: '' };
  }

  init() {
    this.load();
    this.applyToUI();
    if (this.levelInput) {
      this.levelInput.addEventListener('input', () => {
        if (this.levelLabel) this.levelLabel.textContent = this.levelInput.value;
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
    // basic feedback
    this.saveBtn.textContent = 'Guardado';
    setTimeout(() => this.saveBtn.textContent = 'Guardar', 1200);
  }
}
