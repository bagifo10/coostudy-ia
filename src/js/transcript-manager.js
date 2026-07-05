export class TranscriptManager {
  constructor() {
    this.output = document.getElementById('transcript-output');
    this.interimLine = null;
  }

  clear() {
    if (!this.output) return;
    this.output.innerHTML = '';
    this.interimLine = null;
  }

  setInterim(text) {
    if (!this.output) return;
    if (this.output.textContent.includes('Esperando transcripción...')) {
      this.output.innerHTML = '';
    }
    if (!this.interimLine) {
      this.interimLine = document.createElement('p');
      this.interimLine.className = 'transcript-interim';
      this.output.appendChild(this.interimLine);
    }
    this.interimLine.textContent = text;
    this.output.scrollTop = this.output.scrollHeight;
  }

  append(text) {
    if (!this.output) return;
    if (this.interimLine) {
      this.interimLine.remove();
      this.interimLine = null;
    }
    const line = document.createElement('p');
    line.className = 'transcript-line';
    line.textContent = text;
    this.output.appendChild(line);
    this.output.scrollTop = this.output.scrollHeight;
  }
}
