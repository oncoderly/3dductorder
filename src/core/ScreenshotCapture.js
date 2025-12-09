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

    try {
      // UI elementlerini gizle (temiz görüntü için)
      if (hideUI) {
        if (this.scene3D.grid) this.scene3D.grid.visible = false;
        if (this.scene3D.axes) this.scene3D.axes.visible = false;
        if (this.scene3D.axisLabels) this.scene3D.axisLabels.visible = false;
        if (this.scene3D.dimensionGroup) this.scene3D.dimensionGroup.visible = false;
        if (this.scene3D.labelGroup) this.scene3D.labelGroup.visible = false;
      }

      // Kamera pozisyonunu ayarla
      const box = new THREE.Box3().setFromObject(this.scene3D.geometryGroup);
      const center = new THREE.Vector3();
      box.getCenter(center);

      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 2;

      const direction = view.position.clone().normalize();
      const cameraPosition = center.clone().add(direction.multiplyScalar(distance));

      this.camera.position.copy(cameraPosition);
      this.controls.target.copy(center);
      this.controls.update();

      // Render et
      this.renderer.render(this.scene, this.camera);

      let dataURL;

      if (hideUI) {
        // Temiz görüntü - sadece WebGL canvas (ölçüler gizli)
        dataURL = this.renderer.domElement.toDataURL('image/jpeg', 0.8);
      } else {
        // Ölçülerle birlikte görüntü - CSS2D label'ları ekle
        if (this.scene3D.labelRenderer) {
          this.scene3D.labelRenderer.render(this.scene, this.camera);
        }

        // Kısa bekleme (label'ların render edilmesini bekle)
        await new Promise(resolve => setTimeout(resolve, 50));

        // Screenshot al - WebGL canvas + HTML label'ları birleştir
        dataURL = await this.captureWithLabels();
      }

      // Orijinal duruma geri dön
      this.camera.position.copy(originalPosition);
      this.controls.target.copy(originalTarget);
      this.controls.update();

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

    // Her görünümü sırayla çek (küçük bekleme ile smooth geçiş)
    for (const viewName of ['front', 'right', 'top', 'iso']) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms bekleme
      screenshots[viewName] = await this.captureView(viewName, hideUI);
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

      // Arka plan rengini çiz (scene background color)
      const bgColor = this.scene.background;
      if (bgColor) {
        ctx.fillStyle = `rgb(${Math.floor(bgColor.r * 255)}, ${Math.floor(bgColor.g * 255)}, ${Math.floor(bgColor.b * 255)})`;
        ctx.fillRect(0, 0, width, height);
      }

      // 1) WebGL canvas'ını çiz (3D model + ölçü çizgileri)
      ctx.drawImage(this.renderer.domElement, 0, 0, width, height);

      // 2) HTML label'ları çiz (CSS2DRenderer'dan)
      if (this.scene3D.labelRenderer) {
        const labelElements = this.scene3D.labelRenderer.domElement.querySelectorAll('.dimension-label');

        labelElements.forEach(labelEl => {
          if (labelEl.style.display === 'none') return; // Gizli label'ları atla

          // Label'ın ekrandaki pozisyonu ve boyutunu al
          const rect = labelEl.getBoundingClientRect();
          const canvasRect = this.renderer.domElement.getBoundingClientRect();

          // Canvas koordinatlarına çevir
          const x = (rect.left - canvasRect.left) * (width / canvasRect.width);
          const y = (rect.top - canvasRect.top) * (height / canvasRect.height);

          // Label içeriği
          const text = labelEl.textContent;

          // Label stilini al
          const computedStyle = window.getComputedStyle(labelEl);
          const fontSize = parseFloat(computedStyle.fontSize) * (width / canvasRect.width);
          const fontFamily = computedStyle.fontFamily;
          const color = computedStyle.color;
          const backgroundColor = computedStyle.backgroundColor;

          // Arka plan çiz (varsa)
          if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
            ctx.fillStyle = backgroundColor;
            const padding = 4;
            ctx.font = `${fontSize}px ${fontFamily}`;
            const textWidth = ctx.measureText(text).width;
            ctx.fillRect(x - padding, y - fontSize - padding, textWidth + padding * 2, fontSize + padding * 2);
          }

          // Metni çiz
          ctx.fillStyle = color;
          ctx.font = `${fontSize}px ${fontFamily}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(text, x, y);
        });
      }

      // JPEG olarak export et
      const dataURL = compositeCanvas.toDataURL('image/jpeg', 0.8);
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
