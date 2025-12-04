// BasePart - Tüm parçaların base class'ı
import * as THREE from 'three';

export class BasePart {
  constructor(scene, materials) {
    this.scene = scene;
    this.materials = materials;
    this.params = {};
    this.defaultParams = {};

    // Initialize default parameters
    this.initDefaultParams();
  }

  // Her parça kendi default parametrelerini set eder
  initDefaultParams() {
    this.defaultParams = {
      // Görünüm
      showEdges: true,
      showDims: true,
      showFlange: true,
      keepViewOnEdit: true,

      // Flanş
      flangeLip: 3.0,
      flangeThick: 0.6,

      // Malzeme
      metalRough: 0.35,
      metalness: 0.85,

      // Ölçülendirme
      dimAlwaysOnTop: true,
      dimFixedOffset: true,
      dimOffsetCm: 1.5,
      arrowHeadCm: 4.0,
      arrowRadiusCm: 1.2,
      extLenCm: 15,
      extGapCm: 1,
      dimPlaneOffsetCm: 20,
      labelOffsetCm: 0.5,

      // Alan hesabı
      areaIncludeFlange: false,
      wastePercent: 25,
      kFactor: 1
    };

    this.params = { ...this.defaultParams };
  }

  // Abstract methods - Her parça bunları implement etmeli
  buildGeometry() {
    throw new Error('buildGeometry() must be implemented');
  }

  calculateArea() {
    throw new Error('calculateArea() must be implemented');
  }

  getDimensions() {
    throw new Error('getDimensions() must be implemented');
  }

  getParameterDefinitions() {
    throw new Error('getParameterDefinitions() must be implemented');
  }

  // Ortak metodlar
  rebuild() {
    const preserve = this.params.keepViewOnEdit && this.scene.didInitialFrame;
    let camState;

    if (preserve) {
      camState = {
        pos: this.scene.camera.position.clone(),
        quat: this.scene.camera.quaternion.clone(),
        tgt: this.scene.controls.target.clone()
      };
    }

    // Temizle
    this.scene.clearGroup(this.scene.geometryGroup);
    this.scene.clearGroup(this.scene.flangeGroup);
    this.scene.clearGroup(this.scene.dimensionGroup);
    this.scene.clearGroup(this.scene.labelGroup);
    this.scene.clearLabels();

    // Geometriyi oluştur
    this.buildGeometry();

    // Flanşları oluştur (eğer varsa)
    if (this.params.showFlange && this.buildFlange) {
      this.buildFlange();
    }

    // Ölçüleri çiz
    if (this.params.showDims) {
      this.drawDimensions();
    }

    // Kenar çizgilerini ekle
    if (this.params.showEdges) {
      this.addEdges();
    }

    // Kadraj ayarla
    if (!preserve) {
      this.scene.frameFit(this.scene.geometryGroup);
      this.scene.didInitialFrame = true;
    } else {
      this.scene.camera.position.copy(camState.pos);
      this.scene.camera.quaternion.copy(camState.quat);
      this.scene.camera.updateProjectionMatrix();
      this.scene.controls.target.copy(camState.tgt);
      this.scene.controls.update();
      this.scene.lastCenter.copy(this.scene.controls.target);
      this.scene.lastDistance = this.scene.camera.position.distanceTo(this.scene.controls.target);
    }

    // Alan hesabını güncelle
    this.updateAreaDisplay();
  }

