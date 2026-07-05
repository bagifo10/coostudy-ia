export class AudioService {
  constructor() {
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.chunkHandler = null;
    this.errorHandler = null;
    this.recording = false;
  }

  static isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  async _requestMicrophone() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return stream;
    } catch (e) {
      console.warn('AudioService microphone access denied', e);
      if (this.errorHandler) {
        this.errorHandler({ error: 'microphone', message: e.message || 'Micrófono denegado', isTrusted: e.isTrusted || false });
      }
      return null;
    }
  }

  onAudioChunk(callback) {
    if (typeof callback === 'function') {
      this.chunkHandler = callback;
    }
  }

  onError(callback) {
    if (typeof callback === 'function') {
      this.errorHandler = callback;
    }
  }

  async start() {
    if (this.recording) return true;
    const stream = await this._requestMicrophone();
    if (!stream) return false;

    try {
      this.mediaStream = stream;
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    } catch (e) {
      console.warn('AudioService failed to create MediaRecorder', e);
      this._cleanupStream();
      if (this.errorHandler) {
        this.errorHandler({ error: 'recorder', message: e.message || 'No se pudo crear el grabador de audio', isTrusted: false });
      }
      return false;
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (!event.data || event.data.size === 0) return;
      if (this.chunkHandler) {
        this.chunkHandler(event.data);
      }
    };

    this.mediaRecorder.onerror = (event) => {
      console.warn('MediaRecorder error', event);
      if (this.errorHandler) {
        this.errorHandler({ error: event.error?.name || 'recorder', message: event.error?.message || 'Error de grabación', isTrusted: false });
      }
    };

    this.mediaRecorder.onstop = () => {
      this._cleanupStream();
    };

    try {
      this.mediaRecorder.start(10000);
      this.recording = true;
      return true;
    } catch (e) {
      console.warn('AudioService failed to start recorder', e);
      this._cleanupStream();
      if (this.errorHandler) {
        this.errorHandler({ error: 'start', message: e.message || 'No se pudo iniciar grabación', isTrusted: false });
      }
      return false;
    }
  }

  stop() {
    if (!this.recording) return;
    this.recording = false;
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    } catch (e) {
      console.warn('AudioService stop failed', e);
    }
    this._cleanupStream();
  }

  _cleanupStream() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
  }
}
