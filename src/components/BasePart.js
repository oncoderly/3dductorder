// BasePart - Tüm parçaların base class'ı
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

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
      // Görünüm (parça-specific)
      showEdges: true,
      showDims: true,
      showFlange: true,
      keepViewOnEdit: true,
      // showGrid ve showAxes artık Scene3D'de yönetiliyor

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
      kFactor: 1,

      // Sheet scale (mm)
      sheetScaleEnabled: true,
      sheetScaleAuto: true,
      sheetScaleManualEdgeMm: 500
    };

    const sheetScaleDefaults = {};
    const defaultEnabled = new Set([0.6, 0.8, 1.0, 1.2]);
    BasePart.getGalvanizedThicknessListMm().forEach((value) => {
      const key = BasePart.getSheetScaleKey(value);
      sheetScaleDefaults[`sheetScaleT${key}Enabled`] = defaultEnabled.has(value);
      sheetScaleDefaults[`sheetScaleT${key}MaxMm`] = BasePart.getSheetScaleDefaultLimitMm(value);
    });

    this.defaultParams = { ...this.defaultParams, ...sheetScaleDefaults };

    this.params = { ...this.defaultParams };
  }

  // Ortak parameter definitions - Tüm parçalar için
  getCommonParameterDefinitions() {
    return {
      view: [
        { key: 'showEdges', label: 'Kenar Çizgileri', type: 'checkbox' },
        { key: 'showDims', label: 'Ölçülendirme', type: 'checkbox' },
        { key: 'showFlange', label: 'Flanşları Göster', type: 'checkbox' },
        { key: 'keepViewOnEdit', label: 'Görüşü Koru', type: 'checkbox' }
      ],
      flange: [
        { key: 'flangeLip', label: 'Flanş Payı', min: 1, max: 8, step: 1, unit: 'cm', default: 3.0 },
        { key: 'flangeThick', label: 'Flanş Kalınlığı', min: 0.2, max: 2, step: 0.05, unit: 'cm', default: 0.6 }
      ],
      material: [
        { key: 'metalRough', label: 'Pürüzlülük', min: 0, max: 1, step: 0.01, default: 0.35 },
        { key: 'metalness', label: 'Metallik', min: 0, max: 1, step: 0.01, default: 0.85 }
      ],
      dimension: [
        { key: 'dimAlwaysOnTop', label: 'Ölçüler Üstte', type: 'checkbox' },
        { key: 'dimFixedOffset', label: 'Sabit Ofset', type: 'checkbox' },
        { key: 'dimOffsetCm', label: 'Ölçü Ofseti', min: 0, max: 10, step: 1, unit: 'cm', default: 1.5 },
        { key: 'arrowHeadCm', label: 'Ok Başı', min: 1, max: 10, step: 1, unit: 'cm', default: 4.0 },
        { key: 'arrowRadiusCm', label: 'Ok Yarıçapı', min: 1, max: 5, step: 1, unit: 'cm', default: 1.2 },
        { key: 'extLenCm', label: 'Uzatma', min: 5, max: 50, step: 1, unit: 'cm', default: 15 },
        { key: 'extGapCm', label: 'Boşluk', min: 0, max: 10, step: 1, unit: 'cm', default: 1 },
        { key: 'dimPlaneOffsetCm', label: 'Düzlem Ofseti', min: 5, max: 100, step: 1, unit: 'cm', default: 20 },
        { key: 'labelOffsetCm', label: 'Etiket Ofseti', min: 0, max: 5, step: 1, unit: 'cm', default: 0.5 }
      ],
      area: [
        { key: 'areaIncludeFlange', label: 'Flanşı Dahil Et', type: 'checkbox' },
        { key: 'wastePercent', label: 'Atık Oranı (%)', min: 0, max: 100, step: 1, default: 25 },
        { key: 'kFactor', label: 'K Faktörü', min: 0, max: 2, step: 0.01, default: 1 }
      ]
    };
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
    this.applySheetScale();
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

    // Grid ve Eksen görünürlüğü artık Scene3D tarafından yönetiliyor
    // (sahne parametreleri değiştiğinde otomatik güncellenir)

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

  // Kalın dimension çizgisi eklemek için helper (Line2 kullanır)
  addDimensionSegment(p1, p2, color, targetGroup = this.scene.dimensionGroup, alwaysOnTop = this.params.dimAlwaysOnTop) {
    const mat = this.materials.createDimensionLineMaterial(color, alwaysOnTop);
    this.materials.updateLineMaterialResolution(this.scene?.renderer, mat);

    const geom = new LineGeometry();
    geom.setPositions([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z]);

    const line = new Line2(geom, mat);
    if (line.computeLineDistances) line.computeLineDistances();
    line.renderOrder = alwaysOnTop ? 999 : 0;

    targetGroup.add(line);
    return line;
  }

  // Ortak ölçülendirme fonksiyonları
  createDimensionLine(p1, p2, offsetDir, label, color, paramKey = null) {
    const n = offsetDir.clone().normalize();
    const gap = BasePart.cm(this.params.extGapCm);
    const targetOff = this.params.dimFixedOffset
      ? BasePart.cm(this.params.dimPlaneOffsetCm)
      : (gap + BasePart.cm(this.params.extLenCm));

    const s1 = p1.clone().add(n.clone().multiplyScalar(gap));
    const e1 = p1.clone().add(n.clone().multiplyScalar(targetOff));
    const s2 = p2.clone().add(n.clone().multiplyScalar(gap));
    const e2 = p2.clone().add(n.clone().multiplyScalar(targetOff));

    const L1 = this.addDimensionSegment(s1, e1, color, this.scene.dimensionGroup, this.params.dimAlwaysOnTop);
    const L2 = this.addDimensionSegment(s2, e2, color, this.scene.dimensionGroup, this.params.dimAlwaysOnTop);

    const head = BasePart.cm(this.params.arrowHeadCm);
    const rad = BasePart.cm(this.params.arrowRadiusCm);
    const dir = new THREE.Vector3().subVectors(e2, e1).normalize();
    const off = BasePart.cm(this.params.dimOffsetCm);

    const a1 = e1.clone().add(dir.clone().multiplyScalar(off));
    const a2 = e2.clone().add(dir.clone().multiplyScalar(-off));
    this.createArrow(a1, a2, color, head, rad);

    const mid = a1.clone().add(a2).multiplyScalar(0.5)
      .add(n.clone().multiplyScalar(BasePart.cm(this.params.labelOffsetCm)));

    // ParamKey varsa, parametre tanımını bul ve popup data oluştur
    let paramData = null;
    if (paramKey) {
      const definitions = this.getParameterDefinitions();
      let allParams = [];

      // Eski yapı (dimensions, material, view)
      if (definitions.dimensions || definitions.material || definitions.view) {
        allParams = [
          ...(definitions.dimensions || []),
          ...(definitions.material || []),
          ...(definitions.view || [])
        ];
      }
      // Yeni yapı (groups)
      else if (definitions.groups) {
        definitions.groups.forEach(group => {
          if (group.params) {
            allParams.push(...group.params);
          }
        });
      }

      const paramDef = allParams.find(p => p.key === paramKey);
      if (paramDef) {
        paramData = paramDef;
      }
    }

    return this.scene.addLabel(label, mid, color, paramData);
  }

  createArrow(p1, p2, color, head, rad) {
    // Kalın çizgi gövdesi
    const line = this.addDimensionSegment(p1, p2, color, this.scene.dimensionGroup, this.params.dimAlwaysOnTop);

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

  // Helper to add local coordinate axes (tangent, normal, binormal)
  addLocalAxes(position, tangent, normal, binormal, labelPrefix, axisLengthCm = 10) {
    const axisLength = BasePart.cm(axisLengthCm);

    const p = position.clone();

    // Normal (Local X)
    const normalEnd = p.clone().add(normal.clone().multiplyScalar(axisLength));
    this.addDimensionSegment(p, normalEnd, '#ff0000');
    this.scene.addLabel(`${labelPrefix}_N`, normalEnd, '#ff0000');

    // Binormal (Local Y)
    const binormalEnd = p.clone().add(binormal.clone().multiplyScalar(axisLength));
    this.addDimensionSegment(p, binormalEnd, '#00ff00');
    this.scene.addLabel(`${labelPrefix}_B`, binormalEnd, '#00ff00');

    // Tangent (Local Z)
    const tangentEnd = p.clone().add(tangent.clone().multiplyScalar(axisLength));
    this.addDimensionSegment(p, tangentEnd, '#0000ff');
    this.scene.addLabel(`${labelPrefix}_T`, tangentEnd, '#0000ff');
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

  // Sheet thickness scale helpers
  getSheetScaleParamMeta() {
    const definitions = this.getParameterDefinitions() || {};
    const params = [];
    if (definitions.dimensions && Array.isArray(definitions.dimensions)) {
      params.push(...definitions.dimensions);
    }
    if (definitions.groups && Array.isArray(definitions.groups)) {
      definitions.groups.forEach(group => {
        if (group && Array.isArray(group.params)) {
          params.push(...group.params);
        }
      });
    }
    const meta = new Map();
    params.forEach(param => {
      if (param && param.key) {
        meta.set(param.key, param);
      }
    });
    return meta;
  }

  getSheetScaleMaxEdgeMm() {
    const dims = this.getDimensions ? this.getDimensions() : {};
    const meta = this.getSheetScaleParamMeta();
    let maxMm = 0;
    const isCmFallbackKey = (key) => {
      if (typeof key !== 'string') return false;
      return /^(W|H)\d*$/i.test(key);
    };
    Object.entries(dims).forEach(([key, raw]) => {
      if (key === 't') return;
      if (typeof key === 'string' && key.toUpperCase().startsWith('L')) return;
      const value = Number(raw);
      if (!Number.isFinite(value)) return;
      const def = meta.get(key);
      let isCm = false;
      if (def) {
        if (def.unit) {
          isCm = def.unit === 'cm';
        } else if (typeof def.label === 'string') {
          isCm = def.label.toLowerCase().includes('cm');
        }
      } else if (isCmFallbackKey(key)) {
        isCm = true;
      }
      if (!isCm) return;
      const mm = value * 10;
      if (mm > maxMm) maxMm = mm;
    });
    return maxMm;
  }

  getSheetScaleEntries() {
    return BasePart.getGalvanizedThicknessListMm().map((thicknessMm) => {
      const enabledKey = BasePart.getSheetScaleEnabledKey(thicknessMm);
      const maxKey = BasePart.getSheetScaleMaxKey(thicknessMm);
      return {
        thicknessMm,
        enabledKey,
        maxKey,
        enabled: !!this.params[enabledKey],
        maxMm: Number(this.params[maxKey])
      };
    });
  }

  normalizeSheetScaleParams() {
    const toNumber = (value, fallback) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : fallback;
    };
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const minEdge = 1;
    const maxEdge = 10000;
    const entries = this.getSheetScaleEntries();

    let prevLimit = 0;
    entries.forEach((entry) => {
      const defaultLimit = BasePart.getSheetScaleDefaultLimitMm(entry.thicknessMm);
      let limit = clamp(toNumber(this.params[entry.maxKey], defaultLimit), minEdge, maxEdge);
      const enabled = !!this.params[entry.enabledKey];

      if (enabled) {
        const minLimit = prevLimit + 1;
        if (limit < minLimit) limit = minLimit;
        prevLimit = limit;
      }

      this.params[entry.maxKey] = limit;
      this.params[entry.enabledKey] = enabled;
    });

    const defaultEdge = prevLimit > 0 ? prevLimit : minEdge;
    this.params.sheetScaleManualEdgeMm = clamp(
      toNumber(this.params.sheetScaleManualEdgeMm, defaultEdge),
      minEdge,
      maxEdge
    );
  }

  getSheetScaleThicknessForEdgeMm(edgeMm, entries = null) {
    const items = (entries || this.getSheetScaleEntries()).filter(entry => entry.enabled);
    if (!items.length) return null;
    if (!Number.isFinite(edgeMm)) return items[items.length - 1].thicknessMm;

    for (const entry of items) {
      if (Number.isFinite(entry.maxMm) && edgeMm <= entry.maxMm) return entry.thicknessMm;
    }
    return items[items.length - 1].thicknessMm;
  }

  getSheetScaleState() {
    const enabled = !!this.params.sheetScaleEnabled;
    const auto = true;
    const edgeMm = this.getSheetScaleMaxEdgeMm();

    const entries = this.getSheetScaleEntries();
    let prevLimit = 0;
    const entriesWithRanges = entries.map((entry) => {
      const minMm = entry.enabled ? prevLimit + 1 : null;
      const maxMm = entry.enabled ? entry.maxMm : null;
      if (entry.enabled && Number.isFinite(entry.maxMm)) {
        prevLimit = entry.maxMm;
      }
      return { ...entry, minMm, maxMm };
    });

    const thicknessMm = enabled
      ? this.getSheetScaleThicknessForEdgeMm(edgeMm, entriesWithRanges)
      : null;

    return {
      enabled,
      auto,
      edgeMm,
      thicknessMm,
      entries: entriesWithRanges
    };
  }

  applySheetScale() {
    if (!this.params.sheetScaleEnabled) return;

    this.normalizeSheetScaleParams();
    const state = this.getSheetScaleState();
    if (Number.isFinite(state.thicknessMm)) {
      const thicknessCm = state.thicknessMm / 10;
      if (Number.isFinite(thicknessCm)) {
        this.params.t = thicknessCm;
      }
    }
    if (state.auto && Number.isFinite(state.edgeMm)) {
      this.params.sheetScaleManualEdgeMm = state.edgeMm;
    }
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

  static getSheetScaleKey(value) {
    return value.toString().replace('.', '_');
  }

  static getSheetScaleEnabledKey(value) {
    return `sheetScaleT${BasePart.getSheetScaleKey(value)}Enabled`;
  }

  static getSheetScaleMaxKey(value) {
    return `sheetScaleT${BasePart.getSheetScaleKey(value)}MaxMm`;
  }

  static getSheetScaleDefaultLimitMm(value) {
    const key = Number(value).toFixed(1);
    const defaults = {
      '0.6': 600,
      '0.8': 1249,
      '1.0': 2490,
      '1.2': 5000
    };
    if (Object.prototype.hasOwnProperty.call(defaults, key)) {
      return defaults[key];
    }
    return Math.round(value * 1000);
  }

  static getGalvanizedThicknessListMm() {
    return [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.5, 2.0];
  }

  static getGalvanizedThicknessListCm() {
    return BasePart.getGalvanizedThicknessListMm().map(value => value / 10);
  }

  static snapToClosest(value, list) {
    if (!Array.isArray(list) || list.length === 0) return value;
    let closest = list[0];
    let minDiff = Math.abs(value - closest);
    for (let i = 1; i < list.length; i++) {
      const diff = Math.abs(value - list[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closest = list[i];
      }
    }
    return closest;
  }

  // Format dimension for labels, trim trailing zeros.
  static formatDimension(value) {
    if (!Number.isFinite(value)) return '';
    const rounded = Math.round(value * 100) / 100;
    const text = rounded.toFixed(2)
      .replace(/\.0+$/, '')
      .replace(/(\.\d*[1-9])0+$/, '$1');
    return text === '-0' ? '0' : text;
  }
}
