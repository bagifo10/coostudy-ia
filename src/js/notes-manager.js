export class NotesManager {
  constructor(storageService) {
    this.storageService = storageService;
    this.listEl = document.getElementById('notes-list');
    this.form = document.getElementById('note-form');
    this.titleInput = document.getElementById('note-title');
    this.descInput = document.getElementById('note-desc');
    this.notes = [];
    this.editingId = null;
  }

  init() {
    this.load();
    this.render();
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveFromForm();
    });
  }

  load() {
    this.notes = this.storageService ? this.storageService.loadNotes() : [];
  }

  persist() {
    if (this.storageService) this.storageService.saveNotes(this.notes);
  }

  saveFromForm() {
    const title = this.titleInput.value.trim();
    const desc = this.descInput.value.trim();
    if (!title) return;
    if (this.editingId) {
      this.update(this.editingId, title, desc);
    } else {
      this.add(title, desc);
    }
    this.titleInput.value = '';
    this.descInput.value = '';
    this.editingId = null;
  }

  add(title, desc) {
    const note = { id: Date.now().toString(), title, desc, created: Date.now() };
    this.notes.unshift(note);
    this.persist();
    this.render();
  }

  update(id, title, desc) {
    const idx = this.notes.findIndex(n => n.id === id);
    if (idx === -1) return;
    this.notes[idx].title = title;
    this.notes[idx].desc = desc;
    this.persist();
    this.render();
  }

  remove(id) {
    this.notes = this.notes.filter(n => n.id !== id);
    this.persist();
    this.render();
  }

  edit(id) {
    const note = this.notes.find(n => n.id === id);
    if (!note) return;
    this.editingId = id;
    this.titleInput.value = note.title;
    this.descInput.value = note.desc;
  }

  render() {
    if (!this.listEl) return;
    this.listEl.innerHTML = '';
    if (this.notes.length === 0) {
      this.listEl.innerHTML = '<div class="text-muted">No hay notas todavía.</div>';
      return;
    }
    this.notes.forEach(note => {
      const el = document.createElement('div');
      el.className = 'card';
      el.style.display = 'flex';
      el.style.justifyContent = 'space-between';
      el.style.alignItems = 'center';
      el.style.gap = '0.5rem';
      el.innerHTML = `
        <div style="flex:1">
          <strong>${this.escape(note.title)}</strong>
          <div class="text-muted" style="margin-top:0.25rem">${this.escape(note.desc)}</div>
        </div>
        <div style="display:flex;gap:0.5rem;margin-left:0.5rem">
          <button class="btn btn-secondary" data-action="edit" data-id="${note.id}">Editar</button>
          <button class="btn btn-secondary" data-action="delete" data-id="${note.id}">Borrar</button>
        </div>
      `;
      this.listEl.appendChild(el);
    });

    this.listEl.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'edit') this.edit(id);
        if (action === 'delete') this.remove(id);
      });
    });
  }

  escape(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
}
