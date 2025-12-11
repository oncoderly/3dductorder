// OrderButton - Siparişe ekle butonu (Floating Action Button)
export class OrderButton {
  constructor(container, onAddToCart) {
    this.container = container;
    this.onAddToCart = onAddToCart;
    this.button = null;
    this.badge = null;
    this.modal = null;
    this.quantityInput = null;
    this.currentQuantity = 1;

    this.render();
    this.renderModal();
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

    // Click event - Modal'ı aç
    this.button.addEventListener('click', () => {
      if (this.button.classList.contains('loading')) return; // Prevent double click
      this.openModal();
    });

    // Container'a ekle
    this.container.appendChild(this.button);
  }

  renderModal() {
    // Adet seçim modal'ı oluştur
    this.modal = document.createElement('div');
    this.modal.className = 'quantity-modal';
    this.modal.innerHTML = `
      <div class="quantity-modal-overlay"></div>
      <div class="quantity-modal-content">
        <h3>Adet Seçin</h3>
        <div class="quantity-selector">
          <button class="quantity-btn quantity-decrease" aria-label="Azalt">−</button>
          <input type="number" class="quantity-input" value="1" min="1" max="999">
          <button class="quantity-btn quantity-increase" aria-label="Arttır">+</button>
        </div>
        <div class="quantity-modal-actions">
          <button class="quantity-modal-cancel">İptal</button>
          <button class="quantity-modal-confirm">Ekle</button>
        </div>
      </div>
    `;

    // Modal referanslarını sakla
    this.quantityInput = this.modal.querySelector('.quantity-input');
    const decreaseBtn = this.modal.querySelector('.quantity-decrease');
    const increaseBtn = this.modal.querySelector('.quantity-increase');
    const cancelBtn = this.modal.querySelector('.quantity-modal-cancel');
    const confirmBtn = this.modal.querySelector('.quantity-modal-confirm');
    const overlay = this.modal.querySelector('.quantity-modal-overlay');

    // Event listeners
    decreaseBtn.addEventListener('click', () => this.decreaseQuantity());
    increaseBtn.addEventListener('click', () => this.increaseQuantity());

    this.quantityInput.addEventListener('input', (e) => {
      let value = parseInt(e.target.value) || 1;
      if (value < 1) value = 1;
      if (value > 999) value = 999;
      this.currentQuantity = value;
      e.target.value = value;
    });

    cancelBtn.addEventListener('click', () => this.closeModal());
    overlay.addEventListener('click', () => this.closeModal());

    confirmBtn.addEventListener('click', async () => {
      await this.confirmAddToCart();
    });

    // Keyboard support (Enter = confirm, Esc = cancel)
    this.modal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.confirmAddToCart();
      } else if (e.key === 'Escape') {
        this.closeModal();
      }
    });

    // Body'e ekle
    document.body.appendChild(this.modal);
  }

  openModal() {
    this.currentQuantity = 1;
    this.quantityInput.value = 1;
    this.modal.classList.add('active');
    // Input'a focus ver
    setTimeout(() => {
      this.quantityInput.focus();
      this.quantityInput.select();
    }, 100);
  }

  closeModal() {
    this.modal.classList.remove('active');
  }

  decreaseQuantity() {
    if (this.currentQuantity > 1) {
      this.currentQuantity--;
      this.quantityInput.value = this.currentQuantity;
    }
  }

  increaseQuantity() {
    if (this.currentQuantity < 999) {
      this.currentQuantity++;
      this.quantityInput.value = this.currentQuantity;
    }
  }

  async confirmAddToCart() {
    this.closeModal();

    try {
      // onAddToCart callback'ine quantity parametresi gönder
      await this.onAddToCart(this.currentQuantity);
    } catch (error) {
      console.error('Add to cart error:', error);
      this.button.classList.remove('loading');
    }
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
    if (this.modal && this.modal.parentElement) {
      this.modal.parentElement.removeChild(this.modal);
    }
  }
}
