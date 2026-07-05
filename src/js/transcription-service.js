export class TranscriptionService {
  constructor(modelsManager) {
    this.modelsManager = modelsManager;
  }

  isReady() {
    return !!(this.modelsManager?.state?.apiKey);
  }

  async transcribeAudio(blob) {
    const apiKey = this.modelsManager?.state?.apiKey;
    if (!apiKey) {
      throw new Error('No API Key disponible para transcripción. Configura la clave en Modelos.');
    }

    const payload = new FormData();
    payload.append('file', blob, 'recording.webm');
    payload.append('model', 'whisper-1');
    payload.append('language', 'es');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: payload
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`OpenAI audio transcription falló (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    if (!data || typeof data.text !== 'string') {
      throw new Error('Respuesta de transcripción inválida.');
    }

    return data.text.trim();
  }
}
