export class UIManager {
  constructor() {
    this.viewTitle = document.getElementById('view-title');
    this.views = Array.from(document.querySelectorAll('.view'));
    this.navItems = Array.from(document.querySelectorAll('.nav-item'));
    this.transcriptOutput = document.getElementById('transcript-output');
    this.chatOutput = document.getElementById('chat-output');
  }

  init() {
    this.renderHomeState();
  }

  renderHomeState() {
    this.clearTranscript();
    if (this.chatOutput) {
      this.chatOutput.innerHTML = '<p>La IA aún no ha respondido.</p>';
    }
    this.updateLatestNote(null);
  }

  clearTranscript() {
    if (!this.transcriptOutput) return;
    this.transcriptOutput.innerHTML = '<p class="muted">Esperando transcripción...</p>';
  }

  setTranscriptMessage(message, type = 'muted') {
    if (!this.transcriptOutput) return;
    this.transcriptOutput.innerHTML = `<p class="transcript-status transcript-status-${type}">${this.escape(message)}</p>`;
  }

  updateTranscriptLive(text, isFinal = false) {
    if (!this.transcriptOutput) return;

    if (this.transcriptOutput.textContent.includes('Esperando transcripción...') || this.transcriptOutput.querySelector('.transcript-status')) {
      this.transcriptOutput.innerHTML = '';
    }

    if (isFinal) {
      const interim = this.transcriptOutput.querySelector('.transcript-interim');
      if (interim) {
        interim.remove();
      }
      const line = document.createElement('p');
      line.className = 'transcript-line';
      line.textContent = text;
      this.transcriptOutput.appendChild(line);
      this.transcriptOutput.scrollTop = this.transcriptOutput.scrollHeight;
      return;
    }

    let interim = this.transcriptOutput.querySelector('.transcript-interim');
    if (!interim) {
      interim = document.createElement('p');
      interim.className = 'transcript-interim';
      this.transcriptOutput.appendChild(interim);
    }
    interim.textContent = text;
    this.transcriptOutput.scrollTop = this.transcriptOutput.scrollHeight;
  }

  appendChatMessage(text, role = 'assistant') {
    if (!this.chatOutput) return;
    if (this.chatOutput.textContent.includes('La IA aún no ha respondido.')) {
      this.chatOutput.innerHTML = '';
    }
    const el = document.createElement('div');
    el.className = 'chat-message';
    if (role === 'user') {
      el.classList.add('chat-user');
    } else {
      el.classList.add('chat-assistant');
    }
    el.textContent = text;
    this.chatOutput.appendChild(el);
    this.chatOutput.scrollTop = this.chatOutput.scrollHeight;
  }

  updateLatestNote(noteData) {
    const note = document.getElementById('latest-note');
    if (!note) return;
    if (!noteData) {
      note.innerHTML = '<p>No hay notas disponibles aún.</p>';
      return;
    }
    note.innerHTML = `
      <div class="card">
        <strong>${this.escape(noteData.title)}</strong>
        <p>${this.escape(noteData.desc)}</p>
      </div>
    `;
  }

  escape(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  setActiveView(viewName) {
    this.views.forEach((view) => {
      view.classList.toggle('active', view.dataset.view === viewName);
    });

    this.navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    if (this.viewTitle) {
      const labels = {
        home: 'Inicio',
        models: 'Modelos',
        notes: 'Notas',
        account: 'Cuenta',
        settings: 'Configuración'
      };
      this.viewTitle.textContent = labels[viewName] || 'Inicio';
    }
  }
}
