// Core 3D Scene Manager - Tüm parçalar için ortak sahne yönetimi
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ViewCube } from '../ui/ViewCube.js';

export class Scene3D {
  constructor(canvas) {
    this.canvas = canvas;

    // Sahne bazlı parametreler (tüm parçalar için ortak)
    this.sceneParams = {
      showGrid: false,
      showAxes: false,
      backgroundColor: 0xf5f5f5
    };

    // Dimension popup referansı (dışarıdan set edilecek)
    this.dimensionPopup = null;
    this.currentPart = null;
    this.dimensionLabels = [];
    this.labelLayoutEnabled = true;
    this.labelLayoutBoostFrames = 0;
    this.labelLayoutPendingFrames = 0;
    this.labelLayoutCooldownFrames = 0;
    this.lastCameraMatrix = new THREE.Matrix4();

    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLights();
    this.setupControls();
    this.setupLabelRenderer();
    this.setupGroups();
    this.setupHelpers();
    this.setupViewCube();
    this.setupViewState();
    this.setupResize();
    this.startAnimation();

    // Başlangıç görünürlük durumlarını zorla uygula
    this.setGridVisible(this.sceneParams.showGrid);
    this.setAxesVisible(this.sceneParams.showAxes);
  }

  setupViewCube() {
    this.viewCube = new ViewCube(this, this.camera, this.controls);
  }

  // Sahne parametrelerini döndür (GUI için)
  getSceneParameterDefinitions() {
    return [
      { key: 'showGrid', label: 'Grid Göster', type: 'checkbox' },
      { key: 'showAxes', label: 'Eksenler Göster', type: 'checkbox' },
      { key: 'backgroundColor', label: 'Arkaplan Rengi', type: 'color' }
    ];
  }

