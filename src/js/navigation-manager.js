export class NavigationManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this._handler = this._handler.bind(this);
  }

  init() {
    // Delegate clicks to support overlays and dynamic elements
    document.body.addEventListener('click', this._handler, true);
    // Log nav item positions for debugging
    try {
      document.querySelectorAll('.nav-item').forEach((button) => {
        console.log('nav-item', button.dataset.view, button.getBoundingClientRect(), getComputedStyle(button).pointerEvents);
      });
    } catch (e) { }
  }

  _handler(ev) {
    const btn = ev.target.closest && ev.target.closest('.nav-item');
    if (btn) {
      ev.preventDefault();
      ev.stopPropagation();
      this.uiManager.setActiveView(btn.dataset.view);
    }
  }
}
