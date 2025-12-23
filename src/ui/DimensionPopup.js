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
    this.popup.style.background = 'linear-gradient(135deg, rgba(44,44,62,0.96) 0%, rgba(26,26,46,0.94) 100%)';
    this.popup.style.backdropFilter = 'blur(12px)';
    this.popup.style.border = '1px solid rgba(255,255,255,0.08)';
    this.popup.style.borderRadius = '16px';
    this.popup.style.padding = '16px';
    this.popup.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.55)';
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
    controls.style.gap = '10px';
    controls.style.padding = '4px';
    controls.style.background = 'rgba(255,255,255,0.03)';
    controls.style.borderRadius = '12px';
    controls.style.border = '1px solid rgba(255,255,255,0.06)';

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

    // -1 Butonu (turuncu)
    this.minusOneBtn = document.createElement('button');
    this.minusOneBtn.className = 'dimension-popup-btn step1 minus1';
    this.minusOneBtn.textContent = '-1';
    this.minusOneBtn.style.width = '44px';
    this.minusOneBtn.style.height = '44px';
    this.minusOneBtn.style.border = 'none';
    this.minusOneBtn.style.borderRadius = '10px';
    this.minusOneBtn.style.fontSize = '14px';
    this.minusOneBtn.style.fontWeight = '700';
    this.minusOneBtn.style.cursor = 'pointer';
    this.minusOneBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustValue(-1);
    });
    controls.appendChild(this.minusOneBtn);

    // Slider
    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.className = 'dimension-popup-slider';
    this.slider.min = '0';
    this.slider.max = '300';
    this.slider.step = '1';
    this.slider.style.flex = '1';
    this.slider.style.height = '10px';
    this.slider.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.15) 100%)';
    this.slider.style.borderRadius = '6px';
    this.slider.style.minWidth = '120px';
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
    this.valueDisplay.style.padding = '0 10px';
    controls.appendChild(this.valueDisplay);

    // +1 Butonu (mavi)
    this.plusOneBtn = document.createElement('button');
    this.plusOneBtn.className = 'dimension-popup-btn step1 plus1';
    this.plusOneBtn.textContent = '+1';
    this.plusOneBtn.style.width = '44px';
    this.plusOneBtn.style.height = '44px';
    this.plusOneBtn.style.border = 'none';
    this.plusOneBtn.style.borderRadius = '10px';
    this.plusOneBtn.style.fontSize = '14px';
    this.plusOneBtn.style.fontWeight = '700';
    this.plusOneBtn.style.cursor = 'pointer';
    this.plusOneBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.adjustValue(+1);
    });
    controls.appendChild(this.plusOneBtn);

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
    this.valueDisplay.textContent = Math.round(currentValue).toString();

    // Min/max değerlerini ayarla (parametre tanımından)
    if (paramData.min !== undefined) {
      this.slider.min = paramData.min;
    }
    if (paramData.max !== undefined) {
      this.slider.max = paramData.max;
    }
    this.slider.step = paramData.step !== undefined ? paramData.step : '1';

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
    const popupRect = this.popup.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportWidth = viewport ? viewport.width : window.innerWidth;
    const viewportHeight = viewport ? viewport.height : window.innerHeight;
    const viewportLeft = viewport ? viewport.offsetLeft : 0;
    const viewportTop = viewport ? viewport.offsetTop : 0;
    const padding = 12;

    if (!clickEvent) {
      // Event yoksa ekranın ortasına yerleştir
      let x = viewportLeft + (viewportWidth - popupRect.width) / 2;
      let y = viewportTop + (viewportHeight - popupRect.height) / 2;
      x = Math.max(viewportLeft + padding, Math.min(x, viewportLeft + viewportWidth - popupRect.width - padding));
      y = Math.max(viewportTop + padding, Math.min(y, viewportTop + viewportHeight - popupRect.height - padding));
      this.popup.style.marginLeft = '0';
      this.popup.style.marginTop = '0';
      this.popup.style.left = `${x}px`;
      this.popup.style.top = `${y}px`;
      console.log('📍 Popup centered (no event)');
      return;
    }

    console.log('📍 Position calculation:', {
      popup: { width: popupRect.width, height: popupRect.height },
      click: { x: clickEvent.clientX, y: clickEvent.clientY }
    });

    // Tıklanan pozisyon (viewport koordinatları)
    let x = clickEvent.clientX;
    let y = clickEvent.clientY;

    // Popup'ı merkezle
    x -= popupRect.width / 2;
    y -= popupRect.height / 2;

    // Ekran sınırlarını kontrol et
    x = Math.max(viewportLeft + padding, Math.min(x, viewportLeft + viewportWidth - popupRect.width - padding));
    y = Math.max(viewportTop + padding, Math.min(y, viewportTop + viewportHeight - popupRect.height - padding));

    this.popup.style.marginLeft = '0';
    this.popup.style.marginTop = '0';
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
    this.valueDisplay.textContent = Math.round(value).toString();

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
