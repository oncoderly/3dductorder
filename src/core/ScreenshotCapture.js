// ScreenshotCapture - 3D sahnenin 4 yönden ekran görüntüsünü alır
import * as THREE from 'three';

export class ScreenshotCapture {
  constructor(scene3D) {
    this.scene3D = scene3D;
    this.scene = scene3D.scene;
    this.camera = scene3D.camera;
    this.renderer = scene3D.renderer;
    this.controls = scene3D.controls;

    // Görünüm presetleri (ViewCube ile aynı)
    this.views = {
      front: { label: 'Ön', position: new THREE.Vector3(0, 0, 3) },
      right: { label: 'Sağ', position: new THREE.Vector3(3, 0, 0) },
      top: { label: 'Üst', position: new THREE.Vector3(0, 3, 0) },
      iso: { label: 'İzo', position: new THREE.Vector3(2, 2, 2) }
    };

    // Offscreen renderer oluştur (kullanıcıya görünmez)
    this.offscreenRenderer = null;
    this.offscreenCamera = null;
    this.initOffscreenRenderer();
  }

  /**
   * Offscreen renderer'ı başlat (kullanıcıya görünmez canvas)
   */
  initOffscreenRenderer() {
    // Görünmez bir canvas oluştur
    const offscreenCanvas = document.createElement('canvas');

    // WebGL renderer oluştur (offscreen)
    this.offscreenRenderer = new THREE.WebGLRenderer({
      canvas: offscreenCanvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });

    // Yüksek çözünürlük ayarları
    const highResWidth = 1920;
    const highResHeight = 1440;
    this.offscreenRenderer.setSize(highResWidth, highResHeight, false);
    this.offscreenRenderer.setPixelRatio(2);

    // Tone mapping ayarları (ana renderer ile aynı)
    this.offscreenRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.offscreenRenderer.toneMappingExposure = 1.2;
    this.offscreenRenderer.outputColorSpace = THREE.SRGBColorSpace;

    // Offscreen camera oluştur
    this.offscreenCamera = new THREE.PerspectiveCamera(
      45, // Ana kamera ile aynı FOV
      highResWidth / highResHeight,
      0.01,
      10000
    );

    console.log('✅ Offscreen renderer initialized for background screenshots');
  }

  /**
   * Tek bir görünümün screenshot'ını çeker (OFFSCREEN - kullanıcı görmez)
   * @param {string} viewName - 'front', 'right', 'top', 'iso'
   * @param {boolean} hideUI - Grid, axes, dimensions gizlensin mi
   * @returns {Promise<string>} - Base64 JPEG string
   */
  async captureView(viewName, hideUI = true) {
    const view = this.views[viewName];
    if (!view) {
      throw new Error(`Unknown view: ${viewName}`);
    }

    try {
      // OFFSCREEN RENDERING - Ana sahne hiç etkilenmiyor!

      // Geçici olarak UI elementlerinin görünürlüğünü kaydet
      const originalGridVisible = this.scene3D.grid ? this.scene3D.grid.visible : false;
      const originalAxesVisible = this.scene3D.axes ? this.scene3D.axes.visible : false;
      const originalDimensionsVisible = this.scene3D.dimensionGroup ? this.scene3D.dimensionGroup.visible : false;
      const originalLabelsVisible = this.scene3D.labelGroup ? this.scene3D.labelGroup.visible : false;

      // UI elementlerini geçici gizle (sadece screenshot için)
      if (hideUI) {
        if (this.scene3D.grid) this.scene3D.grid.visible = false;
        if (this.scene3D.axes) this.scene3D.axes.visible = false;
        if (this.scene3D.axisLabels) this.scene3D.axisLabels.visible = false;
        if (this.scene3D.dimensionGroup) this.scene3D.dimensionGroup.visible = false;
        if (this.scene3D.labelGroup) this.scene3D.labelGroup.visible = false;
      }

      // Bounding box hesabı
      const box = new THREE.Box3();
      box.setFromObject(this.scene3D.geometryGroup);

      // Ölçü çizgilerini de dahil et (eğer varsa)
      if (this.scene3D.dimensionGroup && !hideUI) {
        const dimensionBox = new THREE.Box3().setFromObject(this.scene3D.dimensionGroup);
        box.union(dimensionBox);
      }

      const center = new THREE.Vector3();
      box.getCenter(center);

      const size = new THREE.Vector3();
      box.getSize(size);

      // Kamera pozisyonunu hesapla
      const fov = this.offscreenCamera.fov * (Math.PI / 180);
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = (maxDim * 1.3) / (2 * Math.tan(fov / 2));

      const direction = view.position.clone().normalize();
      const cameraPosition = center.clone().add(direction.multiplyScalar(distance));

      // OFFSCREEN kamerayı ayarla (ANA KAMERA HİÇ DEĞİŞMİYOR!)
      this.offscreenCamera.position.copy(cameraPosition);
      this.offscreenCamera.lookAt(center);
      this.offscreenCamera.updateProjectionMatrix();

      // Birden fazla render pass - geometrinin tam yerleşmesi için
      // 1. Render pass
      this.offscreenRenderer.render(this.scene, this.offscreenCamera);
      await new Promise(resolve => setTimeout(resolve, 50));

      // 2. Render pass (stabilizasyon)
      this.offscreenRenderer.render(this.scene, this.offscreenCamera);
      await new Promise(resolve => setTimeout(resolve, 100));

      // 3. Final render pass
      this.offscreenRenderer.render(this.scene, this.offscreenCamera);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Screenshot al - WebGL canvas + HTML label'ları birleştir
      const dataURL = await this.captureWithOffscreenLabels();

      // UI elementlerini eski haline getir
      if (hideUI) {
        if (this.scene3D.grid) this.scene3D.grid.visible = originalGridVisible;
        if (this.scene3D.axes) this.scene3D.axes.visible = originalAxesVisible;
        if (this.scene3D.axisLabels) this.scene3D.axisLabels.visible = originalAxesVisible;
        if (this.scene3D.dimensionGroup) this.scene3D.dimensionGroup.visible = originalDimensionsVisible;
        if (this.scene3D.labelGroup) this.scene3D.labelGroup.visible = originalLabelsVisible;
      }

      return dataURL;

    } catch (error) {
      console.error('Screenshot capture error:', error);
      throw error;
    }
  }

