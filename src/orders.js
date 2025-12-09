// Orders Page - Sipariş sepeti yönetimi
import { OrderManager } from './core/OrderManager.js';

class OrdersPage {
  constructor() {
    this.orderManager = new OrderManager();
    this.init();
  }

  init() {
    this.renderPage();
    this.setupEventListeners();
    this.updateStorageInfo();
  }

  renderPage() {
    const cart = this.orderManager.getCart();
    const emptyState = document.getElementById('empty-state');
    const ordersContent = document.getElementById('orders-content');

    if (cart.length === 0) {
      // Sepet boş
      emptyState.style.display = 'block';
      ordersContent.style.display = 'none';
    } else {
      // Sepet dolu
      emptyState.style.display = 'none';
      ordersContent.style.display = 'grid';
      this.renderOrders(cart);
      this.renderSummary();
    }
  }

  renderOrders(cart) {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';

    cart.forEach((item, index) => {
      const card = this.createOrderCard(item, index);
      ordersList.appendChild(card);
    });
  }

  createOrderCard(item, index) {
    const card = document.createElement('div');
    card.className = 'order-item-card';
    card.dataset.itemId = item.id;

    // Timestamp formatla
    const date = new Date(item.timestamp);
    const dateStr = date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Boyutları formatla
    const dimensionsHTML = Object.entries(item.dimensions)
      .map(([key, value]) => {
        const formattedValue = Number.isInteger(value) ? value : value.toFixed(1);
        return `<span class="dimension-tag">${key}: ${formattedValue} cm</span>`;
      })
      .join('');

    // Alan formatla
    const areaFormatted = item.area.toFixed(2);
    const totalArea = (item.area * item.quantity).toFixed(2);

    card.innerHTML = `
      <div class="order-item-header">
        <div class="order-item-title">
          <h3>${item.partName}</h3>
          <span class="order-item-timestamp">${dateStr}</span>
        </div>
        <button class="delete-btn" data-action="delete">🗑️ Sil</button>
      </div>

      <div class="order-screenshots">
        <div class="screenshot-item">
          <img src="${item.screenshots.front}" alt="Ön görünüm">
          <div class="screenshot-label">Ön</div>
        </div>
        <div class="screenshot-item">
          <img src="${item.screenshots.right}" alt="Sağ görünüm">
          <div class="screenshot-label">Sağ</div>
        </div>
        <div class="screenshot-item">
          <img src="${item.screenshots.top}" alt="Üst görünüm">
          <div class="screenshot-label">Üst</div>
        </div>
        <div class="screenshot-item">
          <img src="${item.screenshots.iso}" alt="İzometrik">
          <div class="screenshot-label">İzometrik</div>
        </div>
      </div>

      <div class="order-dimensions">
        ${dimensionsHTML}
      </div>

      <div class="order-area">
        Alan: <strong>${areaFormatted} m²</strong>
        ${item.quantity > 1 ? `(Toplam: <strong>${totalArea} m²</strong>)` : ''}
      </div>

      <div class="order-quantity">
        <label>Adet:</label>
        <button class="qty-btn" data-action="decrease">−</button>
        <input type="number" class="qty-input" value="${item.quantity}" min="1" data-action="quantity">
        <button class="qty-btn" data-action="increase">+</button>
      </div>
    `;

    return card;
  }

  renderSummary() {
    const summary = this.orderManager.getCartSummary();

    document.getElementById('summary-items').textContent = summary.totalItems;
    document.getElementById('summary-quantity').textContent = summary.totalQuantity;
    document.getElementById('summary-area').textContent = summary.totalArea.toFixed(2) + ' m²';
  }

  setupEventListeners() {
    // Delete button
    document.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-action="delete"]');
      if (deleteBtn) {
        const card = deleteBtn.closest('.order-item-card');
        const itemId = card.dataset.itemId;
        this.handleDelete(itemId);
      }
    });

    // Quantity buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.qty-btn');
      if (!btn) return;

      const card = btn.closest('.order-item-card');
      const itemId = card.dataset.itemId;
      const input = card.querySelector('.qty-input');
      const action = btn.dataset.action;

      let newQty = parseInt(input.value) || 1;

      if (action === 'increase') {
        newQty++;
      } else if (action === 'decrease') {
        newQty = Math.max(1, newQty - 1);
      }

      this.handleQuantityChange(itemId, newQty);
    });

    // Quantity input manual change
    document.addEventListener('change', (e) => {
      if (e.target.matches('.qty-input')) {
        const card = e.target.closest('.order-item-card');
        const itemId = card.dataset.itemId;
        const newQty = Math.max(1, parseInt(e.target.value) || 1);
        this.handleQuantityChange(itemId, newQty);
      }
    });

    // Clear cart
    const clearBtn = document.getElementById('clear-cart-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.handleClearCart();
      });
    }

    // Export CSV
    const exportBtn = document.getElementById('export-csv-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.handleExportCSV();
      });
    }

    // Screenshot zoom (optional)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.screenshot-item img')) {
        this.showImageModal(e.target.src);
      }
    });
  }

  handleDelete(itemId) {
    if (confirm('Bu parçayı sepetten silmek istediğinizden emin misiniz?')) {
      this.orderManager.removeFromCart(itemId);
      this.renderPage();
      this.updateStorageInfo();
    }
  }

  handleQuantityChange(itemId, quantity) {
    this.orderManager.updateQuantity(itemId, quantity);
    this.renderPage();
  }

  handleClearCart() {
    if (confirm('Sepetteki tüm parçaları silmek istediğinizden emin misiniz?')) {
      this.orderManager.clearCart();
      this.renderPage();
      this.updateStorageInfo();
    }
  }

  handleExportCSV() {
    try {
      this.orderManager.downloadCSV();
      // Success feedback
      const exportBtn = document.getElementById('export-csv-btn');
      const originalText = exportBtn.textContent;
      exportBtn.textContent = '✓ İndirildi!';
      exportBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      setTimeout(() => {
        exportBtn.textContent = originalText;
        exportBtn.style.background = '';
      }, 2000);
    } catch (error) {
      alert('Excel export hatası: ' + error.message);
    }
  }

  updateStorageInfo() {
    const stats = this.orderManager.getStorageStats();
    const fillElement = document.getElementById('storage-fill');
    const textElement = document.getElementById('storage-text');

    if (fillElement && textElement) {
      const percentage = parseFloat(stats.percentage);
      fillElement.style.width = stats.percentage;
      textElement.textContent = `${stats.used} / ${stats.total}`;

      // Color based on usage
      if (percentage > 80) {
        fillElement.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
      } else if (percentage > 60) {
        fillElement.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
      } else {
        fillElement.style.background = 'linear-gradient(90deg, #10b981, #059669)';
      }
    }
  }

  showImageModal(src) {
    // Simple image modal (optional enhancement)
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `;

    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;

    modal.appendChild(img);
    document.body.appendChild(modal);

    modal.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  new OrdersPage();
});
