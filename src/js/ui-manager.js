export class UIManager {
  constructor() {
    this.viewTitle = document.getElementById('view-title');
    this.views = Array.from(document.querySelectorAll('.view'));
    this.navItems = Array.from(document.querySelectorAll('.nav-item'));
  }

  init() {
    this.renderHomeState();
  }

  renderHomeState() {
    const transcript = document.getElementById('transcript-output');
    const chat = document.getElementById('chat-output');
    const note = document.getElementById('latest-note');

    transcript.innerHTML = '<p>Esperando transcripción...</p>';
    chat.innerHTML = '<p>La IA aún no ha respondido.</p>';
    note.innerHTML = '<p>No hay notas disponibles aún.</p>';
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