  /**
   * Tüm 4 görünümün screenshot'larını sırayla çeker (OFFSCREEN - anlık)
   * @param {boolean} hideUI - UI elementleri gizlensin mi
   * @returns {Promise<Object>} - { front, right, top, iso } base64 strings
   */
  async captureAllViews(hideUI = true) {
    const screenshots = {};

    // Her görünümü sırayla çek (offscreen rendering - hızlı ve görünmez)
    for (const viewName of ['front', 'right', 'top', 'iso']) {
      screenshots[viewName] = await this.captureView(viewName, hideUI);
      // Artık beklemeye gerek yok - offscreen rendering kullanıcıyı etkilemiyor
    }

    return screenshots;
  }

  /**
   * Offscreen WebGL canvas ve HTML label'ları birleştirerek screenshot al
   * ANA SAHNENIN label'larını kullanarak offscreen render'a ekle
   * @returns {Promise<string>} - Base64 JPEG string with labels
   */
  async captureWithOffscreenLabels() {
    return new Promise((resolve) => {
      // Yeni bir canvas oluştur (birleştirme için)
      const compositeCanvas = document.createElement('canvas');
      const ctx = compositeCanvas.getContext('2d');

      // Canvas boyutları offscreen renderer ile aynı olsun
      const width = this.offscreenRenderer.domElement.width;
      const height = this.offscreenRenderer.domElement.height;
      compositeCanvas.width = width;
      compositeCanvas.height = height;

      console.log('📸 Composite canvas size:', width, 'x', height);

      // 1) WebGL canvas'ını çiz (3D model + ölçü çizgileri + arka plan)
      ctx.drawImage(this.offscreenRenderer.domElement, 0, 0, width, height);

      // 2) HTML label'ları çiz (ANA SAHNENIN dimensionGroup'undan)
      // Label'lar 3D pozisyonlarda CSS2DObject olarak saklanıyor
      if (this.scene3D.dimensionGroup) {
        console.log('📸 Processing dimension group labels...');

        // DimensionGroup içindeki tüm CSS2DObject'leri bul
        const labels = [];
        this.scene3D.dimensionGroup.traverse((child) => {
          if (child.isCSS2DObject && child.element) {
            labels.push(child);
          }
        });

        console.log('📸 Found', labels.length, 'CSS2D labels in dimension group');

        // Her label için 3D pozisyonunu 2D ekran koordinatlarına çevir
        labels.forEach((label, index) => {
          const element = label.element;
          const text = element.textContent;

          if (!text || text.trim() === '') {
            console.log(`  Label ${index}: EMPTY`);
            return;
          }

          // 3D dünya pozisyonunu al
          const worldPos = new THREE.Vector3();
          label.getWorldPosition(worldPos);

          // Offscreen kamera ile 2D ekran pozisyonuna çevir
          const screenPos = worldPos.clone().project(this.offscreenCamera);

          // NDC koordinatlarını (-1 to 1) canvas koordinatlarına çevir
          const x = (screenPos.x * 0.5 + 0.5) * width;
          const y = (-(screenPos.y) * 0.5 + 0.5) * height;

          // Ekran dışında mı kontrol et
          if (x < 0 || x > width || y < 0 || y > height || screenPos.z > 1) {
            console.log(`  Label ${index}: "${text}" OUT OF BOUNDS`);
            return;
          }

          console.log(`  Label ${index}: "${text}" at (${Math.round(x)}, ${Math.round(y)})`);

          // Label stilini al
          const computedStyle = window.getComputedStyle(element);
          const baseFontSize = parseFloat(computedStyle.fontSize) || 14;
          // Offscreen renderer 2x pixel ratio kullanıyor, font büyüt
          const fontSize = baseFontSize * 4; // 1920px genişlik için uygun ölçek
          const fontFamily = computedStyle.fontFamily || 'Arial';
          const color = computedStyle.color || '#ffffff';
          const backgroundColor = computedStyle.backgroundColor;

          // Font ayarla
          ctx.font = `600 ${fontSize}px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;

          // Arka plan çiz (varsa)
          if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
            ctx.fillStyle = backgroundColor;
            const padding = 12;
            ctx.fillRect(
              x - textWidth / 2 - padding,
              y - textHeight / 2 - padding,
              textWidth + padding * 2,
              textHeight + padding * 2
            );
          }

          // Metni çiz
          ctx.fillStyle = color;
          ctx.fillText(text, x, y);
        });
      }

      // JPEG olarak export et (yüksek kalite)
      const dataURL = compositeCanvas.toDataURL('image/jpeg', 0.90);
      resolve(dataURL);
    });
  }

  /**
   * WebGL canvas ve HTML label'ları birleştirerek screenshot al
   * @returns {Promise<string>} - Base64 JPEG string with labels
   */
  async captureWithLabels() {
    return new Promise((resolve) => {
      // Yeni bir canvas oluştur (birleştirme için)
      const compositeCanvas = document.createElement('canvas');
      const ctx = compositeCanvas.getContext('2d');

      // Canvas boyutları WebGL canvas ile aynı olsun
      const width = this.renderer.domElement.width;
      const height = this.renderer.domElement.height;
      compositeCanvas.width = width;
      compositeCanvas.height = height;

      // 1) WebGL canvas'ını çiz (3D model + ölçü çizgileri + arka plan)
      // NOT: WebGL canvas zaten arka plan rengini içeriyor
      ctx.drawImage(this.renderer.domElement, 0, 0, width, height);

      // 2) HTML label'ları çiz (CSS2DRenderer'dan)
      if (this.scene3D.labelRenderer) {
        const labelElements = this.scene3D.labelRenderer.domElement.querySelectorAll('.dimension-label');

        labelElements.forEach(labelEl => {
          if (labelEl.style.display === 'none') return; // Gizli label'ları atla

          // Label'ın ekrandaki pozisyonu ve boyutunu al
          const rect = labelEl.getBoundingClientRect();
          const canvasRect = this.renderer.domElement.getBoundingClientRect();

          // Canvas koordinatlarına çevir (scale factor hesapla)
          const scaleX = width / canvasRect.width;
          const scaleY = height / canvasRect.height;

          const x = (rect.left - canvasRect.left) * scaleX;
          const y = (rect.top - canvasRect.top) * scaleY;

          // Label içeriği
          const text = labelEl.textContent;
          if (!text || text.trim() === '') return; // Boş label'ları atla

          // Label stilini al
          const computedStyle = window.getComputedStyle(labelEl);
          const fontSize = parseFloat(computedStyle.fontSize) * scaleX;
          const fontFamily = computedStyle.fontFamily || 'Arial';
          const color = computedStyle.color || '#ffffff';
          const backgroundColor = computedStyle.backgroundColor;

          // Font ayarla
          ctx.font = `600 ${fontSize}px ${fontFamily}`;
          ctx.textAlign = 'center'; // CSS2DRenderer label'lar center aligned
          ctx.textBaseline = 'middle';

          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;

          // Arka plan çiz (varsa)
          if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
            ctx.fillStyle = backgroundColor;
            const padding = 6;
            ctx.fillRect(
              x - textWidth / 2 - padding,
              y - textHeight / 2 - padding,
              textWidth + padding * 2,
              textHeight + padding * 2
            );
          }

          // Metni çiz
          ctx.fillStyle = color;
          ctx.fillText(text, x, y);
        });
      }

      // JPEG olarak export et (yüksek kalite, sıkıştırmalı - depolama tasarrufu)
      const dataURL = compositeCanvas.toDataURL('image/jpeg', 0.90);
      resolve(dataURL);
    });
  }

  /**
   * Resize screenshot to specific dimensions (optional, for file size optimization)
   * @param {string} dataURL - Base64 image string
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @returns {Promise<string>} - Resized base64 string
   */
  async resizeImage(dataURL, maxWidth = 512, maxHeight = 512) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions (maintain aspect ratio)
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = dataURL;
    });
  }

  /**
   * Temizlik - offscreen renderer'ı dispose et
   */
  dispose() {
    if (this.offscreenRenderer) {
      this.offscreenRenderer.dispose();
      this.offscreenRenderer = null;
    }
    if (this.offscreenCamera) {
      this.offscreenCamera = null;
    }
  }
}