  // Sahne parametrelerini güncelle
  updateSceneParam(key, value) {
    console.log('📝 updateSceneParam called:', key, '=', value);
    this.sceneParams[key] = value;

    switch (key) {
      case 'showGrid':
        console.log('  → Calling setGridVisible');
        this.setGridVisible(value);
        break;
      case 'showAxes':
        console.log('  → Calling setAxesVisible');
        this.setAxesVisible(value);
        break;
      case 'backgroundColor':
        console.log('  → Setting background color');
        const colorValue = typeof value === 'string' ? parseInt(value.replace('#', '0x'), 16) : value;
        this.scene.background = new THREE.Color(colorValue);
        break;
    }
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,  // Opak arka plan için
      preserveDrawingBuffer: true  // Screenshot için gerekli
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

    // Tone mapping ve exposure ayarları (parlak, realistik görünüm için)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    console.log('✅ Renderer configured with tone mapping:', {
      toneMapping: this.renderer.toneMapping,
      exposure: this.renderer.toneMappingExposure,
      alpha: false
    });
  }

  setupScene() {
    this.scene = new THREE.Scene();
    // Açık gri/beyaz arka plan (resimdeki gibi)
    this.scene.background = new THREE.Color(0xf5f5f5);
  }

  setupCamera() {
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.01, 10000);
    this.camera.position.set(3.2, 1.9, 3.2);
    this.scene.add(this.camera);
  }

  setupLights() {
    // Ana ambient ışık (daha parlak)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    // Yukarıdan gelen ana ışık (resimdeki gibi yumuşak gölge)
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight1.position.set(5, 10, 5);
    dirLight1.castShadow = false;
    this.scene.add(dirLight1);

    // Yan ışık (detayları göstermek için)
    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight2.position.set(-5, 3, -5);
    this.scene.add(dirLight2);

    // Dolgu ışığı (gölgeleri yumuşatmak için)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(0, -5, 0);
    this.scene.add(fillLight);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
  }

  setupLabelRenderer() {
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.canvas.parentElement.appendChild(this.labelRenderer.domElement);
  }

  setupGroups() {
    this.geometryGroup = new THREE.Group();
    this.geometryGroup.name = 'geometry';

    this.flangeGroup = new THREE.Group();
    this.flangeGroup.name = 'flange';

    this.dimensionGroup = new THREE.Group();
    this.dimensionGroup.name = 'dimensions';

    this.labelGroup = new THREE.Group();
    this.labelGroup.name = 'labels';

    this.scene.add(this.geometryGroup);
    this.scene.add(this.flangeGroup);
    this.scene.add(this.dimensionGroup);
    this.scene.add(this.labelGroup);
  }

  setupHelpers() {
    // Açık gri grid (resimdeki gibi)
    this.grid = new THREE.GridHelper(10, 20, 0xd0d5db, 0xe5e7eb);
    this.grid.visible = false; // Varsayılan kapalı
    this.scene.add(this.grid);

    this.axes = new THREE.AxesHelper(1.2);
    this.axes.visible = false; // Varsayılan kapalı
    this.scene.add(this.axes);

    // Eksen etiketleri ekle (X, Y, Z)
    this.axisLabels = new THREE.Group();
    this.axisLabels.name = 'axis-labels';
    this.axisLabels.visible = false; // Varsayılan kapalı

    const axisLength = 1.3; // AxesHelper'dan biraz daha uzun

    // X ekseni (kırmızı)
    this.addAxisLabel('X', new THREE.Vector3(axisLength, 0, 0), '#ff4444');

    // Y ekseni (yeşil)
    this.addAxisLabel('Y', new THREE.Vector3(0, axisLength, 0), '#44ff44');

    // Z ekseni (mavi)
    this.addAxisLabel('Z', new THREE.Vector3(0, 0, axisLength), '#4444ff');

    this.scene.add(this.axisLabels);
  }

  // Grid görünürlüğünü ayarla
  setGridVisible(visible) {
    if (this.grid) {
      this.grid.visible = visible;
    }
  }

  // Eksen görünürlüğünü ayarla
  setAxesVisible(visible) {
    console.log('🔧 setAxesVisible called:', visible);

    if (this.axes) {
      this.axes.visible = visible;
    }

    if (this.axisLabels) {
      // CSS2D labels için hem visible property hem de DOM display kontrolü gerekli
      this.axisLabels.visible = visible;

      // Her label için ayrı ayrı visible ve DOM kontrolü
      this.axisLabels.children.forEach((label) => {
        if (label.element) {
          // İki yöntem de kullanılmalı:
          // 1. Three.js visible property
          label.visible = visible;
          // 2. DOM display style
          label.element.style.display = visible ? 'block' : 'none';

          console.log(`  Axis label "${label.element.textContent}": visible=${label.visible}, display=${label.element.style.display}`);
        }
      });
    }
  }

  setupViewState() {
    this.lastCenter = new THREE.Vector3();
    this.lastDistance = 3;
    this.didInitialFrame = false;
  }

  setupResize() {
    const resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    resizeObserver.observe(this.canvas.parentElement);
  }

  handleResize() {
    // Canvas'ın parent elementinin boyutlarını kullan
    const parent = this.canvas.parentElement;
    const width = parent.clientWidth;
    const height = parent.clientHeight;

    // Canvas display size'ı güncelle
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
    this.labelRenderer.setSize(width, height);

    // Kalın Line2 materyalleri için çözünürlüğü güncelle
    if (this.materials && this.materials.updateLineMaterialResolution) {
      this.dimensionGroup.traverse((child) => {
        const mats = child.material
          ? (Array.isArray(child.material) ? child.material : [child.material])
          : [];
        mats.forEach(mat => this.materials.updateLineMaterialResolution(this.renderer, mat));
      });
    }
  }

  startAnimation() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.camera.updateMatrixWorld();
      if (!this.lastCameraMatrix.equals(this.camera.matrixWorld)) {
        this.labelLayoutBoostFrames = 1;
        this.labelLayoutPendingFrames = 1;
        this.labelLayoutCooldownFrames = 2;
        this.lastCameraMatrix.copy(this.camera.matrixWorld);
      }
      if (this.labelLayoutEnabled) {
        if (this.labelLayoutCooldownFrames > 0) {
          this.labelLayoutCooldownFrames--;
        } else if (this.labelLayoutPendingFrames > 0) {
          this.updateLabelLayout();
          this.labelLayoutPendingFrames--;
        }
      }
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
    };
    animate();
  }

  // View Management
  setView(direction) {
    const viewVector = direction.clone().normalize().multiplyScalar(this.lastDistance);
    this.camera.position.copy(this.lastCenter.clone().add(viewVector));
    this.camera.near = this.lastDistance / 100;
    this.camera.far = this.lastDistance * 100;
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(this.lastCenter);
    this.controls.update();
  }

  frameFit(targetObject) {
    const box = new THREE.Box3().setFromObject(targetObject);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) * 1.3;
    const direction = new THREE.Vector3(1, 0.8, 1).normalize();

    this.camera.position.copy(center.clone().add(direction.multiplyScalar(distance)));
    this.camera.near = distance / 100;
    this.camera.far = distance * 100;
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(center);
    this.controls.update();

    this.lastCenter.copy(center);
    this.lastDistance = distance;
  }

  // Group Management
  clearGroup(group) {
    while (group.children.length) {
      const child = group.children.pop();
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach(m => m.dispose && m.dispose());
      }
    }
  }

  clearLabels() {
    // Sadece dimension label'ları temizle, axis label'ları kalıcı
    this.canvas.parentElement.querySelectorAll('.label:not(.axis-label)').forEach(el => el.remove());
    this.dimensionLabels = [];
  }

  // Label Management
  addLabel(text, position, color = null, paramData = null, customClass = null) {
    const div = document.createElement('div');
    div.className = customClass ? `label ${customClass}` : 'label';
    div.textContent = text;
    if (color) div.style.color = color;

    // Debug log
    if (paramData) {
      console.log('📍 Label created:', text, 'paramData:', paramData, 'popup:', !!this.dimensionPopup, 'part:', !!this.currentPart);
    }

    // Eğer paramData varsa (dimension label), tıklanabilir yap
    if (paramData && this.dimensionPopup && this.currentPart) {
      div.style.cursor = 'pointer';
      div.style.userSelect = 'none';
      div.style.touchAction = 'manipulation';
      div.classList.add('dimension-label');

      // Mobil ve desktop için birleşik event handler
      let touchStartTime = 0;
      let touchMoved = false;
      let touchStartPos = { x: 0, y: 0 };
      let isProcessing = false;

      // Touch start - başlangıç zamanını kaydet
      div.addEventListener('touchstart', (e) => {
        touchStartTime = Date.now();
        touchMoved = false;
        isProcessing = false;
        if (e.touches[0]) {
          touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          };
        }
        console.log('🟢 touchstart on label:', text);
      }, { passive: true });

      // Touch move - hareket algıla
      div.addEventListener('touchmove', (e) => {
        if (e.touches[0]) {
          const deltaX = Math.abs(e.touches[0].clientX - touchStartPos.x);
          const deltaY = Math.abs(e.touches[0].clientY - touchStartPos.y);
          if (deltaX > 10 || deltaY > 10) {
            touchMoved = true;
            console.log('🔵 touchmove detected - moved:', deltaX, deltaY);
          }
        }
      }, { passive: true });

      // Touch end - PASSIVE bırakıyoruz, click event'e güveniyoruz
      div.addEventListener('touchend', (e) => {
        const touchDuration = Date.now() - touchStartTime;
        console.log('🟡 touchend on label:', text, 'duration:', touchDuration, 'moved:', touchMoved);

        // Sadece bilgi için - asıl işlem click'te
        if (!touchMoved && touchDuration < 500) {
          isProcessing = true;
          console.log('✅ Valid tap detected, waiting for click event...');
        }
      }, { passive: true });

      // Click event - Hem mobil hem desktop için
      div.addEventListener('click', (e) => {
        console.log('🔴 click event triggered on label:', text, 'pointerType:', e.pointerType);

        e.preventDefault();
        e.stopPropagation();

        // Touch pozisyonunu al
        const eventData = {
          clientX: e.clientX || touchStartPos.x,
          clientY: e.clientY || touchStartPos.y
        };

        console.log('📍 Opening popup at:', eventData);
        this.dimensionPopup.show(paramData, this.currentPart, eventData);
      }, false);
    }

    const label = new CSS2DObject(div);
    label.position.copy(position);
    label.userData.basePosition = position.clone();
    this.dimensionGroup.add(label);
    this.dimensionLabels.push(label);
    this.labelLayoutBoostFrames = Math.max(this.labelLayoutBoostFrames, 8);
    return label;
  }

  updateLabelLayout() {
    if (!this.dimensionLabels || this.dimensionLabels.length < 2) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;

    const cameraDir = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDir);
    const right = new THREE.Vector3().crossVectors(cameraDir, this.camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, cameraDir).normalize();
    const tanFov = Math.tan(THREE.MathUtils.degToRad(this.camera.fov * 0.5));
    const aspect = this.camera.aspect;

    const items = [];
    for (const label of this.dimensionLabels) {
      if (!label.element || !label.userData.basePosition) continue;
      const w = label.element.offsetWidth;
      const h = label.element.offsetHeight;
      if (w === 0 || h === 0) continue;

      const base = label.userData.basePosition.clone();
      const ndc = base.clone().project(this.camera);
      if (ndc.z < -1 || ndc.z > 1) continue;

      const sx = (ndc.x * 0.5 + 0.5) * width;
      const sy = (-ndc.y * 0.5 + 0.5) * height;
      items.push({ label, base, sx, sy, w, h, offset: new THREE.Vector2(0, 0) });
    }

    if (items.length < 2) return;

    const boost = this.labelLayoutBoostFrames > 0;
    const padding = boost ? 10 : 8;
    const maxOffset = boost ? 160 : 120;
    const iterations = boost ? 16 : 10;
    const pushFactor = boost ? 0.7 : 0.6;

    for (let iter = 0; iter < iterations; iter++) {
      let moved = false;
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i];
          const b = items[j];
          const ax = a.sx + a.offset.x;
          const ay = a.sy + a.offset.y;
          const bx = b.sx + b.offset.x;
          const by = b.sy + b.offset.y;
          const overlapX = (a.w + b.w) * 0.5 + padding - Math.abs(ax - bx);
          const overlapY = (a.h + b.h) * 0.5 + padding - Math.abs(ay - by);

          if (overlapX > 0 && overlapY > 0) {
            if (overlapY <= overlapX) {
              const push = overlapY * pushFactor;
              const dir = ay < by ? -1 : 1;
              a.offset.y += dir * -push;
              b.offset.y += dir * push;
            } else {
              const push = overlapX * pushFactor;
              const dir = ax < bx ? -1 : 1;
              a.offset.x += dir * -push;
              b.offset.x += dir * push;
            }
            moved = true;
          }
        }
      }
      if (!moved) break;
    }

    for (const item of items) {
      item.offset.x = Math.max(-maxOffset, Math.min(maxOffset, item.offset.x));
      item.offset.y = Math.max(-maxOffset, Math.min(maxOffset, item.offset.y));

      const depth = cameraDir.dot(new THREE.Vector3().subVectors(item.base, this.camera.position));
      if (depth <= 0) continue;
      const worldPerPixelY = (2 * depth * tanFov) / height;
      const worldPerPixelX = worldPerPixelY * aspect;
      const offsetWorld = right.clone()
        .multiplyScalar(item.offset.x * worldPerPixelX)
        .add(up.clone().multiplyScalar(-item.offset.y * worldPerPixelY));
      item.label.position.copy(item.base.clone().add(offsetWorld));
    }

    if (this.labelLayoutBoostFrames > 0) {
      this.labelLayoutBoostFrames--;
    }
  }

  addAxisLabel(text, position, color = null) {
    const div = document.createElement('div');
    div.className = 'label axis-label';
    div.textContent = text;
    if (color) div.style.color = color;
    div.style.fontWeight = '700';
    div.style.fontSize = '14px';
    div.style.display = 'none'; // Başlangıçta gizli (axes default false)

    const label = new CSS2DObject(div);
    label.position.copy(position);
    this.axisLabels.add(label);
    return label;
  }


  // Utility
  dispose() {
    if (this.viewCube) {
      this.viewCube.dispose();
    }
    this.controls.dispose();
    this.renderer.dispose();
    if (this.labelRenderer.domElement.parentElement) {
      this.labelRenderer.domElement.parentElement.removeChild(this.labelRenderer.domElement);
    }
  }

  // Static helpers
  static cm(value) {
    return value * 0.01;
  }

  static V(x = 0, y = 0, z = 0) {
    return new THREE.Vector3(x, y, z);
  }
}
