// Ana Uygulama - Modüler 3D Kanal Görüntüleyici
import { Scene3D } from './core/Scene3D.js';
import { Materials } from './core/Materials.js';
import { DuzKanal } from './components/DuzKanal.js';
import { ReduksiyonDirsek } from './components/ReduksiyonDirsek.js';
import { EsParcasi } from './components/EsParcasi.js';
import { PlenumBox } from './components/PlenumBox.js';
import { KaredenYuvarlaga } from './components/KaredenYuvarlaga.js';
import { Reduksiyon } from './components/Reduksiyon.js';
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

    // Dimension Popup oluştur (canvas wrapper'ı kullan)
    const viewerContainer = document.querySelector('.canvas-wrapper') || document.body;
    this.dimensionPopup = new DimensionPopup(viewerContainer, () => {
      this.updateHUD();
    });
    this.scene.dimensionPopup = this.dimensionPopup;

    // UI elementlerini hazırla
    this.setupPartSelector();
    this.setupViewControls();
    this.setupHUD();
    this.setupMobileToggle();
    this.setupOrderSystem();

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

  setupMobileToggle() {
    const toggleBtn = document.getElementById('mobile-toggle');
    const paramsPanel = document.querySelector('.params-panel');

    if (!toggleBtn || !paramsPanel) return;

    // Mobilde ilk açılışta panel açık olsun
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        paramsPanel.classList.add('open');
        const viewerPanel = document.querySelector('.viewer-panel');
        const icon = toggleBtn.querySelector('.toggle-icon');

        // Viewer'ı küçült
        if (viewerPanel) {
          viewerPanel.style.height = 'calc(50vh - 40px)';
        }

        if (icon) {
          icon.style.transform = 'rotate(180deg)';
        }
      }, 500); // Animasyon için küçük gecikme
    }

    toggleBtn.addEventListener('click', () => {
      paramsPanel.classList.toggle('open');
      const viewerPanel = document.querySelector('.viewer-panel');
      const icon = toggleBtn.querySelector('.toggle-icon');

      if (paramsPanel.classList.contains('open')) {
        // Panel açık - viewer'ı küçült
        if (viewerPanel) {
          viewerPanel.style.height = 'calc(50vh - 40px)';
        }
        if (icon) {
          icon.style.transform = 'rotate(180deg)';
        }
      } else {
        // Panel kapalı - viewer'ı büyüt
        if (viewerPanel) {
          viewerPanel.style.height = 'calc(100vh - 80px)';
        }
        if (icon) {
          icon.style.transform = 'rotate(0deg)';
        }
      }
    });

    // Pencere boyutu değişince kontrol et
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        paramsPanel.classList.remove('open');
        const icon = toggleBtn.querySelector('.toggle-icon');
        if (icon) {
          icon.style.transform = 'rotate(0deg)';
        }
      }
    });
  }

  setupPartSelector() {
    const selector = document.getElementById('part-selector');
    if (!selector) return;

    const parts = getAllParts();

    // Dropdown'u doldur
    selector.innerHTML = parts.map(part =>
      `<option value="${part.key}">${part.icon} ${part.name}</option>`
    ).join('');

    // Değişiklik dinleyicisi
    selector.addEventListener('change', (e) => {
      this.loadPart(e.target.value);
    });
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
      <div class="hud-line">Sol tık: döndür • Sağ tık: kaydır • Tekerlek: zoom</div>
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
        case 'reduksiyon-dirsek':
          this.currentPart = new ReduksiyonDirsek(this.scene, this.materials);
          break;
        case 'es-parcasi':
          this.currentPart = new EsParcasi(this.scene, this.materials);
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
    const hudInfo = document.getElementById('hud-info');
    if (!hudInfo || !this.currentPart) return;

    const dims = this.currentPart.getDimensions();
    const dimsText = Object.entries(dims)
      .map(([key, value]) => {
        // Tam sayıysa ondalık gösterme, değilse 1 ondalık
        const formattedValue = Number.isInteger(value) ? value : value.toFixed(1);
        return `${key}: ${formattedValue} cm`;
      })
      .join(' • ');

    hudInfo.textContent = dimsText;
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
        this.orderButton = new OrderButton(buttonContainer, () => {
          this.handleAddToCart();
        });

        // Badge'leri güncelle
        const cart = this.orderManager.getCart();
        this.orderButton.updateBadge(cart.length);
        this.updateHeaderBadge(cart.length);
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
  async handleAddToCart() {
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
        area: this.currentPart.calculateArea(),
        quantity: 1,
        screenshots: screenshots
      };

      // Sepete ekle
      this.orderManager.addToCart(orderItem);

      // Badge'leri güncelle
      const cart = this.orderManager.getCart();
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
