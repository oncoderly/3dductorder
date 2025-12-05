// Core 3D Scene Manager - Tüm parçalar için ortak sahne yönetimi
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export class Scene3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupLights();
    this.setupControls();
    this.setupLabelRenderer();
    this.setupGroups();
    this.setupHelpers();
    this.setupViewState();
    this.setupResize();
    this.startAnimation();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false  // Opak arka plan için
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
    if (this.axes) {
      this.axes.visible = visible;
    }
    if (this.axisLabels) {
      this.axisLabels.visible = visible;
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
  }

  startAnimation() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
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
    this.canvas.parentElement.querySelectorAll('.label').forEach(el => el.remove());
  }

  // Label Management
  addLabel(text, position, color = null) {
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = text;
    if (color) div.style.color = color;

    const label = new CSS2DObject(div);
    label.position.copy(position);
    this.dimensionGroup.add(label);
    return label;
  }

  addAxisLabel(text, position, color = null) {
    const div = document.createElement('div');
    div.className = 'label axis-label';
    div.textContent = text;
    if (color) div.style.color = color;
    div.style.fontWeight = '700';
    div.style.fontSize = '14px';

    const label = new CSS2DObject(div);
    label.position.copy(position);
    this.axisLabels.add(label);
    return label;
  }

  // Helper Visibility
  setGridVisible(visible) {
    this.grid.visible = visible;
  }

  setAxesVisible(visible) {
    this.axes.visible = visible;
    if (this.axisLabels) {
      this.axisLabels.visible = visible;
    }
  }

  // Utility
  dispose() {
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
