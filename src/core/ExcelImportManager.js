export class ExcelImportManager {
  constructor({ createPart, getPartConfig, orderManager, screenshotCapture = null, onPartReady = null }) {
    this.createPart = createPart;
    this.getPartConfig = getPartConfig;
    this.orderManager = orderManager;
    this.screenshotCapture = screenshotCapture;
    this.onPartReady = onPartReady;
    this.partMetaCache = new Map();
  }

  async loadXlsx() {
    if (window.XLSX) return window.XLSX;

    await new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-xlsx-loader="true"]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.async = true;
      script.dataset.xlsxLoader = 'true';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Excel kutuphanesi yuklenemedi. Internet baglantisini kontrol edin.'));
      document.head.appendChild(script);
    });

    if (!window.XLSX) {
      throw new Error('Excel kutuphanesi hazir degil.');
    }

    return window.XLSX;
  }

  getSheetName(partKey) {
    return partKey.slice(0, 31);
  }

  getImportableParams(partKey) {
    if (this.partMetaCache.has(partKey)) return this.partMetaCache.get(partKey);

    const part = this.createPart(partKey);
    if (!part) throw new Error(`Parca olusturulamadi: ${partKey}`);

    const definitions = part.getParameterDefinitions() || {};
    const params = [];
    const seen = new Set();
    const blockedGroupWords = ['görün', 'gorun', 'renk', 'flan', 'malzeme', 'alan', 'sahne', 'ölçülendirme', 'olculendirme'];

    const addParam = (param) => {
      if (!param || !param.key || seen.has(param.key)) return;
      const type = param.type || 'number';
      if (type === 'color' || type === 'checkbox') return;
      params.push(param);
      seen.add(param.key);
    };

    (definitions.dimensions || []).forEach(addParam);

    (definitions.groups || []).forEach((group) => {
      const groupName = String(group.name || '').toLowerCase();
      if (blockedGroupWords.some(word => groupName.includes(word))) return;
      (group.params || []).forEach(addParam);
    });

    const meta = {
      partKey,
      sheetName: this.getSheetName(partKey),
      headers: ['ADET', ...params.map(param => param.key)],
      params
    };
    this.partMetaCache.set(partKey, meta);
    return meta;
  }

  getAllPartMetas(parts) {
    return parts.map(part => this.getImportableParams(part.key));
  }

  async downloadTemplate(parts) {
    const XLSX = await this.loadXlsx();
    const workbook = XLSX.utils.book_new();

    const readme = XLSX.utils.aoa_to_sheet([
      ['3D Duct Order Excel Import Sablonu'],
      ['Kural'],
      ['Her parca kendi sayfasindadir. Sayfa adlari ve birinci satirdaki kolon basliklari degistirilmemelidir.'],
      ['Kullanim'],
      ['Ilgili parca sayfasinda 2. satirdan itibaren veri girin. ADET zorunludur. Bos satirlar import edilmez.'],
      ['Not'],
      ['Basliklar esnek okunmaz; sablondaki kolon adlari birebir kullanilir.']
    ]);
    readme['!cols'] = [{ wch: 90 }];
    XLSX.utils.book_append_sheet(workbook, readme, '_KULLANIM');

    this.getAllPartMetas(parts).forEach((meta) => {
      const sheet = XLSX.utils.aoa_to_sheet([meta.headers]);
      sheet['!cols'] = meta.headers.map(header => ({ wch: Math.max(12, header.length + 4) }));
      sheet['!freeze'] = { xSplit: 0, ySplit: 1 };
      XLSX.utils.book_append_sheet(workbook, sheet, meta.sheetName);
    });

    XLSX.writeFile(workbook, `3dductorder-import-sablonu.xlsx`);
  }

  normalizeCell(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  parseNumber(value, label) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const text = this.normalizeCell(value).replace(',', '.');
    if (!text) throw new Error(`${label} bos olamaz.`);
    const number = Number(text);
    if (!Number.isFinite(number)) throw new Error(`${label} sayi olmali.`);
    return number;
  }

  parseQuantity(value) {
    const quantity = Math.floor(this.parseNumber(value, 'ADET'));
    if (quantity < 1) throw new Error('ADET 1 veya daha buyuk olmali.');
    return quantity;
  }

  validateHeaders(sheetName, actualHeaders, expectedHeaders) {
    if (actualHeaders.length < expectedHeaders.length) {
      throw new Error(`${sheetName}: Baslik sayisi eksik. Beklenen: ${expectedHeaders.join(', ')}`);
    }

    expectedHeaders.forEach((expected, index) => {
      const actual = this.normalizeCell(actualHeaders[index]);
      if (actual !== expected) {
        throw new Error(`${sheetName}: ${index + 1}. kolon "${expected}" olmali, mevcut "${actual || '(bos)'}".`);
      }
    });
  }

  rowIsEmpty(row, expectedLength) {
    for (let i = 0; i < expectedLength; i++) {
      if (this.normalizeCell(row[i]) !== '') return false;
    }
    return true;
  }

  async waitForSceneFrame() {
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => setTimeout(resolve, 120));
  }

  async importFile(file, parts) {
    const XLSX = await this.loadXlsx();
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const partMetas = this.getAllPartMetas(parts);
    const summary = { added: 0, skipped: 0, errors: [], lastPart: null, lastPartKey: null };

    for (const meta of partMetas) {
      const sheet = workbook.Sheets[meta.sheetName];
      if (!sheet) continue;

      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });
      if (!rows.length) continue;

      try {
        this.validateHeaders(meta.sheetName, rows[0] || [], meta.headers);
      } catch (error) {
        summary.errors.push(error.message);
        continue;
      }

      for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex] || [];
        if (this.rowIsEmpty(row, meta.headers.length)) {
          summary.skipped += 1;
          continue;
        }

        try {
          const quantity = this.parseQuantity(row[0]);
          const part = this.createPart(meta.partKey);

          meta.params.forEach((param, paramIndex) => {
            const value = row[paramIndex + 1];
            const type = param.type || 'number';

            if (type === 'select') {
              const text = this.normalizeCell(value);
              const validValues = (param.options || []).map(option => option.value);
              if (!validValues.includes(text)) {
                throw new Error(`${param.key} icin gecerli degerler: ${validValues.join(', ')}`);
              }
              part.params[param.key] = text;
              return;
            }

            part.params[param.key] = this.parseNumber(value, param.key);
          });

          if (this.onPartReady) await this.onPartReady(part, meta.partKey, 'before-rebuild');
          part.rebuild();
          if (this.onPartReady) await this.onPartReady(part, meta.partKey, 'after-rebuild');
          await this.waitForSceneFrame();

          const screenshots = this.screenshotCapture
            ? await this.screenshotCapture.captureAllViews(false)
            : null;

          const partConfig = this.getPartConfig(meta.partKey);
          const orderItem = {
            id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            timestamp: Date.now(),
            partType: meta.partKey,
            partName: partConfig ? partConfig.name : meta.partKey,
            params: part.exportParams(),
            dimensions: part.getDimensions(),
            area: part.calculateArea().outer || 0,
            quantity,
            screenshots,
            source: 'excel-import'
          };

          await this.orderManager.addToCart(orderItem);
          summary.added += 1;
          summary.lastPart = part;
          summary.lastPartKey = meta.partKey;
        } catch (error) {
          summary.errors.push(`${meta.sheetName} satir ${rowIndex + 1}: ${error.message}`);
        }
      }
    }

    return summary;
  }
}
