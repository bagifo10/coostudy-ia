export class AIManager {
  constructor(aiService, memoryManager, notesManager, storageService) {
    this.outputEl = document.getElementById('chat-output');
    this.aiService = aiService;
    this.memoryManager = memoryManager;
    this.notesManager = notesManager;
    this.storageService = storageService;
    this.buffer = '';
    this.thinking = false;
  }

  appendToChat(text, meta = {}) {
    if (!this.outputEl) return;
    const el = document.createElement('div');
    el.className = 'chat-message';
    if (meta.role === 'user') {
      el.classList.add('chat-user');
    } else {
      el.classList.add('chat-assistant');
    }
    el.textContent = text;
    this.outputEl.appendChild(el);
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
    if (this.storageService) {
      const chat = this.storageService.loadChatHistory();
      chat.push({ role: meta.role || 'assistant', text, ts: Date.now() });
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
