// Redüksiyonlu Dirsek Component
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class ReduksiyonDirsek extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();

    this.params = {
      ...this.params,
      W1: 40,
      H1: 25,
      W2: 30,
      H2: 20,
      t: 0.12,
      R_in: 20,
      A: 90,
      steps: 100,
      colorW1: '#007bff',
      colorH1: '#ffd400',
      colorW2: '#00c853',
      colorH2: '#ff8c00',
      colorR: '#ff1744',
      colorA: '#7e57c2'
    };
  }

  getParameterDefinitions() {
    return {
      dimensions: [
        { key: 'W1', label: 'Son Genişlik (W1)', min: 10, max: 200, step: 0.1, unit: 'cm', default: 40 },
        { key: 'H1', label: 'Son Yükseklik (H1)', min: 10, max: 200, step: 0.1, unit: 'cm', default: 25 },
        { key: 'W2', label: 'Başlangıç Genişlik (W2)', min: 10, max: 200, step: 0.1, unit: 'cm', default: 30 },
        { key: 'H2', label: 'Başlangıç Yükseklik (H2)', min: 10, max: 200, step: 0.1, unit: 'cm', default: 20 },
        { key: 't', label: 'Sac Kalınlığı', min: 0.02, max: 1.0, step: 0.01, unit: 'cm', default: 0.12 },
        { key: 'R_in', label: 'İç Yarıçap', min: 1, max: 300, step: 0.1, unit: 'cm', default: 20 },
        { key: 'A', label: 'Açı', min: 10, max: 180, step: 1, unit: '°', default: 90 },
        { key: 'steps', label: 'Segment Sayısı', min: 16, max: 400, step: 1, unit: '', default: 100 }
      ],
      colors: [
        { key: 'colorW1', label: 'W1 Rengi', default: '#007bff' },
        { key: 'colorH1', label: 'H1 Rengi', default: '#ffd400' },
        { key: 'colorW2', label: 'W2 Rengi', default: '#00c853' },
        { key: 'colorH2', label: 'H2 Rengi', default: '#ff8c00' },
        { key: 'colorR', label: 'R Rengi', default: '#ff1744' },
        { key: 'colorA', label: 'Açı Rengi', default: '#7e57c2' }
      ]
    };
  }

  buildGeometry() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const W2 = BasePart.cm(this.params.W2);
    const H2 = BasePart.cm(this.params.H2);
    const t = BasePart.cm(this.params.t);
    const Rin = BasePart.cm(this.params.R_in);
    const theta = THREE.MathUtils.degToRad(this.params.A);

    const steps = Math.max(16, Math.floor(this.params.steps));

    // Çeyrek daire path - merkez hat yarıçapı
    const Rc = Rin + (Math.max(W1, W2) / 2);

    // Merkezi hesapla (ark'ın geometrik merkezi)
    const centerX = -Rc * (Math.cos(theta / 2));
    const centerZ = Rc * (Math.sin(theta / 2));

    // Outer ve inner rings
    const ringsOuter = [];
    const ringsInner = [];

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const angle = u * theta;

      // Path pozisyonu (merkezde)
      const x = -Rc * Math.cos(angle) - centerX;
      const z = Rc * Math.sin(angle) - centerZ;
      const pathPos = new THREE.Vector3(x, 0, z);

      // Tangent, normal, binormal
      const tangent = new THREE.Vector3(Rc * Math.sin(angle), 0, Rc * Math.cos(angle)).normalize();
      const binormal = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

      // Boyut interpolasyonu
      const W = W2 + (W1 - W2) * u;
      const H = H2 + (H1 - H2) * u;
      const Wi = Math.max(W - 2 * t, 0.001);
      const Hi = Math.max(H - 2 * t, 0.001);

      // Dikdörtgen köşeleri (4 köşe)
      const outerRing = [
        pathPos.clone().add(normal.clone().multiplyScalar(-W / 2)).add(binormal.clone().multiplyScalar(-H / 2)),
        pathPos.clone().add(normal.clone().multiplyScalar(W / 2)).add(binormal.clone().multiplyScalar(-H / 2)),
        pathPos.clone().add(normal.clone().multiplyScalar(W / 2)).add(binormal.clone().multiplyScalar(H / 2)),
        pathPos.clone().add(normal.clone().multiplyScalar(-W / 2)).add(binormal.clone().multiplyScalar(H / 2))
      ];

      const innerRing = [
        pathPos.clone().add(normal.clone().multiplyScalar(-Wi / 2)).add(binormal.clone().multiplyScalar(-Hi / 2)),
        pathPos.clone().add(normal.clone().multiplyScalar(Wi / 2)).add(binormal.clone().multiplyScalar(-Hi / 2)),
        pathPos.clone().add(normal.clone().multiplyScalar(Wi / 2)).add(binormal.clone().multiplyScalar(Hi / 2)),
        pathPos.clone().add(normal.clone().multiplyScalar(-Wi / 2)).add(binormal.clone().multiplyScalar(Hi / 2))
      ];

      ringsOuter.push(outerRing);
      ringsInner.push(innerRing);
    }

    // Vertex ve index dizileri
    const vertices = [];
    const indices = [];
    const N = 4;

    const pushRing = (ring) => {
      for (const v of ring) {
        vertices.push(v.x, v.y, v.z);
      }
    };

    // Dış halkalar
    for (let i = 0; i <= steps; i++) pushRing(ringsOuter[i]);

    // İç halkalar
    const innerBase = vertices.length / 3;
    for (let i = 0; i <= steps; i++) pushRing(ringsInner[i]);

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

    // İç yüzeyler
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
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);
    const Rin = BasePart.cm(this.params.R_in);
    const theta = THREE.MathUtils.degToRad(this.params.A);
    const Rc = Rin + (Math.max(W1, W2) / 2);

    // Merkezi hesapla (ark'ın geometrik merkezi)
    const centerX = -Rc * (Math.cos(theta / 2));
    const centerZ = Rc * (Math.sin(theta / 2));

    // Başlangıç flanşı (u=0, merkezde)
    const p0 = new THREE.Vector3(-Rc - centerX, 0, 0 - centerZ);
    const t0 = new THREE.Vector3(0, 0, 1);
    const n0 = new THREE.Vector3(1, 0, 0);
    const b0 = new THREE.Vector3(0, 1, 0);

    const F0 = this.createFlangeRect(W2, H2, lip, fth);
    const M0 = new THREE.Matrix4().makeBasis(n0, b0, t0);
    F0.quaternion.setFromRotationMatrix(M0);
    F0.position.copy(p0.clone().add(t0.clone().multiplyScalar(-fth * 0.5)));
    this.scene.flangeGroup.add(F0);

    // Bitiş flanşı (u=1, merkezde)
    const p1 = new THREE.Vector3(-Rc * Math.cos(theta) - centerX, 0, Rc * Math.sin(theta) - centerZ);
    const t1 = new THREE.Vector3(Rc * Math.sin(theta), 0, Rc * Math.cos(theta)).normalize();
    const b1 = new THREE.Vector3(0, 1, 0);
    const n1 = new THREE.Vector3().crossVectors(b1, t1).normalize();

    const F1 = this.createFlangeRect(W1, H1, lip, fth);
    const M1 = new THREE.Matrix4().makeBasis(n1, b1, t1);
    F1.quaternion.setFromRotationMatrix(M1);
    F1.position.copy(p1.clone().add(t1.clone().multiplyScalar(fth * 0.5)));
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
    const W1m = BasePart.cm(this.params.W1);
    const H1m = BasePart.cm(this.params.H1);
    const W2m = BasePart.cm(this.params.W2);
    const H2m = BasePart.cm(this.params.H2);
    const Rin = BasePart.cm(this.params.R_in);
    const theta = THREE.MathUtils.degToRad(this.params.A);
    const Rc = Rin + (Math.max(W1m, W2m) / 2);

    // Merkezi hesapla (ark'ın geometrik merkezi)
    const centerX = -Rc * (Math.cos(theta / 2));
    const centerZ = Rc * (Math.sin(theta / 2));

    // Başlangıç ve bitiş noktaları (merkezde)
    const p0 = new THREE.Vector3(-Rc - centerX, 0, 0 - centerZ);
    const p1 = new THREE.Vector3(-Rc * Math.cos(theta) - centerX, 0, Rc * Math.sin(theta) - centerZ);

    // Başlangıç frame (u=0)
    const t0 = new THREE.Vector3(0, 0, 1);
    const b0 = new THREE.Vector3(0, 1, 0);
    const n0 = new THREE.Vector3(1, 0, 0);

    // Bitiş frame (u=1)
    const t1 = new THREE.Vector3(Rc * Math.sin(theta), 0, Rc * Math.cos(theta)).normalize();
    const b1 = new THREE.Vector3(0, 1, 0);
    const n1 = new THREE.Vector3().crossVectors(b1, t1).normalize();

    // Başlangıç ağız W2, H2 ölçüleri
    const p0_LB = p0.clone().add(n0.clone().multiplyScalar(-W2m / 2)).add(b0.clone().multiplyScalar(-H2m / 2));
    const p0_RB = p0.clone().add(n0.clone().multiplyScalar(W2m / 2)).add(b0.clone().multiplyScalar(-H2m / 2));
    const p0_LT = p0.clone().add(n0.clone().multiplyScalar(-W2m / 2)).add(b0.clone().multiplyScalar(H2m / 2));

    // W2: alt kenar boyunca, uzatma aşağı
    this.createDimensionLine(p0_LB, p0_RB, b0.clone().negate(), `W2 = ${this.params.W2.toFixed(1)} cm`, this.params.colorW2);

    // H2: sol kenar boyunca, uzatma sola
    this.createDimensionLine(p0_LB, p0_LT, n0.clone().negate(), `H2 = ${this.params.H2.toFixed(1)} cm`, this.params.colorH2);

    // Bitiş ağız W1, H1 ölçüleri
    const p1_LB = p1.clone().add(n1.clone().multiplyScalar(-W1m / 2)).add(b1.clone().multiplyScalar(-H1m / 2));
    const p1_RB = p1.clone().add(n1.clone().multiplyScalar(W1m / 2)).add(b1.clone().multiplyScalar(-H1m / 2));
    const p1_LT = p1.clone().add(n1.clone().multiplyScalar(-W1m / 2)).add(b1.clone().multiplyScalar(H1m / 2));

    // W1: alt kenar boyunca, uzatma aşağı
    this.createDimensionLine(p1_LB, p1_RB, b1.clone().negate(), `W1 = ${this.params.W1.toFixed(1)} cm`, this.params.colorW1);

    // H1: sol kenar boyunca, uzatma sola
    this.createDimensionLine(p1_LB, p1_LT, n1.clone().negate(), `H1 = ${this.params.H1.toFixed(1)} cm`, this.params.colorH1);

    // R(iç) yarıçapı gösterimi (merkezde)
    const center = new THREE.Vector3(0 - centerX, 0, 0 - centerZ);
    const arcPoint = new THREE.Vector3(-Rin - centerX, 0, 0 - centerZ);

    const headLen = BasePart.cm(this.params.arrowHeadCm);
    const radius = BasePart.cm(this.params.arrowRadiusCm);
    const dirR = new THREE.Vector3().subVectors(arcPoint, center).normalize();
    const startR = center.clone().add(dirR.clone().multiplyScalar(BasePart.cm(this.params.dimOffsetCm)));

    const lineMat = this.materials.createDimensionLineMaterial(this.params.colorR, this.params.dimAlwaysOnTop);
    const geoR = new THREE.BufferGeometry().setFromPoints([startR, arcPoint]);
    const lineR = new THREE.Line(geoR, lineMat);
    lineR.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(lineR);

    const arrowMat = this.materials.createDimensionArrowMaterial(this.params.colorR, this.params.dimAlwaysOnTop);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, headLen, 12), arrowMat);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirR);
    cone.position.copy(arcPoint);
    cone.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(cone);

    this.scene.addLabel(`R(iç) = ${this.params.R_in.toFixed(1)} cm`,
      startR.clone().add(arcPoint).multiplyScalar(0.5), this.params.colorR);

    // Açı yayı (merkezde)
    const arcPts = [];
    const segs = 48;
    for (let i = 0; i <= segs; i++) {
      const a = i / segs * theta;
      arcPts.push(new THREE.Vector3(-Rc * Math.cos(a) - centerX, 0, Rc * Math.sin(a) - centerZ));
    }
    const arcLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arcPts),
      new THREE.LineDashedMaterial({
        color: new THREE.Color(this.params.colorA),
        dashSize: 0.06,
        gapSize: 0.04
      })
    );
    arcLine.computeLineDistances();
    arcLine.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(arcLine);

    this.scene.addLabel(`A = ${this.params.A}°`,
      new THREE.Vector3(-Rc * 0.6 - centerX, 0, Rc * 0.6 - centerZ), this.params.colorA);
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
      R: this.params.R_in,
      A: this.params.A,
      t: this.params.t
    };
  }
}
