// Reduksiyon - Taper prizma redüksiyon parçası
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class Reduksiyon extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.name = 'Reduksiyon';
  }

  initDefaultParams() {
    super.initDefaultParams();

    // Redüksiyon'a özel parametreler
    this.defaultParams = {
      ...this.defaultParams,

      // Boyutlar (cm)
      W1: 100,        // Bitiş genişlik
      H1: 80,         // Bitiş yükseklik
      W2: 60,         // Başlangıç genişlik
      H2: 40,         // Başlangıç yükseklik
      L: 120,         // Uzunluk
      t: 0.12,        // Sac kalınlığı

      // Geometri
      steps: 120,     // Yol segmenti
      edgeSegs: 6,    // Kesit kenar segmenti

      // Ofset modları
      modeW: 'central',       // 'flatLeft', 'central', 'flatRight', 'value'
      modeH: 'central',       // 'flatBottom', 'central', 'flatTop', 'value'
      offWcm: 0,              // Manuel ofset genişlik (cm)
      offHcm: 0,              // Manuel ofset yükseklik (cm)

      // Görünüm
      showSideLabels: true,

      // Renkler
      colorW1: '#007bff',
      colorH1: '#ffd400',
      colorW2: '#00c853',
      colorH2: '#ff8c00',
      colorL: '#00bcd4'
    };

    this.params = { ...this.defaultParams };
  }

  getParameterDefinitions() {
    return {
      groups: [
        {
          name: 'Ölçüler',
          params: [
            { key: 'W1', label: 'W1 (bitiş) cm', type: 'number', min: 1, max: 400, step: 0.1 },
            { key: 'H1', label: 'H1 (bitiş) cm', type: 'number', min: 1, max: 400, step: 0.1 },
            { key: 'W2', label: 'W2 (başlangıç) cm', type: 'number', min: 1, max: 400, step: 0.1 },
            { key: 'H2', label: 'H2 (başlangıç) cm', type: 'number', min: 1, max: 400, step: 0.1 },
            { key: 'L', label: 'L (uzunluk) cm', type: 'number', min: 1, max: 1000, step: 0.1 },
            { key: 't', label: 'Sac Kalınlığı t', type: 'number', min: 0.02, max: 1, step: 0.01 }
          ]
        },
        {
          name: 'Geometri',
          params: [
            { key: 'steps', label: 'Yol Segmenti (steps)', type: 'number', min: 8, max: 400, step: 1 },
            { key: 'edgeSegs', label: 'Kesit Kenar Segmenti', type: 'number', min: 2, max: 16, step: 1 }
          ]
        },
        {
          name: 'Ofset',
          params: [
            {
              key: 'modeW',
              label: 'Ofset-Genişlik',
              type: 'select',
              options: [
                { value: 'flatLeft', label: 'Sol Düz' },
                { value: 'central', label: 'Merkezi' },
                { value: 'flatRight', label: 'Sağ Düz' },
                { value: 'value', label: 'Değer' }
              ]
            },
            { key: 'offWcm', label: 'Ofset-Genişlik (cm)', type: 'number', min: -200, max: 200, step: 0.1 },
            {
              key: 'modeH',
              label: 'Ofset-Yükseklik',
              type: 'select',
              options: [
                { value: 'flatBottom', label: 'Alt Düz' },
                { value: 'central', label: 'Merkezi' },
                { value: 'flatTop', label: 'Üst Düz' },
                { value: 'value', label: 'Değer' }
              ]
            },
            { key: 'offHcm', label: 'Ofset-Yükseklik (cm)', type: 'number', min: -200, max: 200, step: 0.1 }
          ]
        },
        {
          name: 'Görünüm',
          params: [
            { key: 'showEdges', label: 'Kenar Çizgileri', type: 'checkbox' },
            { key: 'showDims', label: 'Ölçülendirme', type: 'checkbox' },
            { key: 'showFlange', label: 'Flanşları Göster', type: 'checkbox' },
            { key: 'showSideLabels', label: 'Yüz Etiketleri', type: 'checkbox' }
          ]
        },
        {
          name: 'Renkler',
          params: [
            { key: 'colorW1', label: 'W1 Rengi', type: 'color' },
            { key: 'colorH1', label: 'H1 Rengi', type: 'color' },
            { key: 'colorW2', label: 'W2 Rengi', type: 'color' },
            { key: 'colorH2', label: 'H2 Rengi', type: 'color' },
            { key: 'colorL', label: 'L Rengi', type: 'color' }
          ]
        }
      ]
    };
  }

  // Linear interpolasyon
  lerp(a, b, u) {
    return a + (b - a) * u;
  }

  // Dikdörtgen kesit noktaları oluşturma
  createRectPoints(center, hw, hh) {
    const per = Math.max(2, Math.floor(this.params.edgeSegs));
    const n = new THREE.Vector3(1, 0, 0);
    const b = new THREE.Vector3(0, 1, 0);
    const points = [];

    // Alt kenar (soldan sağa)
    for (let s = 0; s < per; s++) {
      const t = s / (per - 1);
      points.push(
        center.clone()
          .add(n.clone().multiplyScalar(-hw + 2 * hw * t))
          .add(b.clone().multiplyScalar(-hh))
      );
    }

    // Sağ kenar (alttan üste)
    for (let s = 0; s < per; s++) {
      const t = s / (per - 1);
      points.push(
        center.clone()
          .add(n.clone().multiplyScalar(hw))
          .add(b.clone().multiplyScalar(-hh + 2 * hh * t))
      );
    }

    // Üst kenar (sağdan sola)
    for (let s = 0; s < per; s++) {
      const t = s / (per - 1);
      points.push(
        center.clone()
          .add(n.clone().multiplyScalar(hw - 2 * hw * t))
          .add(b.clone().multiplyScalar(hh))
      );
    }

    // Sol kenar (üstten alta)
    for (let s = 0; s < per; s++) {
      const t = s / (per - 1);
      points.push(
        center.clone()
          .add(n.clone().multiplyScalar(-hw))
          .add(b.clone().multiplyScalar(hh - 2 * hh * t))
      );
    }

    return points;
  }

  // Rotated groups setup (Y ekseninde 90 derece)
  setupRotatedGroups() {
    // Önceki grupları temizle
    if (this.rotatedGeometryGroup) {
      this.scene.geometryGroup.remove(this.rotatedGeometryGroup);
    }
    if (this.rotatedFlangeGroup) {
      this.scene.flangeGroup.remove(this.rotatedFlangeGroup);
    }
    if (this.rotatedDimensionGroup) {
      this.scene.dimensionGroup.remove(this.rotatedDimensionGroup);
    }

    // Yeni gruplar oluştur ve Y ekseninde 90 derece döndür
    this.rotatedGeometryGroup = new THREE.Group();
    this.rotatedGeometryGroup.rotation.y = Math.PI / 2;
    this.scene.geometryGroup.add(this.rotatedGeometryGroup);

    this.rotatedFlangeGroup = new THREE.Group();
    this.rotatedFlangeGroup.rotation.y = Math.PI / 2;
    this.scene.flangeGroup.add(this.rotatedFlangeGroup);

    this.rotatedDimensionGroup = new THREE.Group();
    this.rotatedDimensionGroup.rotation.y = Math.PI / 2;
    this.scene.dimensionGroup.add(this.rotatedDimensionGroup);
  }

  // Ofset hesaplama fonksiyonları
  calculateCX(u, W) {
    const W2 = BasePart.cm(this.params.W2);
    const left0W = -W2 / 2;
    const right0W = W2 / 2;
    const offWx = BasePart.cm(this.params.offWcm);

    switch (this.params.modeW) {
      case 'flatLeft': return left0W + W / 2;
      case 'flatRight': return right0W - W / 2;
      case 'value': return offWx * u;
      default: return 0; // central
    }
  }

  calculateCY(u, H) {
    const H2 = BasePart.cm(this.params.H2);
    const bot0H = -H2 / 2;
    const top0H = H2 / 2;
    const offHy = BasePart.cm(this.params.offHcm);

    switch (this.params.modeH) {
      case 'flatBottom': return bot0H + H / 2;
      case 'flatTop': return top0H - H / 2;
      case 'value': return offHy * u;
      default: return 0; // central
    }
  }

  buildGeometry() {
    // Rotated group'ları hazırla
    this.setupRotatedGroups();
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const W2 = BasePart.cm(this.params.W2);
    const H2 = BasePart.cm(this.params.H2);
    const L = BasePart.cm(this.params.L);
    const t = BasePart.cm(this.params.t);

    const per = Math.max(2, Math.floor(this.params.edgeSegs));
    const N = per * 4; // Her kesitte toplam nokta sayısı

    const vs = [];
    const idx = [];
    const Rout = [];
    const Rin = [];

    // Halkaları oluştur (merkezde)
    for (let i = 0; i <= this.params.steps; i++) {
      const u = i / this.params.steps;
      const W = this.lerp(W2, W1, u);
      const H = this.lerp(H2, H1, u);

      const center = new THREE.Vector3(
        this.calculateCX(u, W),
        this.calculateCY(u, H),
        (u - 0.5) * L  // Merkezi 0'a kaydır
      );

      const Wi = Math.max(W - 2 * t, 1e-5);
      const Hi = Math.max(H - 2 * t, 1e-5);

      Rout.push(this.createRectPoints(center, W / 2, H / 2));
      Rin.push(this.createRectPoints(center, Wi / 2, Hi / 2));
    }

    // Vertex pozisyonlarını ekle
    const push = r => {
      for (const v of r) {
        vs.push(v.x, v.y, v.z);
      }
    };

    for (let i = 0; i <= this.params.steps; i++) push(Rout[i]);
    const innerBase = vs.length / 3;
    for (let i = 0; i <= this.params.steps; i++) push(Rin[i]);

    // Index'leri oluştur
    const quad = (a, b, c, d) => {
      idx.push(a, b, c, a, c, d);
    };

    // Dış yüzey
    for (let i = 0; i < this.params.steps; i++) {
      const b0 = i * N;
      const b1 = (i + 1) * N;

      for (let k = 0; k < N; k++) {
        const a = b0 + k;
        const bI = b0 + (k + 1) % N;
        const c = b1 + (k + 1) % N;
        const d = b1 + k;
        quad(a, bI, c, d);
      }
    }

    // İç yüzey
    for (let i = 0; i < this.params.steps; i++) {
      const b0 = innerBase + i * N;
      const b1 = innerBase + (i + 1) * N;

      for (let k = 0; k < N; k++) {
        const a = b0 + k;
        const bI = b0 + (k + 1) % N;
        const c = b1 + (k + 1) % N;
        const d = b1 + k;
        quad(d, c, bI, a);
      }
    }

    // Geometriyi oluştur
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3));
    geometry.setIndex(idx);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.materials.get('metal'));
    this.rotatedGeometryGroup.add(mesh); // Rotated group'a ekle

    // Alan hesabı için yüzey noktalarını sakla
    this.Rout = Rout;
    this.Rin = Rin;
  }

  buildFlange() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const W2 = BasePart.cm(this.params.W2);
    const H2 = BasePart.cm(this.params.H2);
    const L = BasePart.cm(this.params.L);
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);

    const n = new THREE.Vector3(1, 0, 0);
    const b = new THREE.Vector3(0, 1, 0);
    const tz = new THREE.Vector3(0, 0, 1);

    const p0 = new THREE.Vector3(
      this.calculateCX(0, W2),
      this.calculateCY(0, H2),
      -L / 2  // Merkezde
    );

    const p1 = new THREE.Vector3(
      this.calculateCX(1, W1),
      this.calculateCY(1, H1),
      L / 2  // Merkezde
    );

    // Flanşları oluştur
    const F0 = this.createFlangeRect(W2, H2, lip, fth);
    const F1 = this.createFlangeRect(W1, H1, lip, fth);

    // Pozisyonlandırma helper
    const place = (obj, pos, tangent, normal, binormal) => {
      const M = new THREE.Matrix4().makeBasis(
        normal.clone(),
        binormal.clone(),
        tangent.clone()
      );
      const Q = new THREE.Quaternion().setFromRotationMatrix(M);
      obj.position.copy(pos);
      obj.quaternion.copy(Q);
    };

    place(F0, p0.clone().add(tz.clone().multiplyScalar(-fth * 0.5)), tz, n, b);
    place(F1, p1.clone().add(tz.clone().multiplyScalar(fth * 0.5)), tz, n, b);

    this.rotatedFlangeGroup.add(F0, F1); // Rotated group'a ekle
  }

  // Override createDimensionLine to use rotatedDimensionGroup
  createDimensionLine(p1, p2, offsetDir, label, color, paramKey) {
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

    // rotatedDimensionGroup'a ekle
    this.rotatedDimensionGroup.add(L1, L2);

    const head = BasePart.cm(this.params.arrowHeadCm);
    const rad = BasePart.cm(this.params.arrowRadiusCm);
    const dir = new THREE.Vector3().subVectors(e2, e1).normalize();
    const off = BasePart.cm(this.params.dimOffsetCm);

    const a1 = e1.clone().add(dir.clone().multiplyScalar(off));
    const a2 = e2.clone().add(dir.clone().multiplyScalar(-off));
    this.createArrowForDimension(a1, a2, color, head, rad);

    // Label pozisyonunu rotated space'den world space'e transform et
    // Y ekseninde 90° dönüş: (x, y, z) -> (z, y, -x)
    const midRotated = a1.clone().add(a2).multiplyScalar(0.5).add(n.clone().multiplyScalar(BasePart.cm(this.params.labelOffsetCm)));
    const midWorld = new THREE.Vector3(midRotated.z, midRotated.y, -midRotated.x);

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

    return this.scene.addLabel(label, midWorld, color, paramData);
  }

  createArrowForDimension(p1, p2, color, head, rad) {
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

    this.rotatedDimensionGroup.add(line, makeCone(q2, p2), makeCone(q1, p1));
  }

  drawDimensions() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const W2 = BasePart.cm(this.params.W2);
    const H2 = BasePart.cm(this.params.H2);
    const L = BasePart.cm(this.params.L);

    const n = new THREE.Vector3(1, 0, 0);
    const b = new THREE.Vector3(0, 1, 0);

    const p0 = new THREE.Vector3(
      this.calculateCX(0, W2),
      this.calculateCY(0, H2),
      -L / 2  // Merkezde
    );

    const p1 = new THREE.Vector3(
      this.calculateCX(1, W1),
      this.calculateCY(1, H1),
      L / 2  // Merkezde
    );

    // Başlangıç (W2, H2) ölçüleri
    const x0L = n.clone().multiplyScalar(-W2 / 2);
    const x0R = n.clone().multiplyScalar(W2 / 2);
    const y0T = b.clone().multiplyScalar(H2 / 2);
    const y0B = b.clone().multiplyScalar(-H2 / 2);

    this.createDimensionLine(
      p0.clone().add(x0L).add(y0T),
      p0.clone().add(x0R).add(y0T),
      b,
      `W2 = ${this.params.W2.toFixed(1)} cm`,
      this.params.colorW2,
      'W2'
    );

    this.createDimensionLine(
      p0.clone().add(x0R).add(y0B),
      p0.clone().add(x0R).add(y0T),
      n,
      `H2 = ${this.params.H2.toFixed(1)} cm`,
      this.params.colorH2,
      'H2'
    );

    // Bitiş (W1, H1) ölçüleri
    const x1L = n.clone().multiplyScalar(-W1 / 2);
    const x1R = n.clone().multiplyScalar(W1 / 2);
    const y1T = b.clone().multiplyScalar(H1 / 2);
    const y1B = b.clone().multiplyScalar(-H1 / 2);

    this.createDimensionLine(
      p1.clone().add(x1L).add(y1T),
      p1.clone().add(x1R).add(y1T),
      b,
      `W1 = ${this.params.W1.toFixed(1)} cm`,
      this.params.colorW1,
      'W1'
    );

    this.createDimensionLine(
      p1.clone().add(x1R).add(y1B),
      p1.clone().add(x1R).add(y1T),
      n,
      `H1 = ${this.params.H1.toFixed(1)} cm`,
      this.params.colorH1,
      'H1'
    );

    // L ölçüsü
    const left0 = p0.x - W2 / 2;
    const left1 = p1.x - W1 / 2;
    const bottom0 = p0.y - H2 / 2;
    const bottom1 = p1.y - H1 / 2;
    const xr = Math.max(left0, left1);
    const yr = Math.max(bottom0, bottom1);

    this.createDimensionLine(
      new THREE.Vector3(xr, yr, -L / 2),
      new THREE.Vector3(xr, yr, L / 2),
      n.clone().negate(),
      `L = ${this.params.L.toFixed(1)} cm`,
      this.params.colorL,
      'L'
    );

    // Yüz etiketleri - yüzeye yapışık 3D mesh etiketler
    if (this.params.showSideLabels) {
      const mid = new THREE.Vector3(0, 0, 0);
      const widthCm = 30; // Etiket genişliği (cm cinsinden)

      // Ortalama boyutları kullan
      const Wavg = (W1 + W2) / 2;
      const Havg = (H1 + H2) / 2;

      const faceLabels = [
        { text: 'SAĞ', base: mid.clone().add(n.clone().multiplyScalar(Wavg/2)), normal: n.clone() },
        { text: 'SOL', base: mid.clone().add(n.clone().multiplyScalar(-Wavg/2)), normal: n.clone().negate() },
        { text: 'ÜST', base: mid.clone().add(b.clone().multiplyScalar(Havg/2)), normal: b.clone() },
        { text: 'ALT', base: mid.clone().add(b.clone().multiplyScalar(-Havg/2)), normal: b.clone().negate() }
      ];

      faceLabels.forEach(label => {
        this.addFaceTag(label.text, label.base, label.normal, widthCm, '#ff6');
      });
    }
  }

  // Canvas kullanarak 3D metin düzlemi oluştur (yüzeye yapışık etiket için)
  makeTextPlane(text, widthCm, color = '#ff6') {
    const pad = 20;
    const font = 64;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Metin boyutunu ölç
    ctx.font = `700 ${font}px system-ui`;
    const textWidth = ctx.measureText(text).width;
    const textHeight = font * 1.4;

    canvas.width = Math.ceil(textWidth) + pad * 2;
    canvas.height = Math.ceil(textHeight) + pad * 2;

    // Yeniden font ayarla (canvas boyutu değişti)
    ctx.font = `700 ${font}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Yuvarlatılmış arka plan
    const r = 16;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = 'rgba(18, 24, 34, 0.9)';
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    // Kenarlık
    ctx.strokeStyle = 'rgba(57, 65, 79, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Metin
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2);

    // Texture oluştur
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;

    // Plane geometrisi
    const aspect = w / h;
    const W = BasePart.cm(widthCm);
    const H = W / aspect;

    const geometry = new THREE.PlaneGeometry(W, H);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: true
    });

    return new THREE.Mesh(geometry, material);
  }

  // Yüz etiketini yüzeye yapışık olarak ekle
  addFaceTag(text, base, normal, widthCm, color) {
    const mesh = this.makeTextPlane(text, widthCm, color);

    // Epsilon - yüzeyden mesafe (tamamen dışarıda olması için büyük değer)
    const eps = 0.20;

    // Pozisyon: rotated space'de base + normal * eps
    const posRotated = base.clone().add(normal.clone().normalize().multiplyScalar(eps));
    mesh.position.copy(posRotated);

    // Quaternion: mesh'i normal yönüne döndür (z ekseni normal'e baksın)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal.clone().normalize()
    );
    mesh.quaternion.copy(quaternion);

    // Rotated dimension group'a ekle
    this.rotatedDimensionGroup.add(mesh);

    return mesh;
  }

  // Eğimli yüz etiketi ekle - center, başlangıç ve bitiş noktalarına göre
  addSlopedFaceTag(text, center, p0, p1, widthCm, color) {
    const mesh = this.makeTextPlane(text, widthCm, color);

    // Merkez nokta - etiket pozisyonu (parametre olarak geldi)
    const mid = center.clone();

    // Z ekseni (uzunluk ekseni)
    const tz = new THREE.Vector3(0, 0, 1);

    // Yüzey üzerinde iki vektör oluştur
    const v1 = new THREE.Vector3().subVectors(p1, p0); // Başlangıçtan bitişe
    const v2 = tz.clone(); // Z ekseni boyunca

    // Yüzey normali - iki vektörün cross product'u
    const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();

    // Yüzey teğeti (Z ekseni boyunca)
    const tangentZ = tz.clone();

    // Yüzey teğeti (eğim yönünde)
    const tangentSlope = v1.clone().normalize();

    // Koordinat sistemi oluştur: normal (dışarı), tangentZ (yukarı), tangentSlope (sağa)
    const matrix = new THREE.Matrix4();
    matrix.makeBasis(
      new THREE.Vector3().crossVectors(tangentZ, normal).normalize(), // right (x)
      tangentZ.clone(), // up (y)
      normal.clone()    // forward (z)
    );

    mesh.quaternion.setFromRotationMatrix(matrix);

    // 90 derece daha döndür (Z ekseni etrafında)
    const additionalRotation = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      Math.PI / 2
    );
    mesh.quaternion.premultiply(additionalRotation);

    // Etiket yüksekliğini hesapla (mesh döndürüldükten sonra)
    const W = BasePart.cm(widthCm);
    const aspect = mesh.geometry.parameters.width / mesh.geometry.parameters.height;
    const H = W / aspect;

    // Eğim açısını hesapla - v1'in XY düzlemi ile açısı
    const v1XY = new THREE.Vector2(v1.x, v1.y).length();
    const v1Z = Math.abs(v1.z);
    const slopeAngle = Math.atan2(v1XY, v1Z);

    // Normal offset - etiketi tamamen dışarıda tut
    // Eğimli yüzeylerde etiketin yüksekliğinin tamamını kullan
    const baseOffset = H * 0.7; // Etiket yüksekliğinin çoğu
    const slopeExtra = H * Math.sin(slopeAngle) * 1.2; // Eğime göre ekstra
    const normalOffset = baseOffset + slopeExtra;

    // Pozisyonu ayarla - normal yönünde offset ekle
    mesh.position.copy(mid.clone().add(normal.clone().multiplyScalar(normalOffset)));

    // Rotated dimension group'a ekle
    this.rotatedDimensionGroup.add(mesh);

    return mesh;
  }

  calculateArea() {
    let Aout = 0;
    let Ain = 0;

    if (this.Rout && this.Rout.length > 0) {
      const per = Math.max(2, Math.floor(this.params.edgeSegs));
      const N = per * 4;

      // Dış yüzey alanı
      for (let i = 0; i < this.params.steps; i++) {
        const r0 = this.Rout[i];
        const r1 = this.Rout[i + 1];

        for (let k = 0; k < N; k++) {
          const v00 = r0[k];
          const v01 = r0[(k + 1) % N];
          const v11 = r1[(k + 1) % N];
          const v10 = r1[k];

          Aout += this.triangleArea(v00, v01, v11);
          Aout += this.triangleArea(v00, v11, v10);
        }
      }

      // İç yüzey alanı
      for (let i = 0; i < this.params.steps; i++) {
        const r0 = this.Rin[i];
        const r1 = this.Rin[i + 1];

        for (let k = 0; k < N; k++) {
          const v00 = r0[k];
          const v01 = r0[(k + 1) % N];
          const v11 = r1[(k + 1) % N];
          const v10 = r1[k];

          Ain += this.triangleArea(v00, v01, v11);
          Ain += this.triangleArea(v00, v11, v10);
        }
      }
    }

    // Sac alanı ortalama
    let sheet = 0.5 * (Aout + Ain);

    // Flanş alanı ekle (eğer istenirse)
    if (this.params.areaIncludeFlange) {
      this.scene.flangeGroup.children.forEach(mesh => {
        if (mesh.geometry) {
          const g = mesh.geometry;
          const p = g.attributes.position.array;
          const I = g.index ? g.index.array : null;

          let A = 0;
          const a = new THREE.Vector3();
          const b = new THREE.Vector3();
          const c = new THREE.Vector3();

          const read = (i, o) => o.set(p[3 * i], p[3 * i + 1], p[3 * i + 2]);

          if (I) {
            for (let i = 0; i < I.length; i += 3) {
              read(I[i], a);
              read(I[i + 1], b);
              read(I[i + 2], c);
              A += this.triangleArea(a, b, c);
            }
          } else {
            for (let i = 0; i < p.length; i += 9) {
              a.set(p[i], p[i + 1], p[i + 2]);
              b.set(p[i + 3], p[i + 4], p[i + 5]);
              c.set(p[i + 6], p[i + 7], p[i + 8]);
              A += this.triangleArea(a, b, c);
            }
          }

          sheet += A;
        }
      });
    }

    return {
      outer: sheet,
      inner: 0
    };
  }

  addEdges() {
    // Yamuk geçiş formunda 4 kenar çizgisini ekle
    if (!this.Rout || this.Rout.length === 0) return;

    const segments = [];
    const per = Math.max(2, Math.floor(this.params.edgeSegs));

    // İlk halka (başlangıç ağzı)
    const firstRing = this.Rout[0];
    for (let k = 0; k < firstRing.length; k++) {
      segments.push(firstRing[k], firstRing[(k + 1) % firstRing.length]);
    }

    // Son halka (bitiş ağzı)
    const lastRing = this.Rout[this.Rout.length - 1];
    for (let k = 0; k < lastRing.length; k++) {
      segments.push(lastRing[k], lastRing[(k + 1) % lastRing.length]);
    }

    // 4 köşe çizgisi - uzunlamasına yamuk kenarları
    // Her kenarın ortasındaki noktayı al (per segmenti olan her kenar için)
    const corners = [0, per, per * 2, per * 3]; // 4 köşenin indeksleri

    for (const cornerIdx of corners) {
      for (let i = 0; i < this.Rout.length - 1; i++) {
        segments.push(this.Rout[i][cornerIdx], this.Rout[i + 1][cornerIdx]);
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(segments);
    const lines = new THREE.LineSegments(geometry, this.materials.get('edge'));
    this.rotatedGeometryGroup.add(lines);
  }

  getDimensions() {
    return {
      W1: this.params.W1,
      H1: this.params.H1,
      W2: this.params.W2,
      H2: this.params.H2,
      L: this.params.L,
      t: this.params.t
    };
  }
}
