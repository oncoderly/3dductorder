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
  }

  /**
   * Tek bir görünümün screenshot'ını çeker
   * @param {string} viewName - 'front', 'right', 'top', 'iso'
   * @param {boolean} hideUI - Grid, axes, dimensions gizlensin mi
   * @returns {Promise<string>} - Base64 JPEG string
   */
  async captureView(viewName, hideUI = true) {
    const view = this.views[viewName];
    if (!view) {
      throw new Error(`Unknown view: ${viewName}`);
    }

    // Mevcut durumu kaydet
    const originalPosition = this.camera.position.clone();
    const originalTarget = this.controls.target.clone();
    const originalGridVisible = this.scene3D.grid ? this.scene3D.grid.visible : false;
    const originalAxesVisible = this.scene3D.axes ? this.scene3D.axes.visible : false;
    const originalDimensionsVisible = this.scene3D.dimensionGroup ? this.scene3D.dimensionGroup.visible : false;
    const originalLabelsVisible = this.scene3D.labelGroup ? this.scene3D.labelGroup.visible : false;

    // Orijinal renderer boyutlarını kaydet
    const canvas = this.renderer.domElement;
    const originalWidth = canvas.clientWidth;
    const originalHeight = canvas.clientHeight;
    const originalPixelRatio = this.renderer.getPixelRatio();

    try {
      // UI elementlerini gizle (temiz görüntü için)
      if (hideUI) {
        if (this.scene3D.grid) this.scene3D.grid.visible = false;
        if (this.scene3D.axes) this.scene3D.axes.visible = false;
        if (this.scene3D.axisLabels) this.scene3D.axisLabels.visible = false;
        if (this.scene3D.dimensionGroup) this.scene3D.dimensionGroup.visible = false;
        if (this.scene3D.labelGroup) this.scene3D.labelGroup.visible = false;
      }

      // Yüksek çözünürlük için geçici olarak renderer'ı büyüt (2x)
      const highResWidth = 1920;
      const highResHeight = 1440;
      this.renderer.setSize(highResWidth, highResHeight, false);
      this.renderer.setPixelRatio(2);

      // Kamera aspect ratio'sunu güncelle
      this.camera.aspect = highResWidth / highResHeight;
      this.camera.updateProjectionMatrix();

      // Kamera pozisyonunu ayarla
      // Bounding box hesabına hem parçayı hem ölçü çizgilerini dahil et
      const box = new THREE.Box3();

      // Parça geometrisini ekle
      box.setFromObject(this.scene3D.geometryGroup);

      // Ölçü çizgilerini de dahil et (eğer varsa ve görünürse)
      if (this.scene3D.dimensionGroup && this.scene3D.dimensionGroup.visible) {
        const dimensionBox = new THREE.Box3().setFromObject(this.scene3D.dimensionGroup);
        box.union(dimensionBox);
      }

      const center = new THREE.Vector3();
      box.getCenter(center);

      const size = new THREE.Vector3();
      box.getSize(size);

      // Parça + ölçü çizgilerine göre dinamik mesafe hesapla
      // FOV'u (Field of View) dikkate alarak optimal mesafeyi bul
      const fov = this.camera.fov * (Math.PI / 180); // Radyan'a çevir
      const maxDim = Math.max(size.x, size.y, size.z);

      // Her şeyi çerçevelemek için gerekli mesafe
      // %30 padding ekle (1.3 çarpanı - ölçü çizgileri için daha fazla alan)
      const distance = (maxDim * 1.3) / (2 * Math.tan(fov / 2));

      const direction = view.position.clone().normalize();
      const cameraPosition = center.clone().add(direction.multiplyScalar(distance));

      this.camera.position.copy(cameraPosition);
      this.controls.target.copy(center);
      this.controls.update();

      // CSS transitions/animations'ı geçici olarak devre dışı bırak
      const labelRenderer = this.scene3D.labelRenderer;
      let originalTransitions = [];
      if (labelRenderer) {
        const labels = labelRenderer.domElement.querySelectorAll('.dimension-label');
        labels.forEach((label, index) => {
          originalTransitions[index] = label.style.transition;
          label.style.transition = 'none';
        });
      }

      // Birden fazla render pass yap (label'ların yerleşmesi için)
      this.renderer.render(this.scene, this.camera);
      if (labelRenderer) {
        labelRenderer.render(this.scene, this.camera);
      }

      // İkinci render pass (stabilizasyon için)
      await new Promise(resolve => setTimeout(resolve, 50));
      this.renderer.render(this.scene, this.camera);
      if (labelRenderer) {
        labelRenderer.render(this.scene, this.camera);
      }

      // Son render ve screenshot
      await new Promise(resolve => setTimeout(resolve, 150));
      this.renderer.render(this.scene, this.camera);
      if (labelRenderer) {
        labelRenderer.render(this.scene, this.camera);
      }

      let dataURL;

      if (hideUI) {
        // Temiz görüntü - yüksek çözünürlük JPEG
        dataURL = this.renderer.domElement.toDataURL('image/jpeg', 0.90);
      } else {
        // Screenshot al - WebGL canvas + HTML label'ları birleştir
        dataURL = await this.captureWithLabels();
      }

      // Transitions'ı geri yükle
      if (labelRenderer && originalTransitions.length > 0) {
        const labels = labelRenderer.domElement.querySelectorAll('.dimension-label');
        labels.forEach((label, index) => {
          label.style.transition = originalTransitions[index] || '';
        });
      }

      // Orijinal duruma geri dön
      this.camera.position.copy(originalPosition);
      this.controls.target.copy(originalTarget);
      this.controls.update();

      // Renderer boyutlarını ve pixel ratio'yu geri yükle
      // updateStyle: true kullan ki CSS boyutları da geri yüklensin
      this.renderer.setSize(originalWidth, originalHeight, true);
      this.renderer.setPixelRatio(originalPixelRatio);

      // Kamera aspect ratio'sunu geri yükle
      this.camera.aspect = originalWidth / originalHeight;
      this.camera.updateProjectionMatrix();

      if (hideUI) {
        if (this.scene3D.grid) this.scene3D.grid.visible = originalGridVisible;
        if (this.scene3D.axes) this.scene3D.axes.visible = originalAxesVisible;
        if (this.scene3D.axisLabels) this.scene3D.axisLabels.visible = originalAxesVisible;
        if (this.scene3D.dimensionGroup) this.scene3D.dimensionGroup.visible = originalDimensionsVisible;
        if (this.scene3D.labelGroup) this.scene3D.labelGroup.visible = originalLabelsVisible;
      }

      // Final render (orijinal görünüme geri dön)
      this.renderer.render(this.scene, this.camera);

      return dataURL;

    } catch (error) {
      // Hata durumunda da orijinal duruma dön
      this.camera.position.copy(originalPosition);
      this.controls.target.copy(originalTarget);
      this.controls.update();

      // Renderer boyutlarını ve pixel ratio'yu geri yükle
      // updateStyle: true kullan ki CSS boyutları da geri yüklensin
      this.renderer.setSize(originalWidth, originalHeight, true);
      this.renderer.setPixelRatio(originalPixelRatio);

      // Kamera aspect ratio'sunu geri yükle
      this.camera.aspect = originalWidth / originalHeight;
      this.camera.updateProjectionMatrix();

      if (hideUI) {
        if (this.scene3D.grid) this.scene3D.grid.visible = originalGridVisible;
        if (this.scene3D.axes) this.scene3D.axes.visible = originalAxesVisible;
        if (this.scene3D.axisLabels) this.scene3D.axisLabels.visible = originalAxesVisible;
        if (this.scene3D.dimensionGroup) this.scene3D.dimensionGroup.visible = originalDimensionsVisible;
        if (this.scene3D.labelGroup) this.scene3D.labelGroup.visible = originalLabelsVisible;
      }

      this.renderer.render(this.scene, this.camera);

      throw error;
    }
  }

  /**
   * Tüm 4 görünümün screenshot'larını sırayla çeker
   * @param {boolean} hideUI - UI elementleri gizlensin mi
   * @returns {Promise<Object>} - { front, right, top, iso } base64 strings
   */
  async captureAllViews(hideUI = true) {
    const screenshots = {};

    // Her görünümü sırayla çek
    // captureView içinde zaten stabilizasyon bekleme süresi var
    for (const viewName of ['front', 'right', 'top', 'iso']) {
      screenshots[viewName] = await this.captureView(viewName, hideUI);
      // Görünümler arası küçük bekleme (kontrolün serbest kalması için)
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return screenshots;
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
}
