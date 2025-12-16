// Material Library - Ortak malzemeler
import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export class Materials {
  constructor() {
    this.materials = {};
    this.createDefaultMaterials();
  }

  createDefaultMaterials() {
    // Paslanmaz çelik/alüminyum sac malzeme (mat, gerçekçi)
    this.materials.metal = new THREE.MeshStandardMaterial({
      color: 0xdce4ec,  // Açık gri-mavi ton
      roughness: 0.6,   // Daha mat (daha az yansıma)
      metalness: 0.5,   // Daha az metalik (daha yaygın ışık)
      side: THREE.DoubleSide
    });

    console.log('✅ Metal material created:', {
      color: this.materials.metal.color.getHexString(),
      roughness: this.materials.metal.roughness,
      metalness: this.materials.metal.metalness
    });

    // Flanş malzemesi (biraz daha koyu ama yine de açık)
    this.materials.flange = new THREE.MeshStandardMaterial({
      color: 0xc8d0d8,
      roughness: 0.65,
      metalness: 0.45,
      side: THREE.DoubleSide
    });

    // Kenar çizgileri (koyu, kalın, belirgin)
    this.materials.edge = new THREE.LineBasicMaterial({
      color: 0x1a1d22,  // Çok koyu gri-siyah
      linewidth: 2,      // Daha kalın
      depthTest: true,
      depthWrite: true
    });

    // Dimension çizgileri (default)
    this.materials.dimensionLine = new LineMaterial({
      color: 0x207aff,
      linewidth: 3,      // Ekranda ~3px kalınlık
      worldUnits: false,
      depthTest: false,
      depthWrite: false,
      transparent: true
    });

    // Varsayılan çözünürlüğü güncelle (renderer yoksa pencere boyutunu kullan)
    this.updateLineMaterialResolution();
  }

  // Metal malzeme ayarları
  updateMetalProperties(roughness, metalness) {
    this.materials.metal.roughness = roughness;
    this.materials.metal.metalness = metalness;
    this.materials.metal.needsUpdate = true;
  }

  // Yeni dimension line oluştur (renkli)
  createDimensionLineMaterial(color, alwaysOnTop = true) {
    const mat = new LineMaterial({
      color: new THREE.Color(color),
      linewidth: 3,           // Ekranda ~3px kalınlık
      worldUnits: false,
      depthTest: !alwaysOnTop,
      depthWrite: !alwaysOnTop,
      transparent: true
    });

    this.updateLineMaterialResolution(null, mat);
    return mat;
  }

  // Yeni dimension arrow (cone) malzemesi
  createDimensionArrowMaterial(color, alwaysOnTop = true) {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      depthTest: !alwaysOnTop,
      depthWrite: !alwaysOnTop,
      transparent: alwaysOnTop
    });
  }

  // LineMaterial çözünürlüğünü renderer (veya pencere) boyutuna göre ayarla
  updateLineMaterialResolution(renderer = null, material = null) {
    let width = window.innerWidth || 1;
    let height = window.innerHeight || 1;

    if (renderer && renderer.getSize) {
      const size = new THREE.Vector2();
      renderer.getSize(size);
      const ratio = renderer.getPixelRatio ? renderer.getPixelRatio() : 1;
      width = size.x * ratio;
      height = size.y * ratio;
    }

    const apply = (mat) => {
      if (mat && mat.resolution) {
        mat.resolution.set(width, height);
      }
    };

    if (material) {
      apply(material);
    } else {
      apply(this.materials.dimensionLine);
    }
  }

  // Tüm malzemeleri temizle
  dispose() {
    Object.values(this.materials).forEach(mat => {
      if (mat.dispose) mat.dispose();
    });
  }

  // Malzemeleri getir
  get(name) {
    return this.materials[name];
  }
}
