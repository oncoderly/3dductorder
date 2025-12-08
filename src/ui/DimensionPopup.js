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
    this.popup.style.touchAction = 'none'; // Mobil scroll'u engelle

    // Android için inline style'larla pozisyon ve z-index'i zorla
    this.popup.style.position = 'fixed';
    this.popup.style.zIndex = '999999';

    // CSS yüklenmemişse inline style ile tüm stilleri uygula
    this.popup.style.background = 'linear-gradient(135deg, #2c2c3e 0%, #1a1a2e 100%)';
    this.popup.style.borderRadius = '16px';
    this.popup.style.padding = '16px';
    this.popup.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6)';
    this.popup.style.minWidth = '320px';
    this.popup.style.maxWidth = '90vw';

    // Header - Parametre adı
    this.header = document.createElement('div');
    this.header.className = 'dimension-popup-header';
    this.header.style.color = '#ffffff';
    this.header.style.fontSize = '14px';
    this.header.style.fontWeight = '600';
    this.header.style.marginBottom = '12px';
    this.header.style.textAlign = 'center';
    this.header.style.textTransform = 'uppercase';
    this.header.style.letterSpacing = '0.5px';
    this.popup.appendChild(this.header);

    // Controls container
    const controls = document.createElement('div');
    controls.className = 'dimension-popup-controls';
    controls.style.display = 'flex';
    controls.style.alignItems = 'center';
    controls.style.gap = '8px';

    // -5 Butonu (kırmızı)
    this.minusBtn = document.createElement('button');
    this.minusBtn.className = 'dimension-popup-btn minus';
    this.minusBtn.textContent = '-5';
    this.minusBtn.style.width = '48px';
    this.minusBtn.style.height = '48px';
    this.minusBtn.style.border = 'none';
    this.minusBtn.style.borderRadius = '8px';
    this.minusBtn.style.fontSize = '16px';
    this.minusBtn.style.fontWeight = '700';
    this.minusBtn.style.background = 'linear-gradient(135deg, #ff4757 0%, #e84118 100%)';
    this.minusBtn.style.color = 'white';
    this.minusBtn.style.cursor = 'pointer';
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
    this.slider.style.flex = '1';
    this.slider.style.height = '8px';
    this.slider.style.background = 'linear-gradient(90deg, #3a3a4e 0%, #4a4a5e 100%)';
    this.slider.style.borderRadius = '4px';
    this.slider.style.minWidth = '100px';
    this.slider.addEventListener('input', (e) => {
      e.stopPropagation();
      this.updateValue(parseFloat(e.target.value));
    });
    controls.appendChild(this.slider);

    // Değer display (beyaz kutu)
    this.valueDisplay = document.createElement('div');
    this.valueDisplay.className = 'dimension-popup-value';
    this.valueDisplay.textContent = '50';
    this.valueDisplay.style.minWidth = '50px';
    this.valueDisplay.style.height = '48px';
    this.valueDisplay.style.background = '#ffffff';
    this.valueDisplay.style.color = '#1a1a2e';
    this.valueDisplay.style.borderRadius = '8px';
    this.valueDisplay.style.display = 'flex';
    this.valueDisplay.style.alignItems = 'center';
    this.valueDisplay.style.justifyContent = 'center';
    this.valueDisplay.style.fontSize = '18px';
    this.valueDisplay.style.fontWeight = '700';
    controls.appendChild(this.valueDisplay);

    // +5 Butonu (yeşil)
    this.plusBtn = document.createElement('button');
    this.plusBtn.className = 'dimension-popup-btn plus';
    this.plusBtn.textContent = '+5';
    this.plusBtn.style.width = '48px';
    this.plusBtn.style.height = '48px';
    this.plusBtn.style.border = 'none';
    this.plusBtn.style.borderRadius = '8px';
    this.plusBtn.style.fontSize = '16px';
    this.plusBtn.style.fontWeight = '700';
    this.plusBtn.style.background = 'linear-gradient(135deg, #00d2ff 0%, #00c853 100%)';
    this.plusBtn.style.color = 'white';
    this.plusBtn.style.cursor = 'pointer';
    this.plusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustValue(+5);
    });
    controls.appendChild(this.plusBtn);

    // Birim (cm)
    const unit = document.createElement('div');
    unit.className = 'dimension-popup-unit';
    unit.textContent = 'cm';
    unit.style.color = '#ffffff';
    unit.style.fontSize = '14px';
    unit.style.fontWeight = '600';
    controls.appendChild(unit);

    this.popup.appendChild(controls);

    // DOM'a ekle
    this.container.appendChild(this.popup);
  }

  attachBackdropListener() {
    // Document'e click listener - popup dışına tıklayınca kapat
    this.documentClickHandler = (e) => {
      console.log('🔔 Backdrop click:', {
        isVisible: this.isVisible,
        target: e.target.className,
        isDimensionLabel: e.target.classList.contains('dimension-label'),
        containsTarget: this.popup.contains(e.target)
      });

      if (this.isVisible && !this.popup.contains(e.target)) {
        // Popup açılışını tetikleyen element değilse kapat
        if (!e.target.classList.contains('dimension-label')) {
          console.log('❌ Hiding popup via backdrop');
          this.hide();
        } else {
          console.log('⏭️ Dimension label clicked, not hiding');
        }
      }
    };

    // Mobil için touchend, desktop için click
    // Timeout ile ekle (popup açıldıktan sonra aktif olması için)
    this.attachListenerTimeout = setTimeout(() => {
      console.log('✅ Backdrop listeners attached');
      document.addEventListener('click', this.documentClickHandler, { passive: true });
      document.addEventListener('touchend', this.documentClickHandler, { passive: true });
    }, 150);
  }

  show(paramData, part, clickEvent) {
    console.log('🎯 DimensionPopup.show() called:', {
      param: paramData.label,
      part: part.constructor.name,
      event: clickEvent,
      isVisible: this.isVisible
    });

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
    console.log('✅ Popup display set to block');

    // Pozisyonu ayarla (tıklanan yere yakın)
    this.positionPopup(clickEvent);
    console.log('✅ Popup positioned');

    // Animasyon için class ekle
    setTimeout(() => {
      this.popup.classList.add('visible');
      console.log('✅ Popup visible class added');
    }, 10);
  }

  hide() {
    console.log('🚫 DimensionPopup.hide() called');
    this.isVisible = false;
    this.popup.classList.remove('visible');

    setTimeout(() => {
      this.popup.style.display = 'none';
      console.log('🚫 Popup display set to none');
    }, 200);
  }

  positionPopup(clickEvent) {
    if (!clickEvent) {
      // Event yoksa ekranın ortasına yerleştir
      this.popup.style.left = '50%';
      this.popup.style.top = '50%';
      // Merkezleme için margin-left ve margin-top kullan (transform yerine)
      const popupRect = this.popup.getBoundingClientRect();
      this.popup.style.marginLeft = `${-popupRect.width / 2}px`;
      this.popup.style.marginTop = `${-popupRect.height / 2}px`;
      console.log('📍 Popup centered (no event)');
      return;
    }

    const rect = this.container.getBoundingClientRect();
    const popupRect = this.popup.getBoundingClientRect();

    console.log('📍 Position calculation:', {
      container: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      popup: { width: popupRect.width, height: popupRect.height },
      click: { x: clickEvent.clientX, y: clickEvent.clientY }
    });

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
    // transform'u 'none' yapma - CSS'teki scale ile çakışıyor
    // this.popup.style.transform = 'none';

    console.log('📍 Popup positioned at:', { x, y });

    // Computed style'ı da kontrol edelim
    const computed = window.getComputedStyle(this.popup);
    console.log('📍 Computed styles:', {
      display: computed.display,
      opacity: computed.opacity,
      transform: computed.transform,
      zIndex: computed.zIndex,
      position: computed.position
    });
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
    // Timeout'ları temizle
    if (this.attachListenerTimeout) {
      clearTimeout(this.attachListenerTimeout);
    }

    // Event listener'ları temizle
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
      document.removeEventListener('touchend', this.documentClickHandler);
    }

    if (this.popup) this.popup.remove();
  }
}
