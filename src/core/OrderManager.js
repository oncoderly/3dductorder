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
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20; // Daha geniş margin
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

      // Üst başlık çubuğu (renkli)
      pdf.setFillColor(16, 185, 129); // Yeşil gradient başlangıç rengi
      pdf.rect(0, 0, pageWidth, 12, 'F');

      // Sayfa numarası (beyaz, üst çubukta)
      const pageNum = i + 1;
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`Sayfa ${pageNum} / ${cart.length}`, pageWidth - margin, 8, { align: 'right' });

      // Logo/Başlık (beyaz, üst çubukta)
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('3D Kanal Sipariş Sistemi', margin, 8);

      // Parça başlığı (büyük, bold)
      let yPos = margin + 5;
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${item.partName}`, margin, yPos);

      // Tarih (sağ üstte)
      const date = new Date(item.timestamp);
      const dateStr = date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont(undefined, 'normal');
      pdf.text(dateStr, pageWidth - margin, yPos, { align: 'right' });

      // Ayırıcı çizgi
      yPos += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPos, pageWidth - margin, yPos);

      // Bilgi kutuları (cards)
      yPos += 8;

      // Boyutlar kutusu
      pdf.setFillColor(245, 247, 250);
      pdf.roundedRect(margin, yPos, contentWidth, 18, 2, 2, 'F');

      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.setFont(undefined, 'bold');
      pdf.text('Boyutlar', margin + 5, yPos + 6);

      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      const dimensions = Object.entries(item.dimensions)
        .map(([key, value]) => `${key}: ${Number.isInteger(value) ? value : value.toFixed(1)} cm`)
        .join('  •  ');
      pdf.text(dimensions, margin + 5, yPos + 13);

      // Alan bilgisi kutusu
      yPos += 22;
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(margin, yPos, contentWidth, 18, 2, 2, 'F');

      pdf.setFontSize(10);
      pdf.setTextColor(22, 101, 52);
      pdf.setFont(undefined, 'bold');
      pdf.text('Alan Hesabı', margin + 5, yPos + 6);

      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      const totalArea = (parseFloat(item.area) * item.quantity).toFixed(2);
      pdf.text(`Birim Alan: ${parseFloat(item.area).toFixed(2)} m²  •  Adet: ${item.quantity}  •  Toplam Alan: ${totalArea} m²`, margin + 5, yPos + 13);

      // Görüntüler başlığı
      yPos += 24;
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      pdf.text('3D Görünümler', margin, yPos);

      // 4 screenshot'ı yerleştir (2x2 grid)
      yPos += 6;
      const horizontalGap = 4; // Görünümler arası boşluk
      const verticalGap = 6;
      const imgWidth = (contentWidth - horizontalGap) / 2;
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
        const x = margin + (col * (imgWidth + horizontalGap));
        const y = yPos + (row * (imgHeight + verticalGap + 6));

        // Görsel çerçevesi (beyaz arka plan + gölge efekti)
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(220, 220, 220);
        pdf.setLineWidth(0.2);
        pdf.roundedRect(x - 1, y - 1, imgWidth + 2, imgHeight + 8, 2, 2, 'FD');

        // Screenshot label (çerçeve içinde üstte)
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont(undefined, 'normal');
        pdf.text(screenshots[j].label, x + imgWidth / 2, y + 4, { align: 'center' });

        // Screenshot image (yüksek kalite)
        try {
          pdf.addImage(
            screenshots[j].data,
            'PNG',
            x,
            y + 5,
            imgWidth,
            imgHeight,
            undefined,
            'SLOW' // Yüksek kalite
          );
        } catch (error) {
          console.warn(`Screenshot ${j} eklenemedi:`, error);
          // Hata durumunda placeholder
          pdf.setDrawColor(240, 240, 240);
          pdf.setFillColor(250, 250, 250);
          pdf.rect(x, y + 5, imgWidth, imgHeight, 'FD');
          pdf.setTextColor(180, 180, 180);
          pdf.setFontSize(10);
          pdf.text('Görsel yüklenemedi', x + imgWidth / 2, y + 5 + imgHeight / 2, { align: 'center' });
        }
      }

      // Alt bilgi (footer)
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont(undefined, 'normal');
      pdf.text('3D Kanal Sipariş Sistemi - DuctCalc', margin, pageHeight - 8);
      pdf.text(`Oluşturulma: ${new Date().toLocaleDateString('tr-TR')}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
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
