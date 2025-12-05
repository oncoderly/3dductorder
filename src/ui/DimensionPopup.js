// DimensionPopup - Mobil dokunmatik ölçü düzenleme popup'ı
import * as THREE from 'three';

export class DimensionPopup {
  constructor(container, onUpdate) {
    this.container = container;
    this.onUpdate = onUpdate;
    this.isVisible = false;
    this.currentParam = null;
    this.currentPart = null;

    this.createPopup();
    this.attachBackdropListener();
  }

  createPopup() {
    // Popup container
    this.popup = document.createElement('div');
    this.popup.className = 'dimension-popup';
    this.popup.style.display = 'none';

    // Header - Parametre adı
    this.header = document.createElement('div');
    this.header.className = 'dimension-popup-header';
    this.popup.appendChild(this.header);

    // Controls container
    const controls = document.createElement('div');
    controls.className = 'dimension-popup-controls';

    // Sol ikon (mavi daire)
    const icon = document.createElement('div');
    icon.className = 'dimension-popup-icon';
    icon.innerHTML = '📏';
    controls.appendChild(icon);

    // -5 Butonu (kırmızı)
    this.minusBtn = document.createElement('button');
    this.minusBtn.className = 'dimension-popup-btn minus';
    this.minusBtn.textContent = '-5';
    this.minusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustValue(-5);
    });
    controls.appendChild(this.minusBtn);

    // Slider
    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.className = 'dimension-popup-slider';
    this.slider.min = '0';
    this.slider.max = '300';
    this.slider.step = '0.1';
    this.slider.addEventListener('input', (e) => {
      e.stopPropagation();
      this.updateValue(parseFloat(e.target.value));
    });
    controls.appendChild(this.slider);

    // Değer display (beyaz kutu)
    this.valueDisplay = document.createElement('div');
    this.valueDisplay.className = 'dimension-popup-value';
    this.valueDisplay.textContent = '50';
    controls.appendChild(this.valueDisplay);

    // +5 Butonu (yeşil)
    this.plusBtn = document.createElement('button');
    this.plusBtn.className = 'dimension-popup-btn plus';
    this.plusBtn.textContent = '+5';
    this.plusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustValue(+5);
    });
    controls.appendChild(this.plusBtn);

    // Birim (cm)
    const unit = document.createElement('div');
    unit.className = 'dimension-popup-unit';
    unit.textContent = 'cm';
    controls.appendChild(unit);

    this.popup.appendChild(controls);

    // DOM'a ekle
    this.container.appendChild(this.popup);
  }

  attachBackdropListener() {
    // Document'e click listener - popup dışına tıklayınca kapat
    this.documentClickHandler = (e) => {
      if (this.isVisible && !this.popup.contains(e.target)) {
        this.hide();
      }
    };

    // Timeout ile ekle (popup açıldıktan sonra aktif olması için)
    setTimeout(() => {
      document.addEventListener('click', this.documentClickHandler);
      document.addEventListener('touchstart', this.documentClickHandler);
    }, 100);
  }

  show(paramData, part, clickEvent) {
    this.currentParam = paramData;
    this.currentPart = part;
    this.isVisible = true;

    // Header'ı güncelle
    this.header.textContent = paramData.label;

    // Slider ve değeri güncelle
    const currentValue = part.params[paramData.key];
    this.slider.value = currentValue;
    this.valueDisplay.textContent = currentValue.toFixed(1);

    // Min/max değerlerini ayarla (parametre tanımından)
    if (paramData.min !== undefined) {
      this.slider.min = paramData.min;
    }
    if (paramData.max !== undefined) {
      this.slider.max = paramData.max;
    }

    // Görünür yap
    this.popup.style.display = 'block';

    // Pozisyonu ayarla (tıklanan yere yakın)
    this.positionPopup(clickEvent);

    // Animasyon için class ekle
    setTimeout(() => {
      this.popup.classList.add('visible');
    }, 10);
  }

  hide() {
    this.isVisible = false;
    this.popup.classList.remove('visible');

    setTimeout(() => {
      this.popup.style.display = 'none';
    }, 200);
  }

  positionPopup(clickEvent) {
    if (!clickEvent) {
      // Event yoksa ekranın ortasına yerleştir
      this.popup.style.left = '50%';
      this.popup.style.top = '50%';
      this.popup.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const rect = this.container.getBoundingClientRect();
    const popupRect = this.popup.getBoundingClientRect();

    // Tıklanan pozisyon (viewport koordinatları)
    let x = clickEvent.clientX - rect.left;
    let y = clickEvent.clientY - rect.top;

    // Popup'ı merkezle
    x -= popupRect.width / 2;
    y -= popupRect.height / 2;

    // Ekran sınırlarını kontrol et
    const padding = 20;
    x = Math.max(padding, Math.min(x, rect.width - popupRect.width - padding));
    y = Math.max(padding, Math.min(y, rect.height - popupRect.height - padding));

    this.popup.style.left = `${x}px`;
    this.popup.style.top = `${y}px`;
    this.popup.style.transform = 'none';
  }

  adjustValue(delta) {
    const currentValue = parseFloat(this.slider.value);
    const newValue = Math.max(
      parseFloat(this.slider.min),
      Math.min(parseFloat(this.slider.max), currentValue + delta)
    );

    this.slider.value = newValue;
    this.updateValue(newValue);
  }

  updateValue(value) {
    // Değer display'i güncelle
    this.valueDisplay.textContent = value.toFixed(1);

    // Part parametresini güncelle
    if (this.currentPart && this.currentParam) {
      this.currentPart.params[this.currentParam.key] = value;

      // Part'ı yeniden oluştur
      this.currentPart.rebuild();

      // Callback çağır (varsa)
      if (this.onUpdate) {
        this.onUpdate(this.currentParam.key, value);
      }
    }
  }

  destroy() {
    // Event listener'ları temizle
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
      document.removeEventListener('touchstart', this.documentClickHandler);
    }

    if (this.popup) this.popup.remove();
  }
}
