// KaredenYuvarlaga - Kareden yuvarlağa geçiş parçası
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class KaredenYuvarlaga extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.name = 'KaredenYuvarlaga';
  }

  initDefaultParams() {
    super.initDefaultParams();

    // Kareden Yuvarlağa'ya özel parametreler
    this.defaultParams = {
      ...this.defaultParams,

      // Boyutlar (cm)
      W1: 100,        // Kare genişlik
      H1: 80,         // Kare yükseklik
      Phi: 60,        // Daire çapı
      L: 120,         // Uzunluk
      t: 0.12,        // Sac kalınlığı

      // Geometri
      steps: 120,     // Yol segmenti
      edgeSegs: 12,   // Halka noktası (N)

      // Ofset modları
      modeW: 'flatRight',  // 'flatLeft', 'central', 'flatRight', 'value'
      modeH: 'central',    // 'flatBottom', 'central', 'flatTop', 'value'
      offWcm: 0,           // Manuel ofset genişlik (cm)
      offHcm: 0,           // Manuel ofset yükseklik (cm)

      // Görünüm
      showSideLabels: true,

      // Renkler
      colorW1: '#007bff',
      colorH1: '#ffd400',
      colorPhi: '#00c853',
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
            { key: 'W1', label: 'W1 (kare) cm', type: 'number', min: 1, max: 400, step: 0.1 },
            { key: 'H1', label: 'H1 (kare) cm', type: 'number', min: 1, max: 400, step: 0.1 },
            { key: 'Phi', label: 'Ø (daire) cm', type: 'number', min: 1, max: 400, step: 0.1 },
            { key: 'L', label: 'L (uzunluk) cm', type: 'number', min: 1, max: 1000, step: 0.1 },
            { key: 't', label: 'Sac Kalınlığı t', type: 'number', min: 0.02, max: 1, step: 0.01 }
          ]
        },
        {
          name: 'Geometri',
          params: [
            { key: 'steps', label: 'Yol Segmenti (steps)', type: 'number', min: 8, max: 400, step: 1 },
            { key: 'edgeSegs', label: 'Halka Noktası (N)', type: 'number', min: 8, max: 96, step: 1 }
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
            { key: 'colorPhi', label: 'Ø Rengi', type: 'color' },
            { key: 'colorL', label: 'L Rengi', type: 'color' }
          ]
        }
      ]
    };
  }

  // Eşit aralıklı dikdörtgen noktaları
  rectEven(N, hx, hy) {
    const Pm = 4 * (hx + hy);
    const pts = [];

    for (let k = 0; k < N; k++) {
      let s = Pm * k / N;

      if (s < 2 * hx) {
        pts.push(new THREE.Vector3(-hx + s, -hy, 0));
      } else if ((s -= 2 * hx) < 2 * hy) {
        pts.push(new THREE.Vector3(hx, -hy + s, 0));
      } else if ((s -= 2 * hy) < 2 * hx) {
        pts.push(new THREE.Vector3(hx - s, hy, 0));
      } else {
        s -= 2 * hx;
        pts.push(new THREE.Vector3(-hx, hy - s, 0));
      }
    }

    return pts;
  }

  // Eşit aralıklı çember noktaları
  circleEven(N, r) {
    const pts = [];

    for (let k = 0; k < N; k++) {
      const th = -3 * Math.PI / 4 + 2 * Math.PI * k / N;
      pts.push(new THREE.Vector3(r * Math.cos(th), r * Math.sin(th), 0));
    }

    return pts;
  }

  buildGeometry() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const D = BasePart.cm(this.params.Phi);
    const L = BasePart.cm(this.params.L);
    const t = BasePart.cm(this.params.t);

    const N = Math.max(4, Math.floor(this.params.edgeSegs)); // Noktalar halka başına

    // Baş ve son kesit noktaları (outer/inner)
    const rectO = this.rectEven(N, W1 / 2, H1 / 2);
    const rectI = this.rectEven(N, Math.max(W1 / 2 - t, 1e-5), Math.max(H1 / 2 - t, 1e-5));
    const circO = this.circleEven(N, D / 2);
    const circI = this.circleEven(N, Math.max(D / 2 - t, 1e-5));

    // Merkez ofset fonksiyonları
    const Wu = u => W1 * (1 - u) + D * u;
    const Hu = u => H1 * (1 - u) + D * u;

    const left0 = -W1 / 2;
    const right0 = W1 / 2;
    const bottom0 = -H1 / 2;
    const top0 = H1 / 2;

    const offWx = BasePart.cm(this.params.offWcm);
    const offHy = BasePart.cm(this.params.offHcm);

    const cx = (u) => {
      switch (this.params.modeW) {
        case 'flatLeft': return left0 + Wu(u) / 2;
        case 'flatRight': return right0 - Wu(u) / 2;
        case 'value': return offWx * u;
        default: return 0; // central
      }
    };

    const cy = (u) => {
      switch (this.params.modeH) {
        case 'flatBottom': return bottom0 + Hu(u) / 2;
        case 'flatTop': return top0 - Hu(u) / 2;
        case 'value': return offHy * u;
        default: return 0; // central
      }
    };

    // Halka örme
    const vs = [];
    const idx = [];
    const Rout = [];
    const Rin = [];

    for (let i = 0; i <= this.params.steps; i++) {
      const u = i / this.params.steps;
      const O = [];
      const I = [];

      for (let k = 0; k < N; k++) {
        const po = rectO[k].clone().multiplyScalar(1 - u).add(circO[k].clone().multiplyScalar(u));
        const pi = rectI[k].clone().multiplyScalar(1 - u).add(circI[k].clone().multiplyScalar(u));

        po.x += cx(u);
        po.y += cy(u);
        po.z = (u - 0.5) * L; // Merkezi 0'a kaydır

        pi.x += cx(u);
        pi.y += cy(u);
        pi.z = (u - 0.5) * L; // Merkezi 0'a kaydır

        O.push(po);
        I.push(pi);
      }

      Rout.push(O);
      Rin.push(I);
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
    this.scene.geometryGroup.add(mesh);

    // Alan hesabı için dış yüzey noktalarını sakla
    this.Rout = Rout;
  }

  buildFlange() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const D = BasePart.cm(this.params.Phi);
    const L = BasePart.cm(this.params.L);
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);

    const n = new THREE.Vector3(1, 0, 0);
    const b = new THREE.Vector3(0, 1, 0);
    const tz = new THREE.Vector3(0, 0, 1);

    // Ofset fonksiyonlarını hesapla
    const cx0 = this.calculateCX(0);
    const cy0 = this.calculateCY(0);
    const cx1 = this.calculateCX(1);
    const cy1 = this.calculateCY(1);

    const p0 = new THREE.Vector3(cx0, cy0, -L / 2);
    const p1 = new THREE.Vector3(cx1, cy1, L / 2);

    // Dikdörtgen flanş (kare taraf)
    const F0 = this.createFlangeRect(W1, H1, lip, fth);

    // Yuvarlak flanş (daire taraf)
    const F1 = this.createFlangeRound(D, lip, fth);

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

    this.scene.flangeGroup.add(F0, F1);
  }

  // Yuvarlak flanş oluştur
  createFlangeRound(D, lip, th) {
    const Rr = D / 2;

    const shape = new THREE.Shape();
    shape.absarc(0, 0, Rr + lip, 0, Math.PI * 2, false);

    const hole = new THREE.Path();
    hole.absarc(0, 0, Rr, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geometry = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: false });
    geometry.center();

    const mesh = new THREE.Mesh(geometry, this.materials.get('flange'));
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), this.materials.get('edge')));

    return mesh;
  }

  // Ofset hesaplama helper'ları
  calculateCX(u) {
    const W1 = BasePart.cm(this.params.W1);
    const D = BasePart.cm(this.params.Phi);
    const Wu = u => W1 * (1 - u) + D * u;

    const left0 = -W1 / 2;
    const right0 = W1 / 2;
    const offWx = BasePart.cm(this.params.offWcm);

    switch (this.params.modeW) {
      case 'flatLeft': return left0 + Wu(u) / 2;
      case 'flatRight': return right0 - Wu(u) / 2;
      case 'value': return offWx * u;
      default: return 0; // central
    }
  }

  calculateCY(u) {
    const H1 = BasePart.cm(this.params.H1);
    const D = BasePart.cm(this.params.Phi);
    const Hu = u => H1 * (1 - u) + D * u;

    const bottom0 = -H1 / 2;
    const top0 = H1 / 2;
    const offHy = BasePart.cm(this.params.offHcm);

    switch (this.params.modeH) {
      case 'flatBottom': return bottom0 + Hu(u) / 2;
      case 'flatTop': return top0 - Hu(u) / 2;
      case 'value': return offHy * u;
      default: return 0; // central
    }
  }

  drawDimensions() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const D = BasePart.cm(this.params.Phi);
    const L = BasePart.cm(this.params.L);

    const n = new THREE.Vector3(1, 0, 0);
    const b = new THREE.Vector3(0, 1, 0);

    const cx0 = this.calculateCX(0);
    const cy0 = this.calculateCY(0);
    const cx1 = this.calculateCX(1);
    const cy1 = this.calculateCY(1);

    const p0 = new THREE.Vector3(cx0, cy0, -L / 2);
    const p1 = new THREE.Vector3(cx1, cy1, L / 2);

    // Kare taraf ölçüleri
    const x0L = n.clone().multiplyScalar(-W1 / 2);
    const x0R = n.clone().multiplyScalar(W1 / 2);
    const y0T = b.clone().multiplyScalar(H1 / 2);
    const y0B = b.clone().multiplyScalar(-H1 / 2);

    this.createDimensionLine(
      p0.clone().add(x0L).add(y0T),
      p0.clone().add(x0R).add(y0T),
      b,
      `W1 = ${this.params.W1.toFixed(1)} cm`,
      this.params.colorW1,
      'W1'
    );

    this.createDimensionLine(
      p0.clone().add(x0R).add(y0B),
      p0.clone().add(x0R).add(y0T),
      n,
      `H1 = ${this.params.H1.toFixed(1)} cm`,
      this.params.colorH1,
      'H1'
    );

    // Daire çapı
    const Rr = D / 2;
    const xR = n.clone().multiplyScalar(Rr);

    this.createDimensionLine(
      p1.clone().add(xR.clone().negate()),
      p1.clone().add(xR),
      b,
      `Ø = ${this.params.Phi.toFixed(1)} cm`,
      this.params.colorPhi,
      'Phi'
    );

    // L ölçüsü
    const left0 = p0.x - W1 / 2;
    const left1 = p1.x - D / 2;
    const bottom0 = p0.y - H1 / 2;
    const bottom1 = p1.y - D / 2;
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

    // Yüz etiketleri
    if (this.params.showSideLabels) {
      const mid = new THREE.Vector3(this.calculateCX(0.25), this.calculateCY(0.25), 0);
      const ox = W1 * 0.25;
      const oy = H1 * 0.25;

      const labels = [
        { text: 'SAĞ', pos: mid.clone().add(n.clone().multiplyScalar(ox)) },
        { text: 'SOL', pos: mid.clone().add(n.clone().multiplyScalar(-ox)) },
        { text: 'ÜST', pos: mid.clone().add(b.clone().multiplyScalar(oy)) },
        { text: 'ALT', pos: mid.clone().add(b.clone().multiplyScalar(-oy)) }
      ];

      labels.forEach(lbl => {
        const label = this.scene.addLabel(lbl.text, lbl.pos, '#6cf');
      });
    }
  }

  calculateArea() {
    let Aout = 0;

    if (this.Rout && this.Rout.length > 0) {
      const N = this.Rout[0].length;

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
    }

    // Flanş alanı ekle (eğer istenirse)
    let flangeArea = 0;
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

          flangeArea += A;
        }
      });
    }

    return {
      outer: Aout + flangeArea,
      inner: 0
    };
  }

  addEdges() {
    // Curved surfaces look better without segment lines
    // Edge lines disabled for smooth appearance
  }

  getDimensions() {
    return {
      W1: this.params.W1,
      H1: this.params.H1,
      Phi: this.params.Phi,
      L: this.params.L,
      t: this.params.t
    };
  }
}
