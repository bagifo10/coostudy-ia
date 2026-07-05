export class AIService {
  constructor(modelsManager, memoryManager, storageService) {
    this.modelsManager = modelsManager;
    this.memoryManager = memoryManager;
    this.storageService = storageService;
  }

  getMode() {
    return this.modelsManager?.state?.mode || 'local';
  }

  getLevel() {
    return this.modelsManager?.state?.level || 3;
  }

  getModelConfig() {
    const level = this.getLevel();
    return {
      model: 'gpt-3.5-turbo',
      temperature: 0.5 + Math.min(0.35, (level - 1) * 0.1),
      max_tokens: 180 + (level - 1) * 40,
      top_p: 0.9,
      frequency_penalty: 0.2,
      presence_penalty: 0.1 + (level - 1) * 0.03
    };
  }

  getHistoryLimit() {
    const level = this.getLevel();
    if (level <= 2) return 4;
    if (level === 3) return 8;
    return 12;
  }

  async generate(text) {
    const mode = this.getMode();
    if (mode === 'cloud') {
      if (!this.modelsManager.state.apiKey) {
        return 'Error: Cloud mode requiere API Key para funcionar. Ingresa la clave en Modelos y guarda.';
      }
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
      const context = this.memoryManager ? this.memoryManager.getContext(this.getHistoryLimit()) : { history: [], topics: [] };
      const topicNote = context.topics.length ? `Estos son los temas previos: ${context.topics.join(', ')}.` : '';
      const systemMessage = `Eres un tutor de estudio profesional y claro. Adaptas tu respuesta a nivel ${this.getLevel()} y respondes con ejemplos cuando sea útil.`;
      const messages = [
        { role: 'system', content: systemMessage },
        ...context.history.map(item => ({ role: item.role, content: item.content })),
        { role: 'user', content: `${topicNote} ${text}`.trim() }
      ];
      const config = this.getModelConfig();
      const payload = {
        model: config.model,
        messages,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        top_p: config.top_p,
        frequency_penalty: config.frequency_penalty,
        presence_penalty: config.presence_penalty
      };
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.modelsManager.state.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error?.message || `OpenAI responded with status ${response.status}`;
        console.error('AIService cloud HTTP error', errorMsg);
        return `Error: ${errorMsg}`;
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || 'Sin respuesta.';
    } catch (e) {
      console.error('AIService cloud error', e);
      return 'Error: no se pudo conectar con la IA.';
    }
  }

  _generateLocal(text) {
    const context = this.memoryManager ? this.memoryManager.getContext(this.getHistoryLimit()) : { history: [], topics: [] };
    const topics = context.topics.length ? `Temas guardados: ${context.topics.join(', ')}. ` : '';
    const summary = context.history.length
      ? `Última charla: ${context.history.slice(-Math.min(context.history.length, 3)).map(item => `${item.role === 'user' ? 'Tú' : 'IA'}: ${item.content}`).join(' | ')}. `
      : '';
    const level = this.getLevel();
    return `IA local (nivel ${level}): ${topics}${summary}Responde a lo siguiente con claridad y brevedad: ${text.slice(0, 160)}`;
  }
}
