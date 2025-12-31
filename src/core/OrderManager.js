// OrderManager - Sipariş sepetini IndexedDB ile yönetir (büyük kapasite)
import { StorageManager } from './StorageManager.js';

export class OrderManager {
  constructor() {
    this.storageKey = 'ductcalc-orders';
    this.storage = new StorageManager('DuctCalcDB', 'orders', 1);
    this.initialized = false;
  }

  /**
   * Storage'ı başlat ve migrasyon yap
   */
  async init() {
    if (this.initialized) return;

    try {
      await this.storage.init();
      // LocalStorage'dan migrasyon yap (ilk kez)
      await this.storage.migrateFromLocalStorage(this.storageKey);
      this.initialized = true;
    } catch (error) {
      console.error('OrderManager init error:', error);
      // Fallback: localStorage kullan
      this.initialized = false;
    }
  }

  /**
   * Sepete yeni parça ekle
   * @param {Object} orderItem - Sipariş kalemi
   * @returns {Promise<boolean>} - Başarılı ise true
   */
  async addToCart(orderItem) {
    try {
      await this.init();
      await this.storage.addItem(orderItem);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('Depolama limiti doldu! Lütfen eski siparişleri silin.');
      }
      throw error;
    }
  }

  /**
   * Sepetten parça sil
   * @param {string} itemId - Silinecek parça ID'si
   * @returns {Promise<boolean>} - Başarılı ise true
   */
  async removeFromCart(itemId) {
    try {
      await this.init();
      return await this.storage.removeItem(itemId);
    } catch (error) {
      console.error('Remove from cart error:', error);
      return false;
    }
  }

  /**
   * Parça adedini güncelle
   * @param {string} itemId - Parça ID'si
   * @param {number} quantity - Yeni adet
   * @returns {Promise<boolean>} - Başarılı ise true
   */
  async updateQuantity(itemId, quantity) {
    try {
      await this.init();
      const item = await this.storage.getItem(itemId);
      if (item) {
        item.quantity = Math.max(1, parseInt(quantity) || 1);
        return await this.storage.updateItem(item);
      }
      return false;
    } catch (error) {
      console.error('Update quantity error:', error);
      return false;
    }
  }

  /**
   * Sepeti getir
   * @returns {Promise<Array>} - Sipariş kalemleri
   */
  async getCart() {
    try {
      await this.init();
      return await this.storage.getAllItems();
    } catch (error) {
      console.error('Get cart error:', error);
      return [];
    }
  }

  /**
   * Tek bir parçayı getir
   * @param {string} itemId - Parça ID'si
   * @returns {Promise<Object|null>} - Sipariş kalemi
   */
  async getItem(itemId) {
    try {
      await this.init();
      return await this.storage.getItem(itemId);
    } catch (error) {
      console.error('Get item error:', error);
      return null;
    }
  }

  /**
   * Sepeti temizle
   * @returns {Promise<boolean>} - Başarılı ise true
   */
  async clearCart() {
    try {
      await this.init();
      return await this.storage.clearAll();
    } catch (error) {
      console.error('Clear cart error:', error);
      return false;
    }
  }

  /**
   * Sepet özeti
   * @returns {Promise<Object>} - { totalItems, totalQuantity, totalArea, byThickness }
   */
  async getCartSummary() {
    const cart = await this.getCart();

    // Sac kalınlığına göre gruplandırma
    const byThickness = {};

    const summary = cart.reduce((acc, item) => {
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const breakdown = this.getAreaBreakdown(item);
      acc.totalNetArea += breakdown.netArea * quantity;
      acc.totalWasteArea += breakdown.wasteArea * quantity;
      acc.totalArea += breakdown.netArea * quantity;

      // Sac kalınlığına göre grupla (mm cinsinden)
      const thicknessCm = item.params?.t || item.dimensions?.t || 0.12;
      const thicknessMm = (thicknessCm * 10).toFixed(1); // cm -> mm
      const thicknessKey = `${thicknessMm}mm`;

      if (!byThickness[thicknessKey]) {
        byThickness[thicknessKey] = {
          thickness: thicknessMm,
          thicknessCm: thicknessCm,
          netArea: 0,
          wasteArea: 0,
          totalArea: 0,
          itemCount: 0,
          quantity: 0
        };
      }

      byThickness[thicknessKey].netArea += breakdown.netArea * quantity;
      byThickness[thicknessKey].wasteArea += breakdown.wasteArea * quantity;
      byThickness[thicknessKey].totalArea += breakdown.totalArea * quantity;
      byThickness[thicknessKey].itemCount += 1;
      byThickness[thicknessKey].quantity += quantity;

      return acc;
    }, {
      totalItems: cart.length,
      totalQuantity: 0,
      totalArea: 0,
      totalNetArea: 0,
      totalWasteArea: 0
    });

    summary.totalQuantity = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    summary.totalAreaWithWaste = summary.totalNetArea + summary.totalWasteArea;
    summary.totalWastePercent = summary.totalNetArea > 0
      ? (summary.totalWasteArea / summary.totalNetArea) * 100
      : 0;

    // Sac kalınlığına göre sıralı dizi olarak ekle
    summary.byThickness = Object.values(byThickness).sort((a, b) =>
      parseFloat(a.thickness) - parseFloat(b.thickness)
    );

    return summary;
  }

  getAreaBreakdown(item) {
    const areaValue = typeof item.area === 'object' ? (item.area.outer || 0) : parseFloat(item.area) || 0;
    const rawKFactor = Number(item.params?.kFactor);
    const rawWastePercent = Number(item.params?.wastePercent);
    const kFactor = Number.isFinite(rawKFactor) ? rawKFactor : 1;
    const wastePercent = Number.isFinite(rawWastePercent) ? rawWastePercent : 0;
    const appliedWastePercent = item.partType === 'duz-kanal' ? 0 : wastePercent;
    const netArea = areaValue * kFactor;
    const wasteArea = netArea * (appliedWastePercent / 100);
    const totalArea = netArea + wasteArea;

    return {
      baseArea: areaValue,
      netArea,
      wastePercent: appliedWastePercent,
      wasteArea,
      totalArea,
      kFactor
    };
  }

  async exportToJSON() {
    const cart = await this.getCart();
    const summary = await this.getCartSummary();
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
   * @returns {Promise<string>} - CSV string
   */
  async exportToCSV() {
    const cart = await this.getCart();
    const summary = await this.getCartSummary();
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
  async downloadCSV(filename = null) {
    const csv = await this.exportToCSV();
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
   * Türkçe karakterleri PDF uyumlu hale getir
   * jsPDF'in standart fontları Türkçe karakterleri desteklemediği için
   * karakterleri Latin-1 uyumlu eşdeğerlerine çevirir
   */
  turkishToPdfText(text) {
    if (!text) return '';
    return text
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'G')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'U')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 'S')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'O')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C');
  }

  /**
   * PDF'yi dosya olarak indir (jsPDF kullanarak)
   * @param {string} filename - Dosya adı (default: siparis-YYYYMMDD.pdf)
   * @param {Function} onProgress - İlerleme callback (current, total)
   */
  async downloadPDF(filename = null, onProgress = null) {
    const cart = await this.getCart();
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
      compress: true,
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

    // Türkçe karakter desteği için font ayarları
    pdf.setLanguage("tr-TR");

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20; // Daha geniş margin
    const contentWidth = pageWidth - (margin * 2);

    // Her sayfada 2 parça - sayfa sayısı hesaplama
    const partsPerPage = 2;
    const partPages = Math.ceil(cart.length / partsPerPage);
    const totalPages = partPages + 1; // + özet sayfası

    // Parça yüksekliği (sayfa ikiye bölünecek)
    const partHeight = (pageHeight - 20) / 2; // 20mm üst başlık için

    // Her parça için render fonksiyonu
    const renderPart = (item, yStart, partIndex) => {
      const breakdown = this.getAreaBreakdown(item);
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const netArea = breakdown.netArea;
      const netTotal = netArea * quantity;
      const wastePercent = breakdown.wastePercent;
      const totalArea = breakdown.totalArea;
      const totalWithWaste = totalArea * quantity;
      const isDuzKanal = item.partType === 'duz-kanal';

      // Sac kalınlığı (mm cinsinden)
      const thicknessCm = item.params?.t || item.dimensions?.t || 0.12;
      const thicknessMm = (thicknessCm * 10).toFixed(1);

      // Parça başlığı ve alan bilgisi - aynı satırda
      let yPos = yStart;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');

      // Sol taraf: Parça adı
      pdf.text(this.turkishToPdfText(`${item.partName}`), margin, yPos);

      // Sağ taraf: Alan bilgisi
      pdf.setFontSize(8);
      pdf.setTextColor(60, 60, 60);
      const areaInfo = isDuzKanal
        ? `Sac Kalinligi: ${thicknessMm}mm | Alan: ${netArea.toFixed(2)}m2 | Adet: ${quantity} | Toplam: ${netTotal.toFixed(2)}m2`
        : `Sac Kalinligi: ${thicknessMm}mm | Net: ${netArea.toFixed(2)}m2 | Fire: %${wastePercent.toFixed(0)} | Fire Dahil: ${totalArea.toFixed(2)}m2 | Adet: ${quantity} | Toplam: ${totalWithWaste.toFixed(2)}m2`;
      pdf.text(this.turkishToPdfText(areaInfo), pageWidth - margin, yPos, { align: 'right' });

      // 4 screenshot'ı yerleştir (2x2 grid) - kompakt
      yPos += 4;
      const horizontalGap = 3;
      const verticalGap = 3;
      const imgWidth = (contentWidth - horizontalGap) / 2;
      const imgHeight = (partHeight - 20) / 2 - verticalGap; // Kalan alanı 2'ye böl

      const screenshots = [
        { label: 'On', data: item.screenshots.front },
        { label: 'Sag', data: item.screenshots.right },
        { label: 'Ust', data: item.screenshots.top },
        { label: 'Izo', data: item.screenshots.iso }
      ];

      for (let j = 0; j < screenshots.length; j++) {
        const row = Math.floor(j / 2);
        const col = j % 2;
        const x = margin + (col * (imgWidth + horizontalGap));
        const y = yPos + (row * (imgHeight + verticalGap));

        // Görsel çerçevesi (ince border)
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(230, 230, 230);
        pdf.setLineWidth(0.1);
        pdf.rect(x, y, imgWidth, imgHeight, 'FD');

        // Screenshot image (yüksek kalite)
        try {
          pdf.addImage(
            screenshots[j].data,
            'JPEG',
            x,
            y,
            imgWidth,
            imgHeight,
            undefined,
            'SLOW' // Yüksek kalite
          );
        } catch (error) {
          console.warn(`Screenshot ${j} eklenemedi:`, error);
          pdf.setTextColor(200, 200, 200);
          pdf.setFontSize(8);
          pdf.text(this.turkishToPdfText('Gorsel yok'), x + imgWidth / 2, y + imgHeight / 2, { align: 'center' });
        }

        // Label (resim üzerinde sol alt köşede - yarı saydam siyah arka plan)
        pdf.setFillColor(40, 40, 40);
        pdf.rect(x, y + imgHeight - 5, 14, 5, 'F');
        pdf.setFontSize(7);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont(undefined, 'bold');
        pdf.text(this.turkishToPdfText(screenshots[j].label), x + 1.5, y + imgHeight - 1.5);
        pdf.setFont(undefined, 'normal');
      }
    };

    // Parçaları sayfalara yerleştir
    for (let i = 0; i < cart.length; i++) {
      const item = cart[i];
      const positionOnPage = i % partsPerPage; // 0 veya 1

      // İlerleme callback
      if (onProgress) {
        onProgress(i + 1, cart.length);
      }

      // Yeni sayfa ekle (her 2 parçada bir, ilk parça hariç)
      if (i > 0 && positionOnPage === 0) {
        pdf.addPage();
      }

      // İlk sayfada veya yeni sayfada üst başlık çubuğu
      if (positionOnPage === 0) {
        pdf.setFillColor(16, 185, 129);
        pdf.rect(0, 0, pageWidth, 10, 'F');

        const pageNum = Math.floor(i / partsPerPage) + 1;
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.text(this.turkishToPdfText(`Sayfa ${pageNum} / ${totalPages}`), pageWidth - margin, 7, { align: 'right' });

        pdf.setFontSize(9);
        pdf.setFont(undefined, 'bold');
        pdf.text(this.turkishToPdfText('3D Kanal Siparis Sistemi'), margin, 7);
      }

      // Parçanın Y başlangıç pozisyonu
      const yStart = 14 + (positionOnPage * partHeight);

      // Parçayı render et
      renderPart(item, yStart, i);

      // Parçalar arası ayırıcı çizgi (sadece ilk parçadan sonra)
      if (positionOnPage === 0 && i + 1 < cart.length) {
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(1.0);
        pdf.line(margin, yStart + partHeight - 6, pageWidth - margin, yStart + partHeight - 6);
      }
    }

    // Alt bilgi (footer) - her sayfada
    const addFooter = () => {
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.setFont(undefined, 'normal');
      pdf.text(this.turkishToPdfText('DuctCalc'), margin, pageHeight - 5);
      pdf.text(this.turkishToPdfText(`${new Date().toLocaleDateString('tr-TR')}`), pageWidth - margin, pageHeight - 5, { align: 'right' });
    };

    // Tüm parça sayfalarına footer ekle
    for (let p = 1; p <= partPages; p++) {
      pdf.setPage(p);
      addFooter();
    }

    const summary = await this.getCartSummary();
    pdf.addPage();

    pdf.setFillColor(16, 185, 129);
    pdf.rect(0, 0, pageWidth, 12, 'F');

    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text(this.turkishToPdfText(`Sayfa ${totalPages} / ${totalPages}`), pageWidth - margin, 8, { align: 'right' });

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text(this.turkishToPdfText('3D Kanal Siparis Sistemi'), margin, 8);

    let summaryY = margin + 5;
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    pdf.text(this.turkishToPdfText('Siparis Ozeti'), margin, summaryY);

    summaryY += 6;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, summaryY, pageWidth - margin, summaryY);

    summaryY += 6;
    const colName = 60;
    const colQty = 15;
    const colNet = 28;
    const colWaste = 32;
    const colTotal = contentWidth - colName - colQty - colNet - colWaste;
    const headerHeight = 12;
    const rowHeight = 8;

    const xName = margin + 2;
    const xQty = margin + colName + 2;
    const xNet = margin + colName + colQty + 2;
    const xWaste = margin + colName + colQty + colNet + 2;
    const xTotal = margin + colName + colQty + colNet + colWaste + 2;

    pdf.setFillColor(245, 247, 250);
    pdf.rect(margin, summaryY, contentWidth, headerHeight, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(60, 60, 60);
    pdf.setFont(undefined, 'bold');
    pdf.text(this.turkishToPdfText('Parca Adi'), xName, summaryY + 8);
    pdf.text(this.turkishToPdfText('Adet'), xQty, summaryY + 8);
    pdf.text(this.turkishToPdfText('Net Birim'), xNet, summaryY + 5);
    pdf.text(this.turkishToPdfText('Alan'), xNet, summaryY + 9);
    pdf.text(this.turkishToPdfText('Fire Dahil'), xWaste, summaryY + 5);
    pdf.text(this.turkishToPdfText('Alan'), xWaste, summaryY + 9);
    pdf.text(this.turkishToPdfText('Toplam'), xTotal, summaryY + 5);
    pdf.text(this.turkishToPdfText('Alan'), xTotal, summaryY + 9);

    summaryY += headerHeight;
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'normal');

    cart.forEach((item) => {
      const breakdown = this.getAreaBreakdown(item);
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const unitNet = breakdown.netArea;
      const unitWaste = breakdown.totalArea;
      const lineArea = unitWaste * quantity;

      pdf.text(this.turkishToPdfText(item.partName || item.partType), xName, summaryY + 5.5);
      pdf.text(this.turkishToPdfText(String(quantity)), xQty, summaryY + 5.5);
      pdf.text(this.turkishToPdfText(unitNet.toFixed(2)), xNet, summaryY + 5.5);
      pdf.text(this.turkishToPdfText(unitWaste.toFixed(2)), xWaste, summaryY + 5.5);
      pdf.text(this.turkishToPdfText(lineArea.toFixed(2)), xTotal, summaryY + 5.5);
      summaryY += rowHeight;
    });

    summaryY += 4;
    pdf.setFillColor(240, 253, 244);
    pdf.roundedRect(margin, summaryY, contentWidth, 12, 2, 2, 'F');
    pdf.setFontSize(10);
    pdf.setTextColor(22, 101, 52);
    pdf.setFont(undefined, 'bold');
    pdf.text(this.turkishToPdfText(`Toplam Adet: ${summary.totalQuantity}`), margin + 5, summaryY + 8);
    pdf.text(this.turkishToPdfText(`Toplam Alan: ${summary.totalAreaWithWaste.toFixed(2)} m2`), margin + 80, summaryY + 8);

    // Sac Kalınlığına Göre Detay
    if (summary.byThickness && summary.byThickness.length > 0) {
      summaryY += 20;

      // Başlık
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'bold');
      pdf.text(this.turkishToPdfText('Sac Kalinligina Gore Detay'), margin, summaryY);

      summaryY += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(margin, summaryY, pageWidth - margin, summaryY);

      summaryY += 6;

      // Tablo başlıkları
      const thColThickness = 30;
      const thColQty = 25;
      const thColNet = 35;
      const thColWaste = 35;
      const thColTotal = contentWidth - thColThickness - thColQty - thColNet - thColWaste;

      const thXThickness = margin + 2;
      const thXQty = margin + thColThickness + 2;
      const thXNet = margin + thColThickness + thColQty + 2;
      const thXWaste = margin + thColThickness + thColQty + thColNet + 2;
      const thXTotal = margin + thColThickness + thColQty + thColNet + thColWaste + 2;

      pdf.setFillColor(99, 102, 241);
      pdf.rect(margin, summaryY, contentWidth, 10, 'F');
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(undefined, 'bold');
      pdf.text(this.turkishToPdfText('Kalinlik'), thXThickness, summaryY + 7);
      pdf.text(this.turkishToPdfText('Adet'), thXQty, summaryY + 7);
      pdf.text(this.turkishToPdfText('Net Alan'), thXNet, summaryY + 7);
      pdf.text(this.turkishToPdfText('Atik'), thXWaste, summaryY + 7);
      pdf.text(this.turkishToPdfText('Toplam'), thXTotal, summaryY + 7);

      summaryY += 10;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, 'normal');

      summary.byThickness.forEach((t, index) => {
        // Alternatif satır rengi
        if (index % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, summaryY, contentWidth, 8, 'F');
        }

        pdf.text(this.turkishToPdfText(`${t.thickness} mm`), thXThickness, summaryY + 5.5);
        pdf.text(this.turkishToPdfText(`${t.quantity}`), thXQty, summaryY + 5.5);
        pdf.text(this.turkishToPdfText(`${t.netArea.toFixed(2)} m2`), thXNet, summaryY + 5.5);
        pdf.text(this.turkishToPdfText(`${t.wasteArea.toFixed(2)} m2`), thXWaste, summaryY + 5.5);
        pdf.setFont(undefined, 'bold');
        pdf.text(this.turkishToPdfText(`${t.totalArea.toFixed(2)} m2`), thXTotal, summaryY + 5.5);
        pdf.setFont(undefined, 'normal');

        summaryY += 8;
      });

      // Toplam satırı
      summaryY += 2;
      pdf.setFillColor(16, 185, 129);
      pdf.roundedRect(margin, summaryY, contentWidth, 10, 2, 2, 'F');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont(undefined, 'bold');
      pdf.text(this.turkishToPdfText('GENEL TOPLAM'), thXThickness, summaryY + 7);
      pdf.text(this.turkishToPdfText(`${summary.totalQuantity}`), thXQty, summaryY + 7);
      pdf.text(this.turkishToPdfText(`${summary.totalNetArea.toFixed(2)} m2`), thXNet, summaryY + 7);
      pdf.text(this.turkishToPdfText(`${summary.totalWasteArea.toFixed(2)} m2`), thXWaste, summaryY + 7);
      pdf.text(this.turkishToPdfText(`${summary.totalAreaWithWaste.toFixed(2)} m2`), thXTotal, summaryY + 7);
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
      return { used: '-', total: '5 MB', percentage: '-' };
    }
  }
}