  // Ortak ölçülendirme fonksiyonları
  createDimensionLine(p1, p2, offsetDir, label, color) {
    const n = offsetDir.clone().normalize();
    const gap = BasePart.cm(this.params.extGapCm);
    const targetOff = this.params.dimFixedOffset
      ? BasePart.cm(this.params.dimPlaneOffsetCm)
      : (gap + BasePart.cm(this.params.extLenCm));

    const s1 = p1.clone().add(n.clone().multiplyScalar(gap));
    const e1 = p1.clone().add(n.clone().multiplyScalar(targetOff));
    const s2 = p2.clone().add(n.clone().multiplyScalar(gap));
    const e2 = p2.clone().add(n.clone().multiplyScalar(targetOff));

    const mat = this.materials.createDimensionLineMaterial(color, this.params.dimAlwaysOnTop);

    const L1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([s1, e1]), mat);
    const L2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([s2, e2]), mat);
    L1.renderOrder = L2.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;

    this.scene.dimensionGroup.add(L1, L2);

    const head = BasePart.cm(this.params.arrowHeadCm);
    const rad = BasePart.cm(this.params.arrowRadiusCm);
    const dir = new THREE.Vector3().subVectors(e2, e1).normalize();
    const off = BasePart.cm(this.params.dimOffsetCm);

    const a1 = e1.clone().add(dir.clone().multiplyScalar(off));
    const a2 = e2.clone().add(dir.clone().multiplyScalar(-off));
    this.createArrow(a1, a2, color, head, rad);

    const mid = a1.clone().add(a2).multiplyScalar(0.5)
      .add(n.clone().multiplyScalar(BasePart.cm(this.params.labelOffsetCm)));
    return this.scene.addLabel(label, mid, color);
  }

  createArrow(p1, p2, color, head, rad) {
    const mat = this.materials.createDimensionLineMaterial(color, this.params.dimAlwaysOnTop);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p1, p2]), mat);
    line.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;

    const dir = new THREE.Vector3().subVectors(p2, p1).normalize();

    const makeCone = (q, p) => {
      const arrowMat = this.materials.createDimensionArrowMaterial(color, this.params.dimAlwaysOnTop);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(rad, head, 12), arrowMat);
      cone.quaternion.copy(q);
      cone.position.copy(p);
      cone.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
      return cone;
    };

    const q2 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const q1 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());

    this.scene.dimensionGroup.add(line, makeCone(q2, p2), makeCone(q1, p1));
  }

  // Triangle area helper
  triangleArea(a, b, c) {
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);
    return ab.cross(ac).length() * 0.5;
  }

  // Flanş oluşturma helper (dikdörtgen)
  createFlangeRect(Wm, Hm, lip, th) {
    const shape = new THREE.Shape([
      new THREE.Vector2(-Wm / 2 - lip, -Hm / 2 - lip),
      new THREE.Vector2(Wm / 2 + lip, -Hm / 2 - lip),
      new THREE.Vector2(Wm / 2 + lip, Hm / 2 + lip),
      new THREE.Vector2(-Wm / 2 - lip, Hm / 2 + lip)
    ]);

    const hole = new THREE.Path([
      new THREE.Vector2(-Wm / 2, -Hm / 2),
      new THREE.Vector2(Wm / 2, -Hm / 2),
      new THREE.Vector2(Wm / 2, Hm / 2),
      new THREE.Vector2(-Wm / 2, Hm / 2)
    ]);

    shape.holes.push(hole);

    const geometry = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: false });
    geometry.center();

    const mesh = new THREE.Mesh(geometry, this.materials.get('flange'));
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), this.materials.get('edge')));
    return mesh;
  }

  // Kenar çizgileri ekle (override edilebilir)
  addEdges() {
    // Default implementation - geometryGroup'taki meshlere edge ekler
    this.scene.geometryGroup.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(child.geometry, 1),
          this.materials.get('edge')
        );
        this.scene.geometryGroup.add(edges);
      }
    });
  }

  // Ölçüleri çiz (her parça kendi implementasyonunu yapar)
  drawDimensions() {
    // Override in child classes
  }

  // Alan gösterimini güncelle
  updateAreaDisplay() {
    const areaData = this.calculateArea();
    if (this.areaDisplayElement) {
      const outer = areaData.outer || 0;
      const sheet = outer * (this.params.kFactor || 1);
      const waste = sheet * (1 + (this.params.wastePercent || 0) / 100);

      this.areaDisplayElement.textContent =
        `Dış: ${outer.toFixed(3)} m² | k=${(this.params.kFactor || 1).toFixed(2)} ⇒ ${sheet.toFixed(3)} m² | +%${(this.params.wastePercent || 0).toFixed(1)} atık ⇒ ${waste.toFixed(3)} m²`;
    }
  }

  // Malzeme özelliklerini güncelle
  updateMaterialProperties() {
    this.materials.updateMetalProperties(this.params.metalRough, this.params.metalness);
  }

  // Parametreleri export et (sipariş için)
  exportParams() {
    const dimensions = this.getDimensions();
    return {
      ...dimensions,
      ...this.params
    };
  }

  // Static helpers
  static cm(value) {
    return value * 0.01;
  }

  static V(x = 0, y = 0, z = 0) {
    return new THREE.Vector3(x, y, z);
  }
}
