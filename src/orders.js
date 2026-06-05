// Orders Page - Sipariş sepeti yönetimi
import { OrderManager } from './core/OrderManager.js';

class OrdersPage {
  constructor() {
    this.orderManager = new OrderManager();
    this.init();
  }

  async init() {
    await this.renderPage();
    this.setupEventListeners();
    await this.updateStorageInfo();
  }

  async renderPage() {
    const cart = await this.orderManager.getCart();
    const emptyState = document.getElementById('empty-state');
    const ordersContent = document.getElementById('orders-content');

    console.log('📦 Orders Page - Cart:', cart);
    console.log('📦 Cart length:', cart.length);

    if (cart.length === 0) {
      // Sepet boş
      console.log('⚠️ Sepet boş görünüyor');
      emptyState.style.display = 'block';
      ordersContent.style.display = 'none';
    } else {
      // Sepet dolu
      console.log('✅ Sepet dolu, rendering...', cart.length, 'items');
      emptyState.style.display = 'none';
      ordersContent.style.display = 'grid';
      this.renderOrders(cart);
      await this.renderSummary();
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

  getOffsetModeLabel(mode, axis) {
    if (!mode) return 'Merkezi';

    if (axis === 'W') {
      switch (mode) {
        case 'flatLeft': return 'Sol Düz';
        case 'flatRight': return 'Sağ Düz';
        case 'value': return 'Değer';
        default: return 'Merkezi';
      }
    }

    switch (mode) {
      case 'flatBottom': return 'Alt Düz';
      case 'flatTop': return 'Üst Düz';
      case 'value': return 'Değer';
      default: return 'Merkezi';
    }
  }

  getOffsetSelectionText(item) {
    if (!item) return '';
    const isTarget = item.partType === 'reduksiyon' || item.partType === 'kareden-yuvarlaga';
    if (!isTarget) return '';

    const fromText = item.params?.offsetSelectionText;
    if (fromText) return fromText;

    const offsetSelection = item.params?.offsetSelection;
    if (offsetSelection?.width || offsetSelection?.height) {
      const widthLabel = offsetSelection.width || this.getOffsetModeLabel(item.params?.modeW, 'W');
      const heightLabel = offsetSelection.height || this.getOffsetModeLabel(item.params?.modeH, 'H');
      return `Genişlik: ${widthLabel} | Yükseklik: ${heightLabel}`;
    }

    const modeW = item.params?.modeW;
    const modeH = item.params?.modeH;
    if (!modeW && !modeH) return '';

    const widthLabel = this.getOffsetModeLabel(modeW, 'W');
    const heightLabel = this.getOffsetModeLabel(modeH, 'H');
    return `Genişlik: ${widthLabel} | Yükseklik: ${heightLabel}`;
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
    const offsetSelectionText = this.getOffsetSelectionText(item);
    const offsetInfoHtml = offsetSelectionText
      ? `<div class="order-offset-info">Ofset: <strong>${offsetSelectionText}</strong></div>`
      : '';

    // Alan formatla (area string olabilir, sayıya çevir)
    const breakdown = this.orderManager.getAreaBreakdown(item);
    const quantity = Math.max(1, parseInt(item.quantity) || 1);
    const formatArea = (value) => Number(value).toFixed(2);
    const formatPercent = (value) => Number(value).toFixed(1);
    const netArea = breakdown.netArea;
    const netTotal = netArea * quantity;
    const wastePercent = breakdown.wastePercent;
    const totalArea = breakdown.totalArea;
    const totalWithWaste = totalArea * quantity;
    const isDuzKanal = item.partType === 'duz-kanal';
    const netTotalText = quantity > 1 ? `<span class="order-area-sub">(Toplam: ${formatArea(netTotal)} m²)</span>` : '';
    const totalWithWasteText = quantity > 1 ? `<span class="order-area-sub">(Toplam: ${formatArea(totalWithWaste)} m²)</span>` : '';
    const areaHtml = isDuzKanal
      ? `
        <div class="order-area-row">
          Net Alan: <strong>${formatArea(netArea)} m²</strong> ${netTotalText}
        </div>
      `
      : `
        <div class="order-area-row">
          Net Alan (hariç): <strong>${formatArea(netArea)} m²</strong> ${netTotalText}
        </div>
        <div class="order-area-row">
          Atık Oranı: <strong>%${formatPercent(wastePercent)}</strong>
        </div>
        <div class="order-area-row">
          Atık Dahil: <strong>${formatArea(totalArea)} m²</strong> ${totalWithWasteText}
        </div>
      `;
    const missingShot = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220"><rect width="100%" height="100%" fill="#111827"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="18">Excel Import</text></svg>'
    );
    const safeScreenshots = {
      front: missingShot,
      right: missingShot,
      top: missingShot,
      iso: missingShot,
      ...(item.screenshots || {})
    };

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
          <img src="${safeScreenshots.front || ''}" alt="Ön görünüm">
          <div class="screenshot-label">Ön</div>
        </div>
        <div class="screenshot-item">
          <img src="${safeScreenshots.right || ''}" alt="Sağ görünüm">
          <div class="screenshot-label">Sağ</div>
        </div>
        <div class="screenshot-item">
          <img src="${safeScreenshots.top || ''}" alt="Üst görünüm">
          <div class="screenshot-label">Üst</div>
        </div>
        <div class="screenshot-item">
          <img src="${safeScreenshots.iso || ''}" alt="İzometrik">
          <div class="screenshot-label">İzometrik</div>
        </div>
      </div>

      <div class="order-dimensions">
        ${dimensionsHTML}
      </div>
      ${offsetInfoHtml}

      <div class="order-area">
        ${areaHtml}
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

  async renderSummary() {
    const summary = await this.orderManager.getCartSummary();

    document.getElementById('summary-items').textContent = summary.totalItems;
    document.getElementById('summary-quantity').textContent = summary.totalQuantity;
    document.getElementById('summary-area-net').textContent = summary.totalNetArea.toFixed(2) + ' m²';
    document.getElementById('summary-waste-percent').textContent = summary.totalWastePercent.toFixed(1) + ' %';
    document.getElementById('summary-area-waste').textContent = summary.totalWasteArea.toFixed(2) + ' m²';
    document.getElementById('summary-area-total').textContent = summary.totalAreaWithWaste.toFixed(2) + ' m²';

    // Sac kalınlığına göre detay
    const thicknessDetails = document.getElementById('thickness-details');
    if (thicknessDetails && summary.byThickness && summary.byThickness.length > 0) {
      thicknessDetails.innerHTML = summary.byThickness.map(t => `
        <div class="thickness-row">
          <div class="thickness-header">
            <span class="thickness-label">${t.thickness} mm</span>
            <span class="thickness-count">${t.quantity} adet (${t.itemCount} çeşit)</span>
          </div>
          <div class="thickness-areas">
            <div class="thickness-area-item">
              <span>Net:</span>
              <strong>${t.netArea.toFixed(2)} m²</strong>
            </div>
            <div class="thickness-area-item">
              <span>Atık:</span>
              <strong>${t.wasteArea.toFixed(2)} m²</strong>
            </div>
            <div class="thickness-area-item highlight">
              <span>Toplam:</span>
              <strong>${t.totalArea.toFixed(2)} m²</strong>
            </div>
          </div>
        </div>
      `).join('');
    } else if (thicknessDetails) {
      thicknessDetails.innerHTML = '<div class="thickness-empty">Sac kalınlığı bilgisi yok</div>';
    }
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

    // Export PDF
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', () => {
        this.handleExportPDF();
      });
    }

