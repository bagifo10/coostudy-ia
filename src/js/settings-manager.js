export class SettingsManager {
  constructor(storageService) {
    this.storageService = storageService;
    this.mode = 'hybrid';
    this.intelligence = 3;
    this.state = { micDeviceId: '', theme: 'dark' };
  }

  updateMode(mode) {
    this.mode = mode;
  }

  updateIntelligence(level) {
    this.intelligence = level;
  }

  async getAvailableMicrophones() {
    if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'audioinput');
    } catch (e) {
      return [];
    }
  }

  load() {
    this.state = this.storageService ? this.storageService.loadSettings() : this.state;
  }

  persist() { if (this.storageService) this.storageService.saveSettings(this.state); }

  applyTheme(theme) {
    if (theme === 'light') document.documentElement.style.setProperty('--bg', '#f5f5f5');
    else document.documentElement.style.setProperty('--bg', 'var(--bg)');
  }
}
