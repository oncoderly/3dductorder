// Düz Kanal Component
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class DuzKanal extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();

    // Düz Kanal'a özel parametreler
    this.params = {
      ...this.params,
      W1: 25,
      H1: 30,
      L: 120,
      t: 0.12,
      steps: 16,
      colorW1: '#207aff',
      colorH1: '#ff2d2d',
      colorL: '#00bcd4'
    };
  }

  getParameterDefinitions() {
    const common = this.getCommonParameterDefinitions();

    return {
      dimensions: [
        { key: 'W1', label: 'Genişlik (W)', min: 10, max: 200, step: 1, unit: 'cm', default: 25 },
        { key: 'H1', label: 'Yükseklik (H)', min: 10, max: 200, step: 1, unit: 'cm', default: 30 },
        { key: 'L', label: 'Uzunluk (L)', min: 10, max: 500, step: 1, unit: 'cm', default: 120 },
        { key: 't', label: 'Sac Kalınlığı', min: 0.02, max: 1.0, step: 0.01, unit: 'cm', default: 0.12 },
        { key: 'steps', label: 'Segment Sayısı', min: 2, max: 64, step: 1, unit: '', default: 16 }
      ],
      colors: [
        { key: 'colorW1', label: 'W Rengi', default: '#207aff' },
        { key: 'colorH1', label: 'H Rengi', default: '#ff2d2d' },
        { key: 'colorL', label: 'L Rengi', default: '#00bcd4' }
      ],
      // Ortak parametreler (BasePart'tan)
      ...common
    };
  }

  buildGeometry() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const L = BasePart.cm(this.params.L);
    const t = BasePart.cm(this.params.t);

    // Dış ve iç dikdörtgen köşeleri
    const rectOuter = [
      new THREE.Vector3(-W1 / 2, -H1 / 2, 0),
      new THREE.Vector3(W1 / 2, -H1 / 2, 0),
      new THREE.Vector3(W1 / 2, H1 / 2, 0),
      new THREE.Vector3(-W1 / 2, H1 / 2, 0)
    ];

    const rectInner = [
      new THREE.Vector3(-W1 / 2 + t, -H1 / 2 + t, 0),
      new THREE.Vector3(W1 / 2 - t, -H1 / 2 + t, 0),
      new THREE.Vector3(W1 / 2 - t, H1 / 2 - t, 0),
      new THREE.Vector3(-W1 / 2 + t, H1 / 2 - t, 0)
    ];

    const steps = Math.max(2, Math.floor(this.params.steps));
    const vertices = [];
    const indices = [];
    const N = 4; // 4 köşe

    const ringsOuter = [];
    const ringsInner = [];

    // Z ekseni boyunca halkaları oluştur (merkezde)
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const z = (u - 0.5) * L; // Merkezi 0'a kaydır

      const outer = [];
      const inner = [];

      for (let k = 0; k < N; k++) {
        const pOuter = rectOuter[k].clone();
        pOuter.z = z;
        const pInner = rectInner[k].clone();
        pInner.z = z;

        outer.push(pOuter);
        inner.push(pInner);
      }

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

    // Mesh oluştur
    const mesh = new THREE.Mesh(geometry, this.materials.get('metal'));
    this.scene.geometryGroup.add(mesh);

    // Referansı sakla (alan hesabı için)
    this.mainGeometry = geometry;
    this.ringsOuter = ringsOuter;
  }

  buildFlange() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const L = BasePart.cm(this.params.L);
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);

    const Q = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1)
      )
    );

    // Başlangıç flanşı (merkezde)
    const F0 = this.createFlangeRect(W1, H1, lip, fth);
    F0.quaternion.copy(Q);
    F0.position.set(0, 0, -L / 2 - fth * 0.5);
    this.scene.flangeGroup.add(F0);

    // Bitiş flanşı (merkezde)
    const F1 = this.createFlangeRect(W1, H1, lip, fth);
    F1.quaternion.copy(Q);
    F1.position.set(0, 0, L / 2 + fth * 0.5);
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
    const L = BasePart.cm(this.params.L);

    // W boyutu (üstte, yatay)
    this.createDimensionLine(
      new THREE.Vector3(-W1 / 2, H1 / 2, L / 2),
      new THREE.Vector3(W1 / 2, H1 / 2, L / 2),
      new THREE.Vector3(0, 1, 0),
      `W = ${BasePart.formatDimension(this.params.W1)} cm`,
      this.params.colorW1,
      'W1'
    );

    // H boyutu (solda, dikey)
    this.createDimensionLine(
      new THREE.Vector3(-W1 / 2, -H1 / 2, L / 2),
      new THREE.Vector3(-W1 / 2, H1 / 2, L / 2),
      new THREE.Vector3(-1, 0, 0),
      `H = ${BasePart.formatDimension(this.params.H1)} cm`,
      this.params.colorH1,
      'H1'
    );

    // L boyutu (sağda, derinlik)
    this.createDimensionLine(
      new THREE.Vector3(W1 / 2, -H1 / 2, -L / 2),
      new THREE.Vector3(W1 / 2, -H1 / 2, L / 2),
      new THREE.Vector3(1, 0, 0),
      `L = ${BasePart.formatDimension(this.params.L)} cm`,
      this.params.colorL,
      'L'
    );
  }

  calculateArea() {
    if (!this.ringsOuter) return { outer: 0 };

    const steps = this.ringsOuter.length - 1;
    let outerArea = 0;

    // Dış yüzey alanı hesapla
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
      W: this.params.W1,
      H: this.params.H1,
      L: this.params.L,
      t: this.params.t
    };
  }
}
