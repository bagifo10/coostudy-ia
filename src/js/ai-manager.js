export class AIManager {
  constructor(aiService, memoryManager, notesManager, storageService, uiManager) {
    this.aiService = aiService;
    this.memoryManager = memoryManager;
    this.notesManager = notesManager;
    this.storageService = storageService;
    this.uiManager = uiManager;
    this.buffer = '';
    this.thinking = false;
  }

  appendToChat(text, meta = {}) {
    const role = meta.role === 'user' ? 'user' : 'assistant';
    if (this.uiManager && typeof this.uiManager.appendChatMessage === 'function') {
      this.uiManager.appendChatMessage(text, role);
    }
    if (this.storageService) {
      const chat = this.storageService.loadChatHistory();
      chat.push({ role: role, text, ts: Date.now() });
      this.storageService.saveChatHistory(chat);
    }
  }

  async processChunk(text) {
    this.buffer += (this.buffer ? ' ' : '') + text;
    if (this.thinking || !text.trim()) return;
    this.thinking = true;
    await this._delay(600);
    const chunk = this.buffer.trim();
    this.buffer = '';
    if (!chunk) {
      this.thinking = false;
      return;
    }

    this.memoryManager.addInteraction(chunk);
    this.appendToChat(chunk, { role: 'user' });
    try {
      const response = await this.aiService.generate(chunk);
      this.memoryManager.addAssistantResponse(response);
      this.appendToChat(response, { role: 'assistant' });
      if (this.notesManager) {
        this.notesManager.add(`IA - ${new Date().toLocaleTimeString()}`, response);
      }
    } catch (e) {
      console.error('AIManager processChunk error', e);
      this.appendToChat('Error: no se pudo procesar la petición.', { role: 'assistant' });
    } finally {
      this.thinking = false;
    }
  }

  _delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}
