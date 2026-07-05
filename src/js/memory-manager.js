export class MemoryManager {
  constructor(storageService) {
    this.storageService = storageService;
    this.history = [];
    this.topics = [];
    this.load();
  }

  load() {
    if (!this.storageService) return;
    this.history = this.storageService.loadChatHistory() || [];
    this.topics = this.storageService.get('topics', []);
  }

  save() {
    if (!this.storageService) return;
    this.storageService.saveChatHistory(this.history);
    this.storageService.set('topics', this.topics);
  }

  addInteraction(text) {
    this.history.push({ role: 'user', text, ts: Date.now() });
    this._trimHistory();
    this.save();
  }

  addAssistantResponse(text) {
    this.history.push({ role: 'assistant', text, ts: Date.now() });
    this._trimHistory();
    this.save();
  }

  addTopic(topic) {
    if (!this.topics.includes(topic)) {
      this.topics.push(topic);
      this.save();
    }
  }

  getContext(maxHistory = 8) {
    return {
      history: this.history.slice(-maxHistory).map(item => ({ role: item.role, content: item.text || '' })),
      topics: this.topics
    };
  }

  _trimHistory() {
    if (this.history.length > 200) {
      this.history = this.history.slice(-200);
    }
  }
}
