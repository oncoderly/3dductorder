// Ana Uygulama - Modüler 3D Kanal Görüntüleyici
import { Scene3D } from './core/Scene3D.js';
import { Materials } from './core/Materials.js';
import { DuzKanal } from './components/DuzKanal.js';
import { Kortapa } from './components/kortapa.js';
import { ReduksiyonDirsek } from './components/ReduksiyonDirsek.js';
import { Dirsek } from './components/Dirsek.js';
import { EsParcasi } from './components/es-parcasi.js';
import { EsReduksiyonlu } from './components/es-reduksiyonlu.js';
import { PlenumBox } from './components/PlenumBox.js';
import { KaredenYuvarlaga } from './components/KaredenYuvarlaga.js';
import { Reduksiyon } from './components/Reduksiyon.js';
import { Yaka } from './components/yaka.js';
import { SideBranch2 } from './components/sidebranch-2.js';
import { YBranch2 } from './components/YBranch-2.js';
import { Manson } from './components/manson.js';
import { ParameterPanel } from './ui/ParameterPanel.js';
import { ViewControls } from './ui/ViewControls.js';
import { DimensionPopup } from './ui/DimensionPopup.js';
import { getAllParts } from './config/parts-config.js';
import { ENV } from './config/environment.js';
import { ErrorHandler, setupGlobalErrorHandler } from './utils/ErrorHandler.js';
import { ScreenshotCapture } from './core/ScreenshotCapture.js';
import { OrderManager } from './core/OrderManager.js';
import { OrderButton } from './ui/OrderButton.js';

class App {
  constructor() {
    this.currentPart = null;
    this.scene = null;
    this.materials = null;
    this.paramPanel = null;
    this.viewControls = null;
    this.dimensionPopup = null;
    this.errorHandler = new ErrorHandler();

    // Sipariş sistemi
    this.screenshotCapture = null;
    this.orderManager = null;
    this.orderButton = null;

    this.init();
  }

  async init() {
    try {
      // Canvas'ı bul
      const canvas = document.getElementById('canvas-3d');
      if (!canvas) {
        this.errorHandler.critical(
          '3D Görüntüleyici başlatılamadı',
          'Canvas elementi bulunamadı. Sayfa yapısında bir sorun var.'
        );
        return;
      }

    // Scene ve Materials oluştur
    this.scene = new Scene3D(canvas);
    this.materials = new Materials();
    // Scene'deki renderer boyutunu LineMaterial'lara aktar
    this.scene.materials = this.materials;
    this.materials.updateLineMaterialResolution(this.scene.renderer);

    // Dimension Popup oluştur (canvas wrapper'ı kullan)
    const viewerContainer = document.querySelector('.canvas-wrapper') || document.body;
    this.dimensionPopup = new DimensionPopup(viewerContainer, (key, value) => {
      this.updateHUD();
      if (this.paramPanel) {
        if (key) {
          this.paramPanel.syncNumberControlValue(key, value);
        }
        this.paramPanel.updateSheetScaleDisplay();
      }
    });
    this.scene.dimensionPopup = this.dimensionPopup;

    // UI elementlerini hazırla
    this.setupPartSelector();
    this.setupViewControls();
    this.setupHUD();
    this.setupMobileToggle();
    this.setupOrderSystem();
    this.loadSavedTheme();

      // İlk parçayı yükle
      this.loadPart('duz-kanal');

      // Başarılı başlatma mesajı (sadece dev mode'da)
      if (ENV.isDevelopment()) {
        this.errorHandler.info('3D Görüntüleyici başlatıldı', 'Geliştirme modu aktif');
      }
    } catch (error) {
      this.errorHandler.critical(
        'Uygulama başlatılamadı',
        `Hata: ${error.message}`
      );
      console.error('Init error:', error);
    }
  }

  loadSavedTheme() {
    const savedTheme = localStorage.getItem('guiTheme');
    const paramsPanel = document.querySelector('.params-panel');
    if (paramsPanel) {
      // Tüm tema class'larını kaldır
      paramsPanel.classList.remove('theme-modern', 'theme-emerald');

      // Kaydedilen temayı uygula
      if (savedTheme && savedTheme !== 'default') {
        paramsPanel.classList.add(`theme-${savedTheme}`);
      }
    }
  }

