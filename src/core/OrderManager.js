// OrderManager - Sipariş sepetini LocalStorage ile yönetir
export class OrderManager {
  constructor() {
    this.storageKey = 'ductcalc-orders';
  }

  /**
   * Sepete yeni parça ekle
   * @param {Object} orderItem - Sipariş kalemi
   * @returns {boolean} - Başarılı ise true
   */
  addToCart(orderItem) {
    try {
      const cart = this.getCart();
      cart.push(orderItem);
      localStorage.setItem(this.storageKey, JSON.stringify(cart));
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('LocalStorage limiti doldu! Lütfen eski siparişleri silin.');
      }
      throw error;
    }
  }

  /**
   * Sepetten parça sil
   * @param {string} itemId - Silinecek parça ID'si
   * @returns {boolean} - Başarılı ise true
   */
  removeFromCart(itemId) {
    try {
      let cart = this.getCart();
      cart = cart.filter(item => item.id !== itemId);
      localStorage.setItem(this.storageKey, JSON.stringify(cart));
      return true;
    } catch (error) {
      console.error('Remove from cart error:', error);
      return false;
    }
  }

  /**
   * Parça adedini güncelle
   * @param {string} itemId - Parça ID'si
   * @param {number} quantity - Yeni adet
   * @returns {boolean} - Başarılı ise true
   */
  updateQuantity(itemId, quantity) {
    try {
      const cart = this.getCart();
      const item = cart.find(i => i.id === itemId);
      if (item) {
        item.quantity = Math.max(1, parseInt(quantity) || 1);
        localStorage.setItem(this.storageKey, JSON.stringify(cart));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update quantity error:', error);
      return false;
    }
  }

  /**
   * Sepeti getir
   * @returns {Array} - Sipariş kalemleri
   */
  getCart() {
    try {
      const cart = localStorage.getItem(this.storageKey);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Get cart error:', error);
      return [];
    }
  }

  /**
   * Tek bir parçayı getir
   * @param {string} itemId - Parça ID'si
   * @returns {Object|null} - Sipariş kalemi
   */
  getItem(itemId) {
    const cart = this.getCart();
    return cart.find(item => item.id === itemId) || null;
  }

  /**
   * Sepeti temizle
   * @returns {boolean} - Başarılı ise true
   */
  clearCart() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Clear cart error:', error);
      return false;
    }
  }

  /**
   * Sepet özeti
   * @returns {Object} - { totalItems, totalQuantity, totalArea }
   */
  getCartSummary() {
    const cart = this.getCart();

    return {
      totalItems: cart.length, // Parça çeşidi
      totalQuantity: cart.reduce((sum, item) => sum + item.quantity, 0), // Toplam adet
      totalArea: cart.reduce((sum, item) => sum + (item.area * item.quantity), 0) // Toplam alan (m²)
    };
  }

  /**
   * Siparişi JSON olarak export et
   * @returns {string} - JSON string
   */
  exportToJSON() {
    const cart = this.getCart();
    const summary = this.getCartSummary();
    const orderNumber = `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

    const exportData = {
      orderNumber,
      date: new Date().toLocaleString('tr-TR'),
      summary,
      items: cart
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Siparişi CSV olarak export et (Excel uyumlu)
   * @returns {string} - CSV string
   */
  exportToCSV() {
    const cart = this.getCart();
    const summary = this.getCartSummary();
    const orderNumber = `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

    let csv = `Sipariş No:,${orderNumber}\n`;
    csv += `Tarih:,${new Date().toLocaleString('tr-TR')}\n`;
    csv += `\n`;
    csv += `Sıra,Parça Tipi,Parça Adı,Boyutlar,Alan (m²),Adet,Toplam Alan (m²)\n`;

    cart.forEach((item, index) => {
      const dimensions = Object.entries(item.dimensions)
        .map(([key, value]) => `${key}:${value}`)
        .join(' | ');

      const totalArea = (item.area * item.quantity).toFixed(2);

      csv += `${index + 1},"${item.partType}","${item.partName}","${dimensions}",${item.area.toFixed(2)},${item.quantity},${totalArea}\n`;
    });

    csv += `\n`;
    csv += `Özet\n`;
    csv += `Toplam Parça Çeşidi:,${summary.totalItems}\n`;
    csv += `Toplam Adet:,${summary.totalQuantity}\n`;
    csv += `Toplam Alan:,${summary.totalArea.toFixed(2)} m²\n`;

    return csv;
  }

  /**
   * CSV'yi dosya olarak indir
   * @param {string} filename - Dosya adı (default: siparis-YYYYMMDD.csv)
   */
  downloadCSV(filename = null) {
    const csv = this.exportToCSV();
    const orderDate = new Date().toISOString().split('T')[0];
    const defaultFilename = `siparis-${orderDate}.csv`;

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel Turkish chars
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename || defaultFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * LocalStorage kullanım istatistikleri
   * @returns {Object} - { used, available, percentage }
   */
  getStorageStats() {
    try {
      const total = 5 * 1024 * 1024; // 5MB (yaklaşık limit)
      let used = 0;

      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      return {
        used: (used / 1024 / 1024).toFixed(2) + ' MB',
        total: (total / 1024 / 1024).toFixed(2) + ' MB',
        percentage: ((used / total) * 100).toFixed(1) + '%'
      };
    } catch (error) {
      return { used: '?', total: '5 MB', percentage: '?' };
    }
  }
}
