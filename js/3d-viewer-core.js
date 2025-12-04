// 3D Viewer Core - Common functionality for all part viewers
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export class Viewer3D {
  constructor() {
    // Canvas ve Renderer
    this.canvas = document.getElementById('c');
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.01,
      1e4
    );
    this.camera.position.set(3.2, 1.9, 3.2);
    this.scene.add(this.camera);

    // Lights
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x101018, 0.9));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(3, 5, 4);
    this.scene.add(directionalLight);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    // Grid & Axes
    this.grid = new THREE.GridHelper(10, 20, 0x2a2e35, 0x1a1d23);
    this.scene.add(this.grid);
    this.axes = new THREE.AxesHelper(1);
    this.scene.add(this.axes);

    // CSS2D Label Renderer
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    Object.assign(this.labelRenderer.domElement.style, {
      position: 'absolute',
      top: '0',
      pointerEvents: 'none'
    });
    document.body.appendChild(this.labelRenderer.domElement);

    // Groups
    this.geometryGroup = new THREE.Group();
    this.flangeGroup = new THREE.Group();
    this.dimensionGroup = new THREE.Group();
    this.labelGroup = new THREE.Group();
    this.scene.add(this.geometryGroup, this.flangeGroup, this.dimensionGroup, this.labelGroup);

    // View state
    this.lastCenter = new THREE.Vector3();
    this.lastDistance = 3;
    this.didInitialFrame = false;

    // Setup views
    this.setupViewButtons();
    this.setupResize();
    this.startAnimationLoop();
  }

  setupViewButtons() {
    const views = {
      'Right': new THREE.Vector3(1, 0, 0),
      'Left': new THREE.Vector3(-1, 0, 0),
      'Front': new THREE.Vector3(0, 0, 1),
      'Back': new THREE.Vector3(0, 0, -1),
      'Top': new THREE.Vector3(0, 1, 0),
      'SW Iso': new THREE.Vector3(-1, 1, -1),
      'NE Iso': new THREE.Vector3(1, 1, 1)
    };

    const viewbar = document.getElementById('viewbar');
    if (viewbar) {
      viewbar.querySelectorAll('.vbtn').forEach(btn => {
        btn.addEventListener('click', () => {
          const viewName = btn.dataset.v;
          const viewDir = views[viewName];
          if (viewDir) {
            this.setView(viewDir);
          }
        });
      });

      // Add icons to buttons
      viewbar.querySelectorAll('.vbtn').forEach(btn => {
        const label = btn.textContent;
        const svg = this.getViewIconSVG(btn.dataset.v || label);
        btn.innerHTML = svg + `<span>${label}</span>`;
      });
    }
  }

  setView(direction) {
    const viewVector = direction.clone().normalize().multiplyScalar(this.lastDistance);
    this.camera.position.copy(this.lastCenter.clone().add(viewVector));
    this.camera.near = this.lastDistance / 100;
    this.camera.far = this.lastDistance * 100;
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(this.lastCenter);
    this.controls.update();
  }

  getViewIconSVG(name) {
    const stroke = '#9aa7b1', face = '#263040', accent = '#4cc3ff';

    const cubeSVG = (highlight) => {
      const top = `<polygon points="6,10 12,6 18,10 12,14" fill="${highlight === 'top' ? accent : face}" stroke="${stroke}" stroke-width="1"/>`;
      const left = `<polygon points="6,10 6,18 12,22 12,14" fill="${highlight === 'left' ? accent : face}" stroke="${stroke}" stroke-width="1"/>`;
      const right = `<polygon points="12,14 12,22 18,18 18,10" fill="${highlight === 'right' ? accent : face}" stroke="${stroke}" stroke-width="1"/>`;
      return `<svg class="vicon" viewBox="0 0 24 24" aria-hidden="true">${top}${left}${right}</svg>`;
    };

    const faceSVG = () => {
      return `<svg class="vicon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" ry="2" fill="${accent}" stroke="${stroke}" stroke-width="1"/></svg>`;
    };

    const backSVG = () => {
      return `<svg class="vicon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="12" height="12" rx="2" ry="2" fill="${face}" stroke="${stroke}" stroke-width="1"/><rect x="7" y="7" width="12" height="12" rx="2" ry="2" fill="${accent}" stroke="${stroke}" stroke-width="1"/></svg>`;
    };

    switch(name) {
      case 'Top': return cubeSVG('top');
      case 'Left': return cubeSVG('left');
      case 'Right': return cubeSVG('right');
      case 'Front': return faceSVG();
      case 'Back': return backSVG();
      case 'SW Iso':
      case 'NE Iso':
      default: return cubeSVG(null);
    }
  }

  frameFit(targetObject) {
    const box = new THREE.Box3().setFromObject(targetObject);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) * 1.1;
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

  addLabel(text, position, color = null) {
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = text;
    if (color) div.style.color = color;
    const label = new CSS2DObject(div);
    label.position.copy(position);
    this.scene.add(label);
    this.dimensionGroup.add(label);
    return label;
  }

  addRootLabel(text, position, color = null) {
    const div = document.createElement('div');
    div.className = 'label';
    div.textContent = text;
    if (color) div.style.color = color;
    const label = new CSS2DObject(div);
    label.position.copy(position);
    this.labelGroup.add(label);
    return label;
  }

  setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  startAnimationLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.labelRenderer.render(this.scene, this.camera);
    };
    animate();
  }

  // Utility functions
  static cm(value) {
    return value * 0.01;
  }

  static V(x = 0, y = 0, z = 0) {
    return new THREE.Vector3(x, y, z);
  }
}