    // Screenshot zoom (optional)
    document.addEventListener('click', (e) => {
      if (e.target.matches('.screenshot-item img')) {
        this.showImageModal(e.target.src);
      }
    });
  }

  async handleDelete(itemId) {
    if (confirm('Bu parçayı sepetten silmek istediğinizden emin misiniz?')) {
      await this.orderManager.removeFromCart(itemId);
      await this.renderPage();
      await this.updateStorageInfo();
    }
  }

  async handleQuantityChange(itemId, quantity) {
    await this.orderManager.updateQuantity(itemId, quantity);
    await this.renderPage();
  }

  async handleClearCart() {
    if (confirm('Sepetteki tüm parçaları silmek istediğinizden emin misiniz?')) {
      await this.orderManager.clearCart();
      await this.renderPage();
      await this.updateStorageInfo();
    }
  }

  async handleExportCSV() {
    try {
      await this.orderManager.downloadCSV();
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

  async handleExportPDF() {
    const exportBtn = document.getElementById('export-pdf-btn');
    const originalText = exportBtn.textContent;

    try {
      // Loading durumu
      exportBtn.textContent = '⏳ PDF Hazırlanıyor...';
      exportBtn.disabled = true;
      exportBtn.style.opacity = '0.6';

      // PDF oluştur (progress callback ile)
      await this.orderManager.downloadPDF(null, (current, total) => {
        exportBtn.textContent = `⏳ ${current}/${total} işleniyor...`;
      });

      // Success feedback
      exportBtn.textContent = '✓ İndirildi!';
      exportBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      exportBtn.style.opacity = '1';
      exportBtn.disabled = false;

      setTimeout(() => {
        exportBtn.textContent = originalText;
        exportBtn.style.background = '';
      }, 2000);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF export hatası: ' + error.message);

      // Reset button
      exportBtn.textContent = originalText;
      exportBtn.style.opacity = '1';
      exportBtn.disabled = false;
    }
  }

  async updateStorageInfo() {
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
