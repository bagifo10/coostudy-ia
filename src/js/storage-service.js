export class StorageService {
  constructor(namespace = 'coostudy') {
    this.namespace = namespace;
  }

  _key(name) {
    return `${this.namespace}_${name}_v1`;
  }

  get(name, fallback = null) {
    try {
      const raw = localStorage.getItem(this._key(name));
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  set(name, value) {
    try {
      localStorage.setItem(this._key(name), JSON.stringify(value));
    } catch (e) {
      console.warn('StorageService set failed', e);
    }
  }

  remove(name) {
    try {
      localStorage.removeItem(this._key(name));
    } catch (e) {
      console.warn('StorageService remove failed', e);
    }
  }

  loadNotes() {
    return this.get('notes', []);
  }

  saveNotes(notes) {
    this.set('notes', notes);
  }

  loadModels() {
    return this.get('models', { mode: 'hybrid', level: 3, apiKey: '' });
  }

  saveModels(models) {
    this.set('models', models);
  }

  loadSettings() {
    return this.get('settings', { micDeviceId: '', theme: 'dark' });
  }

  saveSettings(settings) {
    this.set('settings', settings);
  }

  loadChatHistory() {
    return this.get('chat', []);
  }

  saveChatHistory(chat) {
    this.set('chat', chat);
  }
}
