export class AudioService {
  constructor() {
    this.recognition = null;
    this.listeners = [];
  }

  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  createRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';
    recognition.onresult = this._onResult.bind(this);
    recognition.onerror = this._onError.bind(this);
    recognition.onend = this._onEnd.bind(this);
    return recognition;
  }

  start() {
    if (this.recognition) return;
    this.recognition = this.createRecognition();
    if (!this.recognition) return false;
    this.recognition.start();
    return true;
  }

  stop() {
    if (!this.recognition) return;
    try { this.recognition.stop(); } catch (e) {}
    this.recognition = null;
  }

  onTranscript(callback) {
    if (typeof callback === 'function') this.listeners.push(callback);
  }

  _onResult(event) {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0].transcript;
      if (result.isFinal) {
        this.listeners.forEach(cb => cb(text, true));
      } else {
        interim += text;
        this.listeners.forEach(cb => cb(interim, false));
      }
    }
  }

  _onError(event) {
    console.warn('AudioService error', event);
  }

  _onEnd() {
    if (this.recognition) {
      this.recognition.start();
    }
  }
}
