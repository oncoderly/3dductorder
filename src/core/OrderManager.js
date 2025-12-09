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
      totalArea: cart.reduce((sum, item) => {
        const area = parseFloat(item.area) || 0;
        return sum + (area * item.quantity);
      }, 0) // Toplam alan (m²)
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
   * PDF'yi dosya olarak indir (jsPDF kullanarak)
   * @param {string} filename - Dosya adı (default: siparis-YYYYMMDD.pdf)
   * @param {Function} onProgress - İlerleme callback (current, total)
   */
  async downloadPDF(filename = null, onProgress = null) {
    const cart = this.getCart();
    if (cart.length === 0) {
      throw new Error('Sepet boş! PDF oluşturulamaz.');
    }

    const orderDate = new Date().toISOString().split('T')[0];
    const defaultFilename = `siparis-${orderDate}.pdf`;

    // jsPDF'i dinamik olarak yükle
    const { jsPDF } = await this.loadJsPDF();

    // A4 portrait (210 x 297 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Her parça için bir sayfa oluştur
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];

      // İlerleme callback
      if (onProgress) {
        onProgress(i + 1, cart.length);
      }

      // Yeni sayfa ekle (ilk sayfa hariç)
      if (i > 0) {
        pdf.addPage();
      }

      // Sayfa numarası
      const pageNum = i + 1;
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Sayfa ${pageNum} / ${cart.length}`, pageWidth - margin, pageHeight - 5, { align: 'right' });

      // Başlık
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Parça ${pageNum}: ${item.partName}`, margin, margin + 10);

      // Tarih
      const date = new Date(item.timestamp);
      const dateStr = date.toLocaleString('tr-TR');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(dateStr, margin, margin + 16);

      // Boyutlar
      let yPos = margin + 28;
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Boyutlar:', margin, yPos);

      yPos += 6;
      pdf.setFontSize(10);
      const dimensions = Object.entries(item.dimensions)
        .map(([key, value]) => `${key}: ${Number.isInteger(value) ? value : value.toFixed(1)} cm`)
        .join(' | ');
      pdf.text(dimensions, margin, yPos);

      // Alan bilgisi
      yPos += 10;
      pdf.setFontSize(11);
      pdf.text(`Alan: ${parseFloat(item.area).toFixed(2)} m²`, margin, yPos);
      pdf.text(`Adet: ${item.quantity}`, margin + 60, yPos);
      const totalArea = (parseFloat(item.area) * item.quantity).toFixed(2);
      pdf.text(`Toplam: ${totalArea} m²`, margin + 100, yPos);

      // 4 screenshot'ı yerleştir (2x2 grid)
      yPos += 15;
      const imgWidth = (contentWidth - 10) / 2;
      const imgHeight = imgWidth * 0.75; // 4:3 aspect ratio

      const screenshots = [
        { label: 'Ön Görünüm', data: item.screenshots.front },
        { label: 'Sağ Görünüm', data: item.screenshots.right },
        { label: 'Üst Görünüm', data: item.screenshots.top },
        { label: 'İzometrik', data: item.screenshots.iso }
      ];

      for (let j = 0; j < screenshots.length; j++) {
        const row = Math.floor(j / 2);
        const col = j % 2;
        const x = margin + (col * (imgWidth + 10));
        const y = yPos + (row * (imgHeight + 15));

        // Screenshot label
        pdf.setFontSize(9);
        pdf.setTextColor(50, 50, 50);
        pdf.text(screenshots[j].label, x, y);

        // Screenshot image
        try {
          pdf.addImage(
            screenshots[j].data,
            'PNG',
            x,
            y + 3,
            imgWidth,
            imgHeight,
            undefined,
            'FAST' // Compression
          );
        } catch (error) {
          console.warn(`Screenshot ${j} eklenemedi:`, error);
          // Hata durumunda placeholder
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(x, y + 3, imgWidth, imgHeight);
        }
      }
    }

    // PDF'i indir
    pdf.save(filename || defaultFilename);
  }

  /**
   * jsPDF kütüphanesini dinamik olarak yükle
   * @returns {Promise} - jsPDF modülü
   */
  async loadJsPDF() {
    // Eğer zaten yüklenmişse direkt döndür
    if (window.jspdf && window.jspdf.jsPDF) {
      return window.jspdf;
    }

    // CDN'den yükle
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.async = true;
      script.onload = () => {
        if (window.jspdf && window.jspdf.jsPDF) {
          resolve(window.jspdf);
        } else {
          reject(new Error('jsPDF yüklenemedi'));
        }
      };
      script.onerror = () => reject(new Error('jsPDF script yüklenemedi'));
      document.head.appendChild(script);
    });
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