  setupMobileToggle() {
    const toggleBtn = document.getElementById('mobile-toggle');
    const paramsPanel = document.querySelector('.params-panel');
    const viewerPanel = document.querySelector('.viewer-panel');
    const header = document.querySelector('.app-header');
    const resizeHandle = document.getElementById('params-panel-handle');

    if (!toggleBtn || !paramsPanel) return;

    let panelHeightVh = 50;
    const minPanelVh = 30;
    const maxPanelVh = 85;

    const updateMobileLayout = () => {
      if (window.innerWidth > 768) {
        if (viewerPanel) viewerPanel.style.height = '';
        paramsPanel.style.height = '';
        paramsPanel.style.maxHeight = '';
        return;
      }

      paramsPanel.style.height = `${panelHeightVh}vh`;
      paramsPanel.style.maxHeight = `${panelHeightVh}vh`;

      if (!viewerPanel) return;

      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const panelHeightPx = window.innerHeight * (panelHeightVh / 100);
      const isOpen = paramsPanel.classList.contains('open');
      const viewerHeightPx = isOpen
        ? Math.max(120, window.innerHeight - headerHeight - panelHeightPx)
        : Math.max(120, window.innerHeight - headerHeight);

      viewerPanel.style.height = `${viewerHeightPx}px`;
    };

    // Mobilde ilk açılışta panel açık olsun
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        paramsPanel.classList.add('open');
        const icon = toggleBtn.querySelector('.toggle-icon');

        // Viewer'ı küçült
        updateMobileLayout();
        if (icon) {
          icon.style.transform = 'rotate(180deg)';
        }
      }, 500); // Animasyon için küçük gecikme
    }

    toggleBtn.addEventListener('click', () => {
      paramsPanel.classList.toggle('open');
      const icon = toggleBtn.querySelector('.toggle-icon');

      if (paramsPanel.classList.contains('open')) {
        // Panel açık - viewer'ı küçült
        updateMobileLayout();
        if (icon) {
          icon.style.transform = 'rotate(180deg)';
        }
      } else {
        // Panel kapalı - viewer'ı büyüt
        updateMobileLayout();
        if (icon) {
          icon.style.transform = 'rotate(0deg)';
        }
      }
    });

    if (resizeHandle) {
      let isResizing = false;

      const onPointerMove = (e) => {
        if (!isResizing || window.innerWidth > 768) return;
        const clientY = e.clientY;
        const heightPx = window.innerHeight - clientY;
        const nextVh = (heightPx / window.innerHeight) * 100;
        panelHeightVh = Math.max(minPanelVh, Math.min(maxPanelVh, nextVh));
        updateMobileLayout();
        if (e.cancelable) {
          e.preventDefault();
        }
      };

      const onPointerUp = () => {
        if (!isResizing) return;
        isResizing = false;
        if (resizeHandlePointerId !== null) {
          resizeHandle.releasePointerCapture?.(resizeHandlePointerId);
        }
        resizeHandlePointerId = null;
        document.body.style.userSelect = '';
      };

      let resizeHandlePointerId = null;

      resizeHandle.addEventListener('pointerdown', (e) => {
        if (window.innerWidth > 768) return;
        if (!paramsPanel.classList.contains('open')) return;
        isResizing = true;
        resizeHandlePointerId = e.pointerId;
        resizeHandle.setPointerCapture?.(e.pointerId);
        document.body.style.userSelect = 'none';
        onPointerMove(e);
      }, { passive: false });

      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    }

    // Pencere boyutu değişince kontrol et
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        paramsPanel.classList.remove('open');
        const icon = toggleBtn.querySelector('.toggle-icon');
        if (icon) {
          icon.style.transform = 'rotate(0deg)';
        }
      }
      updateMobileLayout();
    });
  }

  setupPartSelector() {
    const selector = document.getElementById('part-selector');
    if (!selector) return;

    const parts = getAllParts();
    const partMap = new Map(parts.map(part => [part.key, part]));

    // Dropdown'u doldur
    selector.classList.add('part-selector-native');
    selector.innerHTML = parts.map(part =>
      `<option value="${part.key}">${part.name}</option>`
    ).join('');

    const wrapper = selector.parentElement;
    if (!wrapper) return;

    let custom = wrapper.querySelector('.part-selector-custom');
    if (!custom) {
      custom = document.createElement('div');
      custom.className = 'part-selector-custom';
      wrapper.appendChild(custom);
    }
    custom.innerHTML = '';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'part-selector-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const triggerIcon = document.createElement('img');
    triggerIcon.className = 'part-selector-icon';
    triggerIcon.alt = '';
    const triggerFallback = document.createElement('span');
    triggerFallback.className = 'part-selector-icon-fallback';
    triggerFallback.setAttribute('aria-hidden', 'true');

    const triggerLabel = document.createElement('span');
    triggerLabel.className = 'part-selector-label';
    const triggerCaret = document.createElement('span');
    triggerCaret.className = 'part-selector-caret';
    triggerCaret.textContent = 'v';

    trigger.append(triggerIcon, triggerFallback, triggerLabel, triggerCaret);

    const menu = document.createElement('div');
    menu.className = 'part-selector-menu';
    menu.setAttribute('role', 'listbox');

    const optionButtons = new Map();

    const applyIcon = (imgEl, fallbackEl, part) => {
      const iconPath = part?.iconPath;
      const fallback = part?.icon || '';
      if (iconPath) {
        imgEl.onerror = () => {
          imgEl.classList.add('is-hidden');
          fallbackEl.classList.remove('is-hidden');
        };
        imgEl.src = iconPath;
        imgEl.classList.remove('is-hidden');
        fallbackEl.textContent = fallback;
        fallbackEl.classList.add('is-hidden');
      } else {
        imgEl.classList.add('is-hidden');
        fallbackEl.textContent = fallback;
        fallbackEl.classList.remove('is-hidden');
      }
    };

    const openMenu = () => {
      custom.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    const closeMenu = () => {
      custom.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const updateSelected = (key, notify = false) => {
      const part = partMap.get(key) || parts[0];
      if (!part) return;
      applyIcon(triggerIcon, triggerFallback, part);
      triggerLabel.textContent = part.name;
      optionButtons.forEach((btn, btnKey) => {
        btn.setAttribute('aria-selected', btnKey == part.key ? 'true' : 'false');
      });
      if (selector.value !== part.key) {
        selector.value = part.key;
      }
      if (notify) {
        selector.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    parts.forEach(part => {
      const option = document.createElement('button');
      option.type = 'button';
      option.className = 'part-selector-option';
      option.setAttribute('role', 'option');
      option.dataset.value = part.key;

      const optionIcon = document.createElement('img');
      optionIcon.className = 'part-selector-icon';
      optionIcon.alt = '';
      const optionFallback = document.createElement('span');
      optionFallback.className = 'part-selector-icon-fallback';
      optionFallback.setAttribute('aria-hidden', 'true');
      applyIcon(optionIcon, optionFallback, part);

      const optionLabel = document.createElement('span');
      optionLabel.className = 'part-selector-option-label';
      optionLabel.textContent = part.name;

      option.append(optionIcon, optionFallback, optionLabel);
      option.addEventListener('click', (e) => {
        e.preventDefault();
        updateSelected(part.key, true);
        closeMenu();
      });

      menu.appendChild(option);
      optionButtons.set(part.key, option);
    });

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (custom.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('click', (e) => {
      if (!custom.contains(e.target)) {
        closeMenu();
      }
    });

    custom.append(trigger, menu);

    // De?i?iklik dinleyicisi
    selector.addEventListener('change', (e) => {
      const key = e.target.value;
      this.loadPart(key);
      updateSelected(key, false);
    });

    updateSelected(selector.value || parts[0]?.key, false);
  }

  setupViewControls() {
    const container = document.getElementById('view-controls');
    if (!container) return;

    this.viewControls = new ViewControls(container, this.scene);
  }

  setupHUD() {
    const hud = document.getElementById('hud');
    if (!hud) return;

    hud.innerHTML = `
      <div class="hud-line" id="hud-help"></div>
      <div class="hud-line" id="hud-info"></div>
    `;
  }

  async loadPart(partKey) {
    try {
      // Önceki parçayı temizle
      if (this.currentPart) {
        this.scene.clearGroup(this.scene.geometryGroup);
        this.scene.clearGroup(this.scene.flangeGroup);
        this.scene.clearGroup(this.scene.dimensionGroup);
        this.scene.clearGroup(this.scene.labelGroup);
        this.scene.clearLabels();
      }

      // Yeni parçayı oluştur
      switch (partKey) {
        case 'duz-kanal':
          this.currentPart = new DuzKanal(this.scene, this.materials);
          break;
        case 'kortapa':
          this.currentPart = new Kortapa(this.scene, this.materials);
          break;
        case 'reduksiyon-dirsek':
          this.currentPart = new ReduksiyonDirsek(this.scene, this.materials);
          break;
        case 'dirsek':
          this.currentPart = new Dirsek(this.scene, this.materials);
          break;
        case 'es-parcasi':
          this.currentPart = new EsParcasi(this.scene, this.materials);
          break;
        case 'es-reduksiyonlu':
          this.currentPart = new EsReduksiyonlu(this.scene, this.materials);
          break;
        case 'plenum-box':
          this.currentPart = new PlenumBox(this.scene, this.materials);
          break;
        case 'kareden-yuvarlaga':
          this.currentPart = new KaredenYuvarlaga(this.scene, this.materials);
          break;
        case 'reduksiyon':
          this.currentPart = new Reduksiyon(this.scene, this.materials);
          break;
        case 'yaka':
          this.currentPart = new Yaka(this.scene, this.materials);
          break;
        case 'side-branch-2':
          this.currentPart = new SideBranch2(this.scene, this.materials);
          break;
        case 'y-branch-2':
          this.currentPart = new YBranch2(this.scene, this.materials);
          break;
        case 'manson':
          this.currentPart = new Manson(this.scene, this.materials);
          break;
        default:
          this.errorHandler.error(
            'Parça yüklenemedi',
            `Bilinmeyen parça tipi: ${partKey}`
          );
          return;
      }

    // Scene'e current part referansını ekle (popup için)
    this.scene.currentPart = this.currentPart;

      // Parçayı oluştur
      this.currentPart.rebuild();

      // Parametre panelini oluştur
      this.setupParameterPanel();

      // Alan hesabını güncelle (parametre paneli oluşturulduktan sonra)
      if (this.currentPart && this.currentPart.updateAreaDisplay) {
        this.currentPart.updateAreaDisplay();
      }

      // HUD'ı güncelle
      this.updateHUD();
    } catch (error) {
      this.errorHandler.error(
        'Parça yüklenirken hata oluştu',
        `${partKey}: ${error.message}`
      );
      console.error('Load part error:', error);
    }
  }

  setupParameterPanel() {
    const container = document.getElementById('parameter-panel');
    if (!container || !this.currentPart) return;

    this.paramPanel = new ParameterPanel(
      container,
      this.currentPart,
      () => {
        this.currentPart.rebuild();
        this.updateHUD();
      },
      this.scene // Scene3D instance'ı sahne kontrollerine için
    );

    this.paramPanel.render();
  }

  updateHUD() {
    const hudHelp = document.getElementById('hud-help');
    const hudInfo = document.getElementById('hud-info');
    if (!hudInfo || !this.currentPart) return;

    if (hudHelp) {
      hudHelp.textContent = window.innerWidth <= 768
        ? '1 parmak: dondur - 2 parmak: kaydir/zoom'
        : 'Sol tik: dondur - Sag tik: kaydir - Tekerlek: zoom';
    }

    const areaData = this.currentPart.calculateArea();
    const outer = areaData.outer || 0;
    const kFactor = this.currentPart.params?.kFactor ?? 1;
    const wastePercent = this.currentPart.params?.wastePercent ?? 0;
    const sheet = outer * kFactor;
    const wasteIncluded = sheet * (1 + wastePercent / 100);
    const thicknessCm = this.currentPart.params?.t;
    const thicknessMm = Number.isFinite(thicknessCm) ? thicknessCm * 10 : NaN;
    const isDuzKanal = this.getCurrentPartKey() === 'duz-kanal';

    const formatValue = (value, decimals) => {
      if (!Number.isFinite(value)) return '-';
      const text = value.toFixed(decimals);
      return text.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
    };

    if (isDuzKanal) {
      hudInfo.textContent = `Alan: ${formatValue(sheet, 3)} m2 - Sac Kalinligi: ${formatValue(thicknessMm, 2)} mm`;
      return;
    }

    hudInfo.textContent = `Alan: ${formatValue(sheet, 3)} m2 - Atik: %${formatValue(wastePercent, 1)} - Atik Dahil: ${formatValue(wasteIncluded, 3)} m2 - Sac Kalinligi: ${formatValue(thicknessMm, 2)} mm`;
  }

  // Export için (sipariş sistemi ile entegrasyon)
  exportCurrentState() {
    if (!this.currentPart) return null;

    return {
      partKey: this.getCurrentPartKey(),
      params: this.currentPart.exportParams(),
      dimensions: this.currentPart.getDimensions(),
      area: this.currentPart.calculateArea()
    };
  }

  getCurrentPartKey() {
    const selector = document.getElementById('part-selector');
    return selector ? selector.value : null;
  }

  // Sipariş sistemi setup
  setupOrderSystem() {
    try {
      // Screenshot capture
      this.screenshotCapture = new ScreenshotCapture(this.scene);

      // Order manager
      this.orderManager = new OrderManager();

      // Order button
      const buttonContainer = document.querySelector('.canvas-wrapper');
      if (buttonContainer) {
        this.orderButton = new OrderButton(buttonContainer, (quantity) => {
          this.handleAddToCart(quantity);
        });

        // Badge'leri güncelle (async)
        this.orderManager.getCart().then(cart => {
          this.orderButton.updateBadge(cart.length);
          this.updateHeaderBadge(cart.length);
        });
      }
    } catch (error) {
      console.error('Order system setup error:', error);
    }
  }

  // Header badge'i güncelle
  updateHeaderBadge(count) {
    const headerBadge = document.getElementById('header-orders-badge');
    if (headerBadge) {
      headerBadge.textContent = count;
    }
  }

  // Siparişe ekle
  async handleAddToCart(quantity = 1) {
    if (!this.currentPart) {
      this.errorHandler.error('Sipariş eklenemedi', 'Lütfen önce bir parça seçin');
      return;
    }

    try {
      this.orderButton.showLoading();

      // 4 görüntüyü çek (3D model + ölçü çizgileri + ölçü etiketleri)
      const screenshots = await this.screenshotCapture.captureAllViews(false);

      // Parça bilgilerini al
      const partKey = this.getCurrentPartKey();
      const partConfig = this.getPartConfig(partKey);

      // Sipariş kalemi oluştur
      const orderItem = {
        id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        partType: partKey,
        partName: partConfig ? partConfig.name : this.currentPart.constructor.name,
        params: this.currentPart.exportParams(),
        dimensions: this.currentPart.getDimensions(),
        area: this.currentPart.calculateArea().outer || 0, // Alan objesinden outer değerini al
        quantity: quantity, // Kullanıcının seçtiği adet
        screenshots: screenshots
      };

      // Sepete ekle (async)
      await this.orderManager.addToCart(orderItem);

      // Badge'leri güncelle
      const cart = await this.orderManager.getCart();
      this.orderButton.updateBadge(cart.length);
      this.updateHeaderBadge(cart.length);

      this.orderButton.showSuccess();

      // Başarı mesajı
      if (ENV.isDevelopment()) {
        this.errorHandler.info(
          'Siparişe eklendi!',
          `${orderItem.partName} sepete eklendi. Toplam: ${cart.length} parça`
        );
      }

    } catch (error) {
      this.errorHandler.error('Siparişe eklenemedi', error.message);
      console.error('Add to cart error:', error);

      if (this.orderButton) {
        this.orderButton.button.classList.remove('loading');
      }
    }
  }

  // Parça config bilgisini al
  getPartConfig(partKey) {
    const parts = getAllParts();
    return parts.find(p => p.key === partKey);
  }
}

// Uygulama başlat
window.addEventListener('DOMContentLoaded', () => {
  // Debug console'u yükle (sadece dev mode'da)
  ENV.loadDebugConsole();

  // Uygulamayı başlat
  try {
    window.app = new App();

    // Global error handler'ı setup et
    if (window.app.errorHandler) {
      setupGlobalErrorHandler(window.app.errorHandler);
    }
  } catch (error) {
    // Kritik başlatma hatası - fallback error display
    const fallbackError = document.createElement('div');
    fallbackError.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 32px;
      border-radius: 16px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      z-index: 99999;
    `;
    fallbackError.innerHTML = `
      <h2 style="margin: 0 0 16px 0; font-size: 24px;">⚠️ Uygulama Başlatılamadı</h2>
      <p style="margin: 0 0 16px 0; opacity: 0.9;">${error.message}</p>
      <button onclick="window.location.reload()" style="
        background: white;
        color: #ef4444;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        font-size: 16px;
      ">Sayfayı Yenile</button>
    `;
    document.body.appendChild(fallbackError);
    console.error('Critical app initialization error:', error);
  }
});

// Parent window'a state gönder (sipariş sistemi için)
window.addEventListener('message', (event) => {
  if (event.data.type === 'getState' && window.app) {
    const state = window.app.exportCurrentState();
    event.source.postMessage({
      type: 'state',
      params: state?.params,
      thumb: null // Canvas screenshot eklenebilir
    }, '*');
  }
});

// Ready mesajı gönder
window.addEventListener('load', () => {
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'child-ready',
      title: document.title
    }, '*');
  }
});
