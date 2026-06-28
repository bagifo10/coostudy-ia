export class TranscriptManager {
  constructor() {
    this.output = document.getElementById('transcript-output');
  }

  append(text) {
    if (!this.output) return;
    const line = document.createElement('p');
    line.textContent = text;
    this.output.appendChild(line);
  }
}
