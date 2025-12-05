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
import { getAllParts } from './config/parts-config.js';

class App {
  constructor() {
    this.currentPart = null;
    this.scene = null;
    this.materials = null;
    this.paramPanel = null;
    this.viewControls = null;

    this.init();
  }

  async init() {
    // Canvas'ı bul
    const canvas = document.getElementById('canvas-3d');
    if (!canvas) {
      console.error('Canvas bulunamadı!');
      return;
    }

    // Scene ve Materials oluştur
    this.scene = new Scene3D(canvas);
    this.materials = new Materials();

    // UI elementlerini hazırla
    this.setupPartSelector();
    this.setupViewControls();
    this.setupHUD();
    this.setupMobileToggle();

    // İlk parçayı yükle
    this.loadPart('duz-kanal');
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
        console.error('Bilinmeyen parça:', partKey);
        return;
    }

    // Parçayı oluştur
    this.currentPart.rebuild();

    // Parametre panelini oluştur
    this.setupParameterPanel();

    // HUD'ı güncelle
    this.updateHUD();
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
      .map(([key, value]) => `${key}: ${value.toFixed(1)} cm`)
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
}

// Uygulama başlat
window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
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
