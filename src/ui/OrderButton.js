// OrderButton - Siparişe ekle butonu (Floating Action Button)
export class OrderButton {
  constructor(container, onAddToCart) {
    this.container = container;
    this.onAddToCart = onAddToCart;
    this.button = null;
    this.badge = null;

    this.render();
  }

  render() {
    // FAB butonu oluştur
    this.button = document.createElement('button');
    this.button.className = 'order-fab';
    this.button.title = 'Siparişe Ekle';
    this.button.setAttribute('aria-label', 'Siparişe Ekle');

    this.button.innerHTML = `
      <div class="order-fab-content">
        <span class="order-fab-icon">🛒</span>
        <span class="order-fab-text">Ekle</span>
      </div>
      <span class="order-badge">0</span>
      <div class="order-loading">
        <div class="spinner"></div>
      </div>
      <div class="order-success">
        <span class="success-check">✓</span>
      </div>
    `;

    // Badge referansını sakla
    this.badge = this.button.querySelector('.order-badge');

    // Click event
    this.button.addEventListener('click', async () => {
      if (this.button.classList.contains('loading')) return; // Prevent double click

      try {
        await this.onAddToCart();
      } catch (error) {
        console.error('Add to cart error:', error);
        this.button.classList.remove('loading');
      }
    });

    // Container'a ekle
    this.container.appendChild(this.button);
  }

  /**
   * Badge sayısını güncelle
   * @param {number} count - Sepetteki parça sayısı
   */
  updateBadge(count) {
    if (this.badge) {
      this.badge.textContent = count;
      this.badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  /**
   * Loading durumunu göster
   */
  showLoading() {
    if (this.button) {
      this.button.classList.add('loading');
      this.button.classList.remove('success');
    }
  }

  /**
   * Success animasyonu göster
   */
  showSuccess() {
    if (this.button) {
      this.button.classList.remove('loading');
      this.button.classList.add('success');

      // 1 saniye sonra normal haline dön
      setTimeout(() => {
        if (this.button) {
          this.button.classList.remove('success');
        }
      }, 1000);
    }
  }

  /**
   * Butonu göster
   */
  show() {
    if (this.button) {
      this.button.style.display = 'flex';
    }
  }

  /**
   * Butonu gizle
   */
  hide() {
    if (this.button) {
      this.button.style.display = 'none';
    }
  }

  /**
   * Temizlik
   */
  dispose() {
    if (this.button && this.button.parentElement) {
      this.button.parentElement.removeChild(this.button);
    }
  }
}
