// Es-Parcasi Component - Offset (ES) Duct (Equal Cross Section)
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
      W: 100,
      H: 80,
      L: 120,
      ES: 60,
      ESmarginCm: 5,
      t: 0.12,
      steps: 64,
      colorW: '#207aff',
      colorH: '#ff2d2d',
      colorL: '#00bcd4',
      colorES: '#207aff'
    };
  }

  getParameterDefinitions() {
    const common = this.getCommonParameterDefinitions();

    return {
      dimensions: [
        { key: 'W', label: 'W (genislik)', min: 10, max: 400, step: 1, unit: 'cm', default: 100 },
        { key: 'H', label: 'H (yukseklik)', min: 10, max: 400, step: 1, unit: 'cm', default: 80 },
        { key: 'L', label: 'L (uzunluk)', min: 10, max: 1000, step: 1, unit: 'cm', default: 120 },
        { key: 'ES', label: 'ES (X ofset)', min: 0, max: 1000, step: 1, unit: 'cm', default: 60 },
        { key: 'ESmarginCm', label: 'ES Marji', min: 0, max: 100, step: 1, unit: 'cm', default: 5 },
        { key: 't', label: 'Sac Kalinligi', min: 0.02, max: 1.0, step: 0.01, unit: 'cm', default: 0.12 },
        { key: 'steps', label: 'Segment Sayisi', min: 8, max: 200, step: 1, unit: '', default: 64 }
      ],
      colors: [
        { key: 'colorW', label: 'W Rengi', default: '#207aff' },
        { key: 'colorH', label: 'H Rengi', default: '#ff2d2d' },
        { key: 'colorL', label: 'L Rengi', default: '#00bcd4' },
        { key: 'colorES', label: 'ES Rengi', default: '#207aff' }
      ],
      // Ortak parametreler (BasePart'tan)
      ...common
    };
  }

  buildGeometry() {
    const W = BasePart.cm(this.params.W);
    const H = BasePart.cm(this.params.H);
    const L = BasePart.cm(this.params.L);
    const ES = BasePart.cm(this.params.ES);
    const t = BasePart.cm(this.params.t);

    const steps = Math.max(8, Math.floor(this.params.steps));
    const vertices = [];
    const indices = [];
    const N = 4;

    const ringsOuter = [];
    const ringsInner = [];

    // ES ofseti icin smoothstep hesaplama
    const margin = Math.min(
      BasePart.cm(this.params.ESmarginCm || 5),
      Math.max(0, L * 0.5 - 1e-6)
    );

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const z = (u - 0.5) * L; // Merkezi 0'a kaydir

      // ES ofseti - smoothstep ile yumusak gecis
      let s;
      if (L <= 2 * margin) {
        s = u;
      } else {
        s = THREE.MathUtils.clamp(((u * L) - margin) / (L - 2 * margin), 0, 1);
      }
      // Smoothstep formula: s^2 * (3 - 2s)
      s = s * s * (3 - 2 * s);
      const cx = ES * s - ES / 2; // ES ofsetini de merkezle

      // Dis ve ic yari genislikler (sabit kesit)
      const wo = Math.max(W / 2, 1e-6);
      const ho = Math.max(H / 2, 1e-6);
      const wi = Math.max(wo - t, 1e-6);
      const hi = Math.max(ho - t, 1e-6);

      // Dikdortgen koseleri (4 kose)
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

    // Once dis halkalar
    for (let i = 0; i <= steps; i++) pushRing(ringsOuter[i]);

    // Sonra ic halkalar
    const innerBase = vertices.length / 3;
    for (let i = 0; i <= steps; i++) pushRing(ringsInner[i]);

    // Quad helper
    const quad = (a, b, c, d) => {
      indices.push(a, b, c, a, c, d);
    };

    // Dis yuzeyler
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

    // Ic yuzeyler (ters yon)
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

    // Geometry olustur
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
    const W = BasePart.cm(this.params.W);
    const H = BasePart.cm(this.params.H);
    const L = BasePart.cm(this.params.L);
    const ES = BasePart.cm(this.params.ES);
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);

    // Baslangic flansi (merkezde)
    const F0 = this.createFlangeRect(W, H, lip, fth);
    F0.position.set(-ES / 2, 0, -L / 2 - fth * 0.5);
    this.scene.flangeGroup.add(F0);

    // Bitis flansi (merkezde)
    const F1 = this.createFlangeRect(W, H, lip, fth);
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
    const W = BasePart.cm(this.params.W);
    const H = BasePart.cm(this.params.H);
    const L = BasePart.cm(this.params.L);
    const ES = BasePart.cm(this.params.ES);

    const yTop = H / 2;

    // W alt kenar (on yuz - merkezde)
    this.createDimensionLine(
      new THREE.Vector3(-ES / 2 - W / 2, -H / 2, -L / 2),
      new THREE.Vector3(-ES / 2 + W / 2, -H / 2, -L / 2),
      new THREE.Vector3(0, -1, 0),
      `W = ${BasePart.formatDimension(this.params.W)} cm`,
      this.params.colorW,
      'W'
    );

    // H sol kenar (on yuz - merkezde)
    this.createDimensionLine(
      new THREE.Vector3(-ES / 2 - W / 2, -H / 2, -L / 2),
      new THREE.Vector3(-ES / 2 - W / 2, H / 2, -L / 2),
      new THREE.Vector3(-1, 0, 0),
      `H = ${BasePart.formatDimension(this.params.H)} cm`,
      this.params.colorH,
      'H'
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
      new THREE.Vector3(-ES / 2, H / 2, -L / 2),
      new THREE.Vector3(ES / 2, H / 2, -L / 2),
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
      W: this.params.W,
      H: this.params.H,
      L: this.params.L,
      ES: this.params.ES,
      t: this.params.t
    };
  }
}
