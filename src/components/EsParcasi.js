// ES Parçası Component - Offset (ES) Transition Duct
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class EsParcasi extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();

    this.params = {
      ...this.params,
      W1: 100,
      H1: 80,
      W2: 100,
      H2: 80,
      L: 120,
      ES: 60,
      ESmarginCm: 5,
      t: 0.12,
      steps: 64,
      colorW1: '#207aff',
      colorH1: '#ff2d2d',
      colorW2: '#8e24aa',
      colorH2: '#ff9800',
      colorL: '#00bcd4',
      colorES: '#207aff'
    };
  }

  getParameterDefinitions() {
    const common = this.getCommonParameterDefinitions();

    return {
      dimensions: [
        { key: 'W1', label: 'W1 (ön)', min: 10, max: 400, step: 0.1, unit: 'cm', default: 100 },
        { key: 'H1', label: 'H1 (ön)', min: 10, max: 400, step: 0.1, unit: 'cm', default: 80 },
        { key: 'W2', label: 'W2 (arka)', min: 10, max: 400, step: 0.1, unit: 'cm', default: 100 },
        { key: 'H2', label: 'H2 (arka)', min: 10, max: 400, step: 0.1, unit: 'cm', default: 80 },
        { key: 'L', label: 'L (uzunluk)', min: 10, max: 1000, step: 0.1, unit: 'cm', default: 120 },
        { key: 'ES', label: 'ES (X ofset)', min: 0, max: 1000, step: 0.1, unit: 'cm', default: 60 },
        { key: 'ESmarginCm', label: 'ES Marjı', min: 0, max: 100, step: 0.1, unit: 'cm', default: 5 },
        { key: 't', label: 'Sac Kalınlığı', min: 0.02, max: 1.0, step: 0.01, unit: 'cm', default: 0.12 },
        { key: 'steps', label: 'Segment Sayısı', min: 8, max: 200, step: 1, unit: '', default: 64 }
      ],
      colors: [
        { key: 'colorW1', label: 'W1 Rengi', default: '#207aff' },
        { key: 'colorH1', label: 'H1 Rengi', default: '#ff2d2d' },
        { key: 'colorW2', label: 'W2 Rengi', default: '#8e24aa' },
        { key: 'colorH2', label: 'H2 Rengi', default: '#ff9800' },
        { key: 'colorL', label: 'L Rengi', default: '#00bcd4' },
        { key: 'colorES', label: 'ES Rengi', default: '#207aff' }
      ],
      // Ortak parametreler (BasePart'tan)
      ...common
    };
  }

  buildGeometry() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const W2 = BasePart.cm(this.params.W2);
    const H2 = BasePart.cm(this.params.H2);
    const L = BasePart.cm(this.params.L);
    const ES = BasePart.cm(this.params.ES);
    const t = BasePart.cm(this.params.t);

    const steps = Math.max(8, Math.floor(this.params.steps));
    const vertices = [];
    const indices = [];
    const N = 4;

    const ringsOuter = [];
    const ringsInner = [];

    const lerp = (a, b, u) => a + (b - a) * u;

    // ES ofseti için smoothstep hesaplama
    const margin = Math.min(
      BasePart.cm(this.params.ESmarginCm || 5),
      Math.max(0, L * 0.5 - 1e-6)
    );

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const w = lerp(W1, W2, u);
      const h = lerp(H1, H2, u);
      const z = (u - 0.5) * L; // Merkezi 0'a kaydır

      // ES ofseti - smoothstep ile yumuşak geçiş
      let s;
      if (L <= 2 * margin) {
        s = u;
      } else {
        s = THREE.MathUtils.clamp(((u * L) - margin) / (L - 2 * margin), 0, 1);
      }
      // Smoothstep formula: s^2 * (3 - 2s)
      s = s * s * (3 - 2 * s);
      const cx = ES * s - ES / 2; // ES ofsetini de merkezle

      // Dış ve iç yarı genişlikler
      const wo = Math.max(w / 2, 1e-6);
      const ho = Math.max(h / 2, 1e-6);
      const wi = Math.max(wo - t, 1e-6);
      const hi = Math.max(ho - t, 1e-6);

      // Dikdörtgen köşeleri (4 köşe)
      const outer = [
        new THREE.Vector3(cx - wo, -ho, z),
        new THREE.Vector3(cx + wo, -ho, z),
        new THREE.Vector3(cx + wo, ho, z),
        new THREE.Vector3(cx - wo, ho, z)
      ];

      const inner = [
        new THREE.Vector3(cx - wi, -hi, z),
        new THREE.Vector3(cx + wi, -hi, z),
        new THREE.Vector3(cx + wi, hi, z),
        new THREE.Vector3(cx - wi, hi, z)
      ];

      ringsOuter.push(outer);
      ringsInner.push(inner);
    }

    // Vertex'leri ekle
    const pushRing = (ring) => {
      for (const v of ring) {
        vertices.push(v.x, v.y, v.z);
      }
    };

    // Önce dış halkalar
    for (let i = 0; i <= steps; i++) pushRing(ringsOuter[i]);

    // Sonra iç halkalar
    const innerBase = vertices.length / 3;
    for (let i = 0; i <= steps; i++) pushRing(ringsInner[i]);

    // Quad helper
    const quad = (a, b, c, d) => {
      indices.push(a, b, c, a, c, d);
    };

    // Dış yüzeyler
    for (let i = 0; i < steps; i++) {
      const b0 = i * N;
      const b1 = (i + 1) * N;
      for (let k = 0; k < N; k++) {
        const a = b0 + k;
        const b = b0 + (k + 1) % N;
        const c = b1 + (k + 1) % N;
        const d = b1 + k;
        quad(a, b, c, d);
      }
    }

    // İç yüzeyler (ters yön)
    for (let i = 0; i < steps; i++) {
      const b0 = innerBase + i * N;
      const b1 = innerBase + (i + 1) * N;
      for (let k = 0; k < N; k++) {
        const a = b0 + k;
        const b = b0 + (k + 1) % N;
        const c = b1 + (k + 1) % N;
        const d = b1 + k;
        quad(d, c, b, a);
      }
    }

    // Geometry oluştur
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.materials.get('metal'));
    this.scene.geometryGroup.add(mesh);

    this.mainGeometry = geometry;
    this.ringsOuter = ringsOuter;
  }

  buildFlange() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const W2 = BasePart.cm(this.params.W2);
    const H2 = BasePart.cm(this.params.H2);
    const L = BasePart.cm(this.params.L);
    const ES = BasePart.cm(this.params.ES);
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);

    // Başlangıç flanşı (merkezde)
    const F0 = this.createFlangeRect(W1, H1, lip, fth);
    F0.position.set(-ES / 2, 0, -L / 2 - fth * 0.5);
    this.scene.flangeGroup.add(F0);

    // Bitiş flanşı (merkezde)
    const F1 = this.createFlangeRect(W2, H2, lip, fth);
    F1.position.set(ES / 2, 0, L / 2 + fth * 0.5);
    this.scene.flangeGroup.add(F1);
  }

  addEdges() {
    if (this.mainGeometry) {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(this.mainGeometry, 1),
        this.materials.get('edge')
      );
      this.scene.geometryGroup.add(edges);
    }
  }

  drawDimensions() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const W2 = BasePart.cm(this.params.W2);
    const H2 = BasePart.cm(this.params.H2);
    const L = BasePart.cm(this.params.L);
    const ES = BasePart.cm(this.params.ES);

    const yTop = Math.max(H1, H2) / 2;

    // W1 alt kenar (merkezde)
    this.createDimensionLine(
      new THREE.Vector3(-ES / 2 - W1 / 2, -H1 / 2, -L / 2),
      new THREE.Vector3(-ES / 2 + W1 / 2, -H1 / 2, -L / 2),
      new THREE.Vector3(0, -1, 0),
      `W1 = ${BasePart.formatDimension(this.params.W1)} cm`,
      this.params.colorW1,
      'W1'
    );

    // H1 sol kenar (merkezde)
    this.createDimensionLine(
      new THREE.Vector3(-ES / 2 - W1 / 2, -H1 / 2, -L / 2),
      new THREE.Vector3(-ES / 2 - W1 / 2, H1 / 2, -L / 2),
      new THREE.Vector3(-1, 0, 0),
      `H1 = ${BasePart.formatDimension(this.params.H1)} cm`,
      this.params.colorH1,
      'H1'
    );

    // W2 üst kenar (merkezde)
    this.createDimensionLine(
      new THREE.Vector3(ES / 2 - W2 / 2, H2 / 2, L / 2),
      new THREE.Vector3(ES / 2 + W2 / 2, H2 / 2, L / 2),
      new THREE.Vector3(0, 1, 0),
      `W2 = ${BasePart.formatDimension(this.params.W2)} cm`,
      this.params.colorW2,
      'W2'
    );

    // H2 sol kenar (merkezde)
    this.createDimensionLine(
      new THREE.Vector3(ES / 2 - W2 / 2, -H2 / 2, L / 2),
      new THREE.Vector3(ES / 2 - W2 / 2, H2 / 2, L / 2),
      new THREE.Vector3(-1, 0, 0),
      `H2 = ${BasePart.formatDimension(this.params.H2)} cm`,
      this.params.colorH2,
      'H2'
    );

    // L: Z boyunca (merkezde)
    this.createDimensionLine(
      new THREE.Vector3(ES / 2, yTop, -L / 2),
      new THREE.Vector3(ES / 2, yTop, L / 2),
      new THREE.Vector3(0, 1, 0),
      `L = ${BasePart.formatDimension(this.params.L)} cm`,
      this.params.colorL,
      'L'
    );

    // ES: X ofseti (merkezde)
    this.createDimensionLine(
      new THREE.Vector3(-ES / 2, H1 / 2, -L / 2),
      new THREE.Vector3(ES / 2, H1 / 2, -L / 2),
      new THREE.Vector3(0, 1, 0),
      `ES = ${BasePart.formatDimension(this.params.ES)} cm`,
      this.params.colorES,
      'ES'
    );
  }

  calculateArea() {
    if (!this.ringsOuter) return { outer: 0 };

    const steps = this.ringsOuter.length - 1;
    let outerArea = 0;

    for (let i = 0; i < steps; i++) {
      const r0 = this.ringsOuter[i];
      const r1 = this.ringsOuter[i + 1];

      for (let k = 0; k < 4; k++) {
        const v00 = r0[k];
        const v01 = r0[(k + 1) % 4];
        const v11 = r1[(k + 1) % 4];
        const v10 = r1[k];

        outerArea += this.triangleArea(v00, v01, v11);
        outerArea += this.triangleArea(v00, v11, v10);
      }
    }

    return { outer: outerArea };
  }

  getDimensions() {
    return {
      W1: this.params.W1,
      H1: this.params.H1,
      W2: this.params.W2,
      H2: this.params.H2,
      L: this.params.L,
      ES: this.params.ES,
      t: this.params.t
    };
  }
}
