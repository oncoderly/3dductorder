// ViewCube - 3D Navigation Cube (Mobil uyumlu)
import * as THREE from 'three';

export class ViewCube {
  constructor(scene, camera, controls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.container = null;

    this.views = {
      front: { label: 'Ön', position: new THREE.Vector3(0, 0, 3) },
      back: { label: 'Arka', position: new THREE.Vector3(0, 0, -3) },
      left: { label: 'Sol', position: new THREE.Vector3(-3, 0, 0) },
      right: { label: 'Sağ', position: new THREE.Vector3(3, 0, 0) },
      top: { label: 'Üst', position: new THREE.Vector3(0, 3, 0) },
      bottom: { label: 'Alt', position: new THREE.Vector3(0, -3, 0) },
      iso: { label: 'İzo', position: new THREE.Vector3(2, 2, 2) }
    };

    this.init();
  }

  init() {
    // Container oluştur
    this.container = document.createElement('div');
    this.container.className = 'view-cube';
    this.container.innerHTML = `
      <div class="view-cube-grid">
        <button class="view-cube-btn" data-view="top" title="Üstten Görünüm">Üst</button>
        <button class="view-cube-btn" data-view="front" title="Önden Görünüm">Ön</button>
        <button class="view-cube-btn" data-view="right" title="Sağdan Görünüm">Sağ</button>
        <button class="view-cube-btn" data-view="left" title="Soldan Görünüm">Sol</button>
        <button class="view-cube-btn" data-view="back" title="Arkadan Görünüm">Arka</button>
        <button class="view-cube-btn" data-view="bottom" title="Alttan Görünüm">Alt</button>
        <button class="view-cube-btn view-cube-btn-iso" data-view="iso" title="İzometrik Görünüm">İzo</button>
      </div>
    `;

    // Event listeners
    this.container.querySelectorAll('.view-cube-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const viewName = e.target.dataset.view;
        this.setView(viewName);
      });
    });

    // Canvas wrapper'a ekle
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    if (canvasWrapper) {
      canvasWrapper.appendChild(this.container);
    }
  }

  setView(viewName) {
    const view = this.views[viewName];
    if (!view) return;

    // Target: geometry group'un merkezi
    const target = this.scene.geometryGroup.position.clone();

    // Bounding box hesapla
    const box = new THREE.Box3().setFromObject(this.scene.geometryGroup);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Distance: bounding sphere'den hesapla
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;

    // Camera pozisyon hesapla
    const direction = view.position.clone().normalize();
    const cameraPosition = center.clone().add(direction.multiplyScalar(distance));

    // Animasyonlu geçiş
    this.animateCamera(cameraPosition, center);
  }

  animateCamera(targetPosition, targetLookAt, duration = 600) {
    const startPosition = this.camera.position.clone();
    const startLookAt = this.controls.target.clone();
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-in-out interpolation
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Interpolate position
      this.camera.position.lerpVectors(startPosition, targetPosition, eased);

      // Interpolate target
      this.controls.target.lerpVectors(startLookAt, targetLookAt, eased);

      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  show() {
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  hide() {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  dispose() {
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
  }
}
