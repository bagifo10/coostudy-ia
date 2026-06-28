export class AIService {
  constructor(modelsManager, memoryManager, storageService) {
    this.modelsManager = modelsManager;
    this.memoryManager = memoryManager;
    this.storageService = storageService;
  }

  getMode() {
    return this.modelsManager.state.mode || 'local';
  }

  getLevel() {
    return this.modelsManager.state.level || 3;
  }

  async generate(text) {
    const mode = this.getMode();
    if (mode === 'cloud' && this.modelsManager.state.apiKey) {
      return this._generateCloud(text);
    }
    if (mode === 'hybrid') {
      return this._generateHybrid(text);
    }
    return this._generateLocal(text);
  }

  async _generateHybrid(text) {
    if (this.modelsManager.state.apiKey) {
      const cloudResult = await this._generateCloud(text);
      if (cloudResult && !cloudResult.startsWith('Error:')) {
        return cloudResult;
      }
    }
    return this._generateLocal(text);
  }

  async _generateCloud(text) {
    try {
      const memory = this.memoryManager ? this.memoryManager.getContext() : { history: [], topics: [] };
      const topicNote = memory.topics.length ? `Estos son los temas previos: ${memory.topics.join(', ')}.` : '';
      const messages = [
        { role: 'system', content: 'Eres un tutor de estudio profesional y claro. Usa respuestas breves cuando el usuario lo pida y ofrece explicaciones útiles.' },
        ...memory.history.map(item => ({ role: item.role, content: item.content })),
        { role: 'user', content: `${topicNote} ${text}`.trim() }
      ];

      const payload = {
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 250,
        temperature: 0.7
      };
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.modelsManager.state.apiKey}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || 'Sin respuesta.';
    } catch (e) {
      console.error('AIService cloud error', e);
      return 'Error: no se pudo conectar con la IA.';
    }
  }

  _generateLocal(text) {
    const memory = this.memoryManager ? this.memoryManager.getContext() : { history: [], topics: [] };
    const topics = memory.topics.length ? `Temas guardados: ${memory.topics.join(', ')}. ` : '';
    const summary = memory.history.length ? `Última charla: ${memory.history.slice(-3).map(item => `${item.role === 'user' ? 'Tú' : 'AI'}: ${item.content}`).join(' | ')}. ` : '';
    return `IA local (${this.getLevel()}): ${topics}${summary}Respuesta simulada a: ${text.slice(0, 120)}`;
  }
}
