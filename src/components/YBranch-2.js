// Y-Branch 2 Component - two independent branches (A: +Z, B: -Z), no mirroring
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class YBranch2 extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.name = 'Y-Branch 2';
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();

    this.params = {
      ...this.params,
      W1A: 40,
      H1A: 25,
      W2A: 30,
      H2A: 20,
      R_inA: 20,
      A1: 90,
      W1B: 40,
      H1B: 25,
      W2B: 30,
      H2B: 20,
      R_inB: 20,
      A2: 90,
      t: 0.12,
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
    const common = this.getCommonParameterDefinitions();
    return {
      groups: [
        {
          name: 'Branch A Ölçüleri',
          params: [
            { key: 'W1A', label: 'Son Genişlik A (W1A)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
            { key: 'H1A', label: 'Son Yükseklik A (H1A)', min: 10, max: 200, step: 1, unit: 'cm', default: 25 },
            { key: 'W2A', label: 'Başlangıç Genişlik A (W2A)', min: 10, max: 200, step: 1, unit: 'cm', default: 30 },
            { key: 'H2A', label: 'Başlangıç Yükseklik A (H2A)', min: 10, max: 200, step: 1, unit: 'cm', default: 20 },
            { key: 'R_inA', label: 'İç Yarıçap A (R_inA)', min: 1, max: 300, step: 1, unit: 'cm', default: 20 },
            { key: 'A1', label: 'Açı A (A1)', min: 10, max: 180, step: 1, unit: '°', default: 90 }
          ]
        },
        {
          name: 'Branch B Ölçüleri',
          params: [
            { key: 'W1B', label: 'Son Genişlik B (W1B)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
            { key: 'H1B', label: 'Son Yükseklik B (H1B)', min: 10, max: 200, step: 1, unit: 'cm', default: 25 },
            { key: 'W2B', label: 'Başlangıç Genişlik B (W2B)', min: 10, max: 200, step: 1, unit: 'cm', default: 30 },
            { key: 'H2B', label: 'Başlangıç Yükseklik B (H2B)', min: 10, max: 200, step: 1, unit: 'cm', default: 20 },
            { key: 'R_inB', label: 'İç Yarıçap B (R_inB)', min: 1, max: 300, step: 1, unit: 'cm', default: 20 },
            { key: 'A2', label: 'Açı B (A2)', min: 10, max: 180, step: 1, unit: '°', default: 90 }
          ]
        },
        {
          name: 'Genel Ayarlar',
          params: [
            { key: 't', label: 'Sac Kalınlığı', min: 0.02, max: 1.0, step: 0.01, unit: 'cm', default: 0.12 },
            { key: 'steps', label: 'Segment Sayısı', min: 16, max: 400, step: 1, unit: '', default: 100 }
          ]
        },
        {
          name: 'Görünüm',
          params: [
            ...common.view,
            { key: 'showLocalAxes', label: 'Lokal Düzlemleri Göster', type: 'checkbox', default: false }
          ]
        },
        {
          name: 'Renkler',
          params: [
            { key: 'colorW1', label: 'W1 Rengi', type: 'color', default: '#007bff' },
            { key: 'colorH1', label: 'H1 Rengi', type: 'color', default: '#ffd400' },
            { key: 'colorW2', label: 'W2 Rengi', type: 'color', default: '#00c853' },
            { key: 'colorH2', label: 'H2 Rengi', type: 'color', default: '#ff8c00' },
            { key: 'colorR', label: 'R Rengi', type: 'color', default: '#ff1744' },
            { key: 'colorA', label: 'Açı Rengi', type: 'color', default: '#7e57c2' }
          ]
        },
        { name: 'Flanş Ayarları', params: common.flange },
        { name: 'Malzeme Özellikleri', params: common.material },
        { name: 'Ölçülendirme Ayarları', params: common.dimension },
        { name: 'Alan Hesabı', params: common.area }
      ]
    };
  }

  buildGeometry() {
    const W1a = BasePart.cm(this.params.W1A);
    const H1a = BasePart.cm(this.params.H1A);
    const W2a = BasePart.cm(this.params.W2A);
    const H2a = BasePart.cm(this.params.H2A);
    const RinA = BasePart.cm(this.params.R_inA);
    const thetaA = THREE.MathUtils.degToRad(this.params.A1);

    const W1b = BasePart.cm(this.params.W1B);
    const H1b = BasePart.cm(this.params.H1B);
    const W2b = BasePart.cm(this.params.W2B);
    const H2b = BasePart.cm(this.params.H2B);
    const RinB = BasePart.cm(this.params.R_inB);
    const thetaB = THREE.MathUtils.degToRad(this.params.A2);

    const t = BasePart.cm(this.params.t);
    const steps = Math.max(16, Math.floor(this.params.steps));

    const buildElbow = (direction, W1, H1, W2, H2, Rin, theta, centerSign) => {
      const W_avg = (W1 + W2) / 2;
      const R_mid = Rin + W_avg / 2;
      const centerX = -R_mid * Math.cos(theta / 2);
      const centerZ = centerSign * R_mid * Math.sin(theta / 2);

      const ringsOuter = [];
      const ringsInner = [];
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const angle = u * theta;
        const W = W2 + (W1 - W2) * u;
        const H = H2 + (H1 - H2) * u;
        const R_center = Rin + W / 2;
        const x = -R_center * Math.cos(angle) - centerX;
        const z = direction * (R_center * Math.sin(angle) - centerZ);
        const pathPos = new THREE.Vector3(x, 0, z);
        const tangent = new THREE.Vector3(R_center * Math.sin(angle), 0, direction * R_center * Math.cos(angle)).normalize();
        const binormal = new THREE.Vector3(0, 1, 0);
        const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
        const Wi = Math.max(W - 2 * t, 0.001);
        const Hi = Math.max(H - 2 * t, 0.001);

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

      return { ringsOuter, ringsInner, centerX, centerZ };
    };

    const elbowA = buildElbow(1, W1a, H1a, W2a, H2a, RinA, thetaA, 1);
    const elbowB = buildElbow(-1, W1b, H1b, W2b, H2b, RinB, thetaB, -1);

    // End plane Z alignment: set end centers to -W1A/2 and +W1B/2
    const avgEndZ = (ring) => {
      const r = ring[ring.length - 1];
      return (r[0].z + r[1].z + r[2].z + r[3].z) / 4;
    };
    const endZA = avgEndZ(elbowA.ringsOuter);
    const endZB = avgEndZ(elbowB.ringsOuter);
    const targetZA = -W1a / 2;
    const targetZB = W1b / 2;
    const offsetA = targetZA - endZA;
    const offsetB = targetZB - endZB;

    const shiftRings = (rings, dz) => {
      rings.forEach(r => r.forEach(v => { v.z += dz; }));
    };
    shiftRings(elbowA.ringsOuter, offsetA);
    shiftRings(elbowA.ringsInner, offsetA);
    shiftRings(elbowB.ringsOuter, offsetB);
    shiftRings(elbowB.ringsInner, offsetB);

    // Build combined geometry
    const vertices = [];
    const indices = [];
    const N = 4;
    const pushRing = (ring) => ring.forEach(v => vertices.push(v.x, v.y, v.z));
    const quad = (a, b, c, d) => { indices.push(a, b, c, a, c, d); };

    const addElbow = (elbow) => {
      const baseOuter = vertices.length / 3;
      elbow.ringsOuter.forEach(pushRing);
      const baseInner = vertices.length / 3;
      elbow.ringsInner.forEach(pushRing);

      for (let i = 0; i < steps; i++) {
        const b0 = baseOuter + i * N;
        const b1 = baseOuter + (i + 1) * N;
        for (let k = 0; k < N; k++) {
          const a = b0 + k;
          const b = b0 + (k + 1) % N;
          const c = b1 + (k + 1) % N;
          const d = b1 + k;
          quad(a, b, c, d);
        }
      }
      for (let i = 0; i < steps; i++) {
        const b0 = baseInner + i * N;
        const b1 = baseInner + (i + 1) * N;
        for (let k = 0; k < N; k++) {
          const a = b0 + k;
          const b = b0 + (k + 1) % N;
          const c = b1 + (k + 1) % N;
          const d = b1 + k;
          quad(d, c, b, a);
        }
      }
    };

    addElbow(elbowA);
    addElbow(elbowB);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.materials.get('metal'));
    this.scene.geometryGroup.add(mesh);

    // Optional local planes at A start corners
    if (this.params.showLocalAxes) {
      const R_center0A = RinA + W2a / 2;
      const W_avgA = (W1a + W2a) / 2;
      const R_midA = RinA + W_avgA / 2;
      const centerXA = -R_midA * Math.cos(thetaA / 2);
      const centerZA = R_midA * Math.sin(thetaA / 2) + offsetA;
      const p0 = new THREE.Vector3(-R_center0A - centerXA, 0, -centerZA);
      const n0 = new THREE.Vector3(1, 0, 0);
      const b0 = new THREE.Vector3(0, 1, 0);
      const t0 = new THREE.Vector3(0, 0, 1);
      const halfW = W2a / 2;
      const halfH = H2a / 2;
      const corners = [
        p0.clone().add(n0.clone().multiplyScalar(-halfW)).add(b0.clone().multiplyScalar(-halfH)),
        p0.clone().add(n0.clone().multiplyScalar(halfW)).add(b0.clone().multiplyScalar(-halfH)),
        p0.clone().add(n0.clone().multiplyScalar(halfW)).add(b0.clone().multiplyScalar(halfH)),
        p0.clone().add(n0.clone().multiplyScalar(-halfW)).add(b0.clone().multiplyScalar(halfH))
      ];
      corners.forEach((corner, idx) => {
        const label = `FlangeBase_C${idx + 1}`;
        this.addLocalPlane(corner, n0, b0, t0, label, '#00bcd4');
        this.addLocalPlane(corner, n0, t0, b0, `${label}_NT`, '#ff9800');
        this.addLocalPlane(corner, b0, t0, n0, `${label}_BT`, '#8bc34a');
      });
    }

    this.mainGeometry = geometry;
    this.elbow1Rings = elbowA.ringsOuter;
    this.elbow2Rings = elbowB.ringsOuter;
    this.offsetA = offsetA;
    this.offsetB = offsetB;
  }

  addLocalPlane(position, normal, binormal, tangent, labelPrefix, color = '#00bcd4') {
    const size = BasePart.cm(12);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
      opacity: 0.4,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: !this.params.dimAlwaysOnTop,
      depthWrite: false
    });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
    const t = tangent && tangent.lengthSq() > 0
      ? tangent.clone().normalize()
      : new THREE.Vector3().crossVectors(normal, binormal).normalize();
    const n = normal.clone().normalize();
    const b = binormal.clone().normalize();
    const basis = new THREE.Matrix4().makeBasis(n, b, t);
    plane.quaternion.setFromRotationMatrix(basis);
    plane.position.copy(position);
    plane.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(plane);

    const labelPos = position.clone()
      .add(n.clone().multiplyScalar(size * 0.6))
      .add(b.clone().multiplyScalar(size * 0.6));
    this.scene.addLabel(labelPrefix, labelPos, color);
  }

  buildFlange() {
    const W1a = BasePart.cm(this.params.W1A);
    const H1a = BasePart.cm(this.params.H1A);
    const W2a = BasePart.cm(this.params.W2A);
    const H2a = BasePart.cm(this.params.H2A);
    const RinA = BasePart.cm(this.params.R_inA);
    const thetaA = THREE.MathUtils.degToRad(this.params.A1);

    const W1b = BasePart.cm(this.params.W1B);
    const H1b = BasePart.cm(this.params.H1B);
    const W2b = BasePart.cm(this.params.W2B);
    const H2b = BasePart.cm(this.params.H2B);
    const RinB = BasePart.cm(this.params.R_inB);
    const thetaB = THREE.MathUtils.degToRad(this.params.A2);

    const offsetA = this.offsetA || 0;
    const offsetB = this.offsetB || 0;
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);

    // Branch A - pozitif Z yönünde
    const W_avgA = (W1a + W2a) / 2;
    const R_midA = RinA + W_avgA / 2;
    const centerXA = -R_midA * Math.cos(thetaA / 2);
    const centerZA = R_midA * Math.sin(thetaA / 2);

    // Branch A başlangıç flanşı (u=0) - geometrinin ilk halkası ile aynı pozisyonda
    // Geometride: z = direction * (R_center * sin(0) - centerZ) = 1 * (0 - centerZA) + offsetA
    const R_center0A = RinA + W2a / 2;
    const x0A = -R_center0A - centerXA;
    const z0A = -centerZA + offsetA;
    const p0A = new THREE.Vector3(x0A, 0, z0A);
    const t0A = new THREE.Vector3(0, 0, 1);
    const n0A = new THREE.Vector3(1, 0, 0);
    const b0A = new THREE.Vector3(0, 1, 0);
    const F0A = this.createFlangeRect(W2a, H2a, lip, fth);
    const M0A = new THREE.Matrix4().makeBasis(n0A, b0A, t0A);
    F0A.quaternion.setFromRotationMatrix(M0A);
    F0A.position.copy(p0A.clone().add(t0A.clone().multiplyScalar(-fth * 0.5)));
    this.scene.flangeGroup.add(F0A);

    // Branch A bitiş flanşı (u=1) - offset uygulanmış pozisyonda
    const R_center1A = RinA + W1a / 2;
    const p1A = new THREE.Vector3(-R_center1A * Math.cos(thetaA) - centerXA, 0, R_center1A * Math.sin(thetaA) - centerZA + offsetA);
    const t1A = new THREE.Vector3(R_center1A * Math.sin(thetaA), 0, R_center1A * Math.cos(thetaA)).normalize();
    const b1A = new THREE.Vector3(0, 1, 0);
    const n1A = new THREE.Vector3().crossVectors(b1A, t1A).normalize();
    const F1A = this.createFlangeRect(W1a, H1a, lip, fth);
    const M1A = new THREE.Matrix4().makeBasis(n1A, b1A, t1A);
    F1A.quaternion.setFromRotationMatrix(M1A);
    F1A.position.copy(p1A.clone().add(t1A.clone().multiplyScalar(fth * 0.5)));
    this.scene.flangeGroup.add(F1A);

    // Branch B - negatif Z yönünde
    const W_avgB = (W1b + W2b) / 2;
    const R_midB = RinB + W_avgB / 2;
    const centerXB = -R_midB * Math.cos(thetaB / 2);
    const centerZB = -R_midB * Math.sin(thetaB / 2);

    // Branch B başlangıç flanşı (u=0) - geometrinin ilk halkası ile aynı pozisyonda
    // Geometride: z = direction * (R_center * sin(0) - centerZ) = -1 * (0 - centerZB) + offsetB
    // centerZB zaten negatif olduğu için: z = -1 * (0 - (-R_midB*sin)) + offsetB = R_midB*sin + offsetB
    // Ama buildElbow'da centerZB = -R_midB*sin, yani z = -1*(0 - centerZB) = -centerZB + offsetB
    const R_center0B = RinB + W2b / 2;
    const x0B = -R_center0B - centerXB;
    const z0B = centerZB + offsetB;
    const p0B = new THREE.Vector3(x0B, 0, z0B);
    const t0B = new THREE.Vector3(0, 0, -1);
    const n0B = new THREE.Vector3(1, 0, 0);
    const b0B = new THREE.Vector3(0, 1, 0);
    const F0B = this.createFlangeRect(W2b, H2b, lip, fth);
    const M0B = new THREE.Matrix4().makeBasis(n0B, b0B, t0B);
    F0B.quaternion.setFromRotationMatrix(M0B);
    F0B.position.copy(p0B.clone().add(t0B.clone().multiplyScalar(-fth * 0.5)));
    this.scene.flangeGroup.add(F0B);

    // Branch B bitiş flanşı (u=1) - offset uygulanmış pozisyonda, negatif Z yönünde
    // direction=-1 için tangent geometride: (R*sin(theta), 0, -1*R*cos(theta))
    const R_center1B = RinB + W1b / 2;
    const p1B = new THREE.Vector3(-R_center1B * Math.cos(thetaB) - centerXB, 0, -R_center1B * Math.sin(thetaB) + centerZB + offsetB);
    const t1B = new THREE.Vector3(R_center1B * Math.sin(thetaB), 0, -1 * R_center1B * Math.cos(thetaB)).normalize();
    const b1B = new THREE.Vector3(0, 1, 0);
    const n1B = new THREE.Vector3().crossVectors(b1B, t1B).normalize();
    const F1B = this.createFlangeRect(W1b, H1b, lip, fth);
    const M1B = new THREE.Matrix4().makeBasis(n1B, b1B, t1B);
    F1B.quaternion.setFromRotationMatrix(M1B);
    F1B.position.copy(p1B.clone().add(t1B.clone().multiplyScalar(fth * 0.5)));
    this.scene.flangeGroup.add(F1B);
  }

  addEdges() {
    if (!this.elbow1Rings || !this.elbow2Rings) return;
    const collect = (rings) => {
      const segs = [];
      for (let i = 0; i < rings.length - 1; i++) {
        const r0 = rings[i];
        const r1 = rings[i + 1];
        for (let k = 0; k < 4; k++) segs.push(r0[k], r1[k]);
      }
      const first = rings[0];
      for (let k = 0; k < 4; k++) segs.push(first[k], first[(k + 1) % 4]);
      const last = rings[rings.length - 1];
      for (let k = 0; k < 4; k++) segs.push(last[k], last[(k + 1) % 4]);
      return segs;
    };
    const segments = [...collect(this.elbow1Rings), ...collect(this.elbow2Rings)];
    const geometry = new THREE.BufferGeometry().setFromPoints(segments);
    const lines = new THREE.LineSegments(geometry, this.materials.get('edge'));
    this.scene.geometryGroup.add(lines);
  }

  drawDimensions() {
    const definitions = this.getParameterDefinitions();
    let allParams = [];
    if (definitions.groups) {
      definitions.groups.forEach(g => { if (g.params) allParams.push(...g.params); });
    } else {
      allParams.push(...(definitions.dimensions || []), ...(definitions.material || []), ...(definitions.view || []));
    }

    // ========== BRANCH A DIMENSIONS ==========
    const W1mA = BasePart.cm(this.params.W1A);
    const H1mA = BasePart.cm(this.params.H1A);
    const W2mA = BasePart.cm(this.params.W2A);
    const H2mA = BasePart.cm(this.params.H2A);
    const RinA = BasePart.cm(this.params.R_inA);
    const thetaA = THREE.MathUtils.degToRad(this.params.A1);

    const W_avgA = (W1mA + W2mA) / 2;
    const R_midA = RinA + W_avgA / 2;
    const centerXA = -R_midA * Math.cos(thetaA / 2);
    const centerZA = R_midA * Math.sin(thetaA / 2);
    const offsetA = this.offsetA || 0;

    const R_center0A = RinA + W2mA / 2;
    const p0A = new THREE.Vector3(-R_center0A - centerXA, 0, -centerZA + offsetA);
    const R_center1A = RinA + W1mA / 2;
    const p1A = new THREE.Vector3(-R_center1A * Math.cos(thetaA) - centerXA, 0, R_center1A * Math.sin(thetaA) - centerZA + offsetA);

    const t0A = new THREE.Vector3(0, 0, 1);
    const b0A = new THREE.Vector3(0, 1, 0);
    const n0A = new THREE.Vector3(1, 0, 0);
    const t1A = new THREE.Vector3(R_center1A * Math.sin(thetaA), 0, R_center1A * Math.cos(thetaA)).normalize();
    const b1A = new THREE.Vector3(0, 1, 0);
    const n1A = new THREE.Vector3().crossVectors(b1A, t1A).normalize();

    // Branch A başlangıç ölçüleri
    const p0A_LB = p0A.clone().add(n0A.clone().multiplyScalar(-W2mA / 2)).add(b0A.clone().multiplyScalar(-H2mA / 2));
    const p0A_RB = p0A.clone().add(n0A.clone().multiplyScalar(W2mA / 2)).add(b0A.clone().multiplyScalar(-H2mA / 2));
    const p0A_LT = p0A.clone().add(n0A.clone().multiplyScalar(-W2mA / 2)).add(b0A.clone().multiplyScalar(H2mA / 2));
    this.createDimensionLine(p0A_LB, p0A_RB, b0A.clone().negate(), `W2A = ${BasePart.formatDimension(this.params.W2A)} cm`, this.params.colorW2, 'W2A');
    this.createDimensionLine(p0A_LB, p0A_LT, n0A.clone().negate(), `H2A = ${BasePart.formatDimension(this.params.H2A)} cm`, this.params.colorH2, 'H2A');

    // Branch A bitiş ölçüleri
    const p1A_LB = p1A.clone().add(n1A.clone().multiplyScalar(-W1mA / 2)).add(b1A.clone().multiplyScalar(-H1mA / 2));
    const p1A_RB = p1A.clone().add(n1A.clone().multiplyScalar(W1mA / 2)).add(b1A.clone().multiplyScalar(-H1mA / 2));
    const p1A_LT = p1A.clone().add(n1A.clone().multiplyScalar(-W1mA / 2)).add(b1A.clone().multiplyScalar(H1mA / 2));
    this.createDimensionLine(p1A_LB, p1A_RB, b1A.clone().negate(), `W1A = ${BasePart.formatDimension(this.params.W1A)} cm`, this.params.colorW1, 'W1A');
    this.createDimensionLine(p1A_LB, p1A_LT, n1A.clone().negate(), `H1A = ${BasePart.formatDimension(this.params.H1A)} cm`, this.params.colorH1, 'H1A');

    // Branch A R ve A
    const innerArcCenterA = new THREE.Vector3(-centerXA, 0, -centerZA + offsetA);
    const innerArcPointA = new THREE.Vector3(-RinA - centerXA, 0, -centerZA + offsetA);
    const headLen = BasePart.cm(this.params.arrowHeadCm);
    const radius = BasePart.cm(this.params.arrowRadiusCm);
    const dirRA = new THREE.Vector3().subVectors(innerArcPointA, innerArcCenterA).normalize();
    const startRA = innerArcCenterA.clone().add(dirRA.clone().multiplyScalar(BasePart.cm(this.params.dimOffsetCm)));

    const lineMatA = this.materials.createDimensionLineMaterial(this.params.colorR, this.params.dimAlwaysOnTop);
    const geoRA = new THREE.BufferGeometry().setFromPoints([startRA, innerArcPointA]);
    const lineRA = new THREE.Line(geoRA, lineMatA);
    lineRA.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(lineRA);

    const arrowMatA = this.materials.createDimensionArrowMaterial(this.params.colorR, this.params.dimAlwaysOnTop);
    const coneA = new THREE.Mesh(new THREE.ConeGeometry(radius, headLen, 12), arrowMatA);
    coneA.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirRA);
    coneA.position.copy(innerArcPointA);
    coneA.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(coneA);

    const paramDataRA = allParams.find(p => p.key === 'R_inA');
    const labelOffsetR = 0.15;
    this.scene.addLabel(`R(iç)A = ${BasePart.formatDimension(this.params.R_inA)} cm`,
      startRA.clone().add(innerArcPointA).multiplyScalar(0.5).add(new THREE.Vector3(0, labelOffsetR, 0)), this.params.colorR, paramDataRA);

    const arcPtsA = [];
    const segs = 48;
    const R_mid_arcA = RinA + W_avgA / 2;
    for (let i = 0; i <= segs; i++) {
      const a = i / segs * thetaA;
      arcPtsA.push(new THREE.Vector3(-R_mid_arcA * Math.cos(a) - centerXA, 0, R_mid_arcA * Math.sin(a) - centerZA + offsetA));
    }
    const arcLineA = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arcPtsA),
      new THREE.LineDashedMaterial({
        color: new THREE.Color(this.params.colorA),
        dashSize: 0.06,
        gapSize: 0.04,
        depthTest: !this.params.dimAlwaysOnTop
      })
    );
    arcLineA.computeLineDistances();
    arcLineA.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(arcLineA);

    const paramDataA1 = allParams.find(p => p.key === 'A1');
    const midAngleA = thetaA / 2;
    const labelOffsetA = -0.1;
    this.scene.addLabel(`A1 = ${this.params.A1}°`,
      new THREE.Vector3(-R_mid_arcA * Math.cos(midAngleA) * 0.7 - centerXA, labelOffsetA, R_mid_arcA * Math.sin(midAngleA) * 0.7 - centerZA + offsetA), this.params.colorA, paramDataA1);

    // ========== BRANCH B DIMENSIONS ==========
    const W1mB = BasePart.cm(this.params.W1B);
    const H1mB = BasePart.cm(this.params.H1B);
    const W2mB = BasePart.cm(this.params.W2B);
    const H2mB = BasePart.cm(this.params.H2B);
    const RinB = BasePart.cm(this.params.R_inB);
    const thetaB = THREE.MathUtils.degToRad(this.params.A2);

    const W_avgB = (W1mB + W2mB) / 2;
    const R_midB = RinB + W_avgB / 2;
    const centerXB = -R_midB * Math.cos(thetaB / 2);
    const centerZB0 = -R_midB * Math.sin(thetaB / 2);
    const offsetB = this.offsetB || 0;
    const centerZB = centerZB0 + offsetB;

    const R_center0B = RinB + W2mB / 2;
    const p0B = new THREE.Vector3(-R_center0B - centerXB, 0, centerZB);
    const R_center1B = RinB + W1mB / 2;
    const p1B = new THREE.Vector3(-R_center1B * Math.cos(thetaB) - centerXB, 0, -R_center1B * Math.sin(thetaB) + centerZB);

    const t0B = new THREE.Vector3(0, 0, -1);
    const b0B = new THREE.Vector3(0, 1, 0);
    const n0B = new THREE.Vector3(1, 0, 0);
    const t1B = new THREE.Vector3(R_center1B * Math.sin(thetaB), 0, -R_center1B * Math.cos(thetaB)).normalize();
    const b1B = new THREE.Vector3(0, 1, 0);
    const n1B = new THREE.Vector3().crossVectors(b1B, t1B).normalize();

    // Branch B başlangıç ölçüleri
    const p0B_LB = p0B.clone().add(n0B.clone().multiplyScalar(-W2mB / 2)).add(b0B.clone().multiplyScalar(-H2mB / 2));
    const p0B_RB = p0B.clone().add(n0B.clone().multiplyScalar(W2mB / 2)).add(b0B.clone().multiplyScalar(-H2mB / 2));
    const p0B_LT = p0B.clone().add(n0B.clone().multiplyScalar(-W2mB / 2)).add(b0B.clone().multiplyScalar(H2mB / 2));
    this.createDimensionLine(p0B_LB, p0B_RB, b0B.clone().negate(), `W2B = ${BasePart.formatDimension(this.params.W2B)} cm`, this.params.colorW2, 'W2B');
    this.createDimensionLine(p0B_LB, p0B_LT, n0B.clone().negate(), `H2B = ${BasePart.formatDimension(this.params.H2B)} cm`, this.params.colorH2, 'H2B');

    // Branch B bitiş ölçüleri
    const p1B_LB = p1B.clone().add(n1B.clone().multiplyScalar(-W1mB / 2)).add(b1B.clone().multiplyScalar(-H1mB / 2));
    const p1B_RB = p1B.clone().add(n1B.clone().multiplyScalar(W1mB / 2)).add(b1B.clone().multiplyScalar(-H1mB / 2));
    const p1B_LT = p1B.clone().add(n1B.clone().multiplyScalar(-W1mB / 2)).add(b1B.clone().multiplyScalar(H1mB / 2));
    this.createDimensionLine(p1B_LB, p1B_RB, b1B.clone().negate(), `W1B = ${BasePart.formatDimension(this.params.W1B)} cm`, this.params.colorW1, 'W1B');
    this.createDimensionLine(p1B_LB, p1B_LT, n1B.clone().negate(), `H1B = ${BasePart.formatDimension(this.params.H1B)} cm`, this.params.colorH1, 'H1B');

    // Branch B R ve A
    const innerArcCenterB = new THREE.Vector3(-centerXB, 0, centerZB);
    const innerArcPointB = new THREE.Vector3(-RinB - centerXB, 0, centerZB);
    const dirRB = new THREE.Vector3().subVectors(innerArcPointB, innerArcCenterB).normalize();
    const startRB = innerArcCenterB.clone().add(dirRB.clone().multiplyScalar(BasePart.cm(this.params.dimOffsetCm)));

    const lineMatB = this.materials.createDimensionLineMaterial(this.params.colorR, this.params.dimAlwaysOnTop);
    const geoRB = new THREE.BufferGeometry().setFromPoints([startRB, innerArcPointB]);
    const lineRB = new THREE.Line(geoRB, lineMatB);
    lineRB.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(lineRB);

    const arrowMatB = this.materials.createDimensionArrowMaterial(this.params.colorR, this.params.dimAlwaysOnTop);
    const coneB = new THREE.Mesh(new THREE.ConeGeometry(radius, headLen, 12), arrowMatB);
    coneB.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirRB);
    coneB.position.copy(innerArcPointB);
    coneB.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(coneB);

    const paramDataRB = allParams.find(p => p.key === 'R_inB');
    this.scene.addLabel(`R(iç)B = ${BasePart.formatDimension(this.params.R_inB)} cm`,
      startRB.clone().add(innerArcPointB).multiplyScalar(0.5).add(new THREE.Vector3(0, labelOffsetR, 0)), this.params.colorR, paramDataRB);

    const arcPtsB = [];
    const R_mid_arcB = RinB + W_avgB / 2;
    for (let i = 0; i <= segs; i++) {
      const a = i / segs * thetaB;
      arcPtsB.push(new THREE.Vector3(-R_mid_arcB * Math.cos(a) - centerXB, 0, -R_mid_arcB * Math.sin(a) + centerZB));
    }
    const arcLineB = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arcPtsB),
      new THREE.LineDashedMaterial({
        color: new THREE.Color(this.params.colorA),
        dashSize: 0.06,
        gapSize: 0.04,
        depthTest: !this.params.dimAlwaysOnTop
      })
    );
    arcLineB.computeLineDistances();
    arcLineB.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(arcLineB);

    const paramDataA2 = allParams.find(p => p.key === 'A2');
    const midAngleB = thetaB / 2;
    this.scene.addLabel(`A2 = ${this.params.A2}°`,
      new THREE.Vector3(-R_mid_arcB * Math.cos(midAngleB) * 0.7 - centerXB, labelOffsetA, -R_mid_arcB * Math.sin(midAngleB) * 0.7 + centerZB), this.params.colorA, paramDataA2);
  }

  calculateArea() {
    const calc = (rings) => {
      if (!rings || rings.length < 2) return 0;
      const steps = rings.length - 1;
      let area = 0;
      for (let i = 0; i < steps; i++) {
        const r0 = rings[i];
        const r1 = rings[i + 1];
        for (let k = 0; k < 4; k++) {
          const v00 = r0[k];
          const v01 = r0[(k + 1) % 4];
          const v11 = r1[(k + 1) % 4];
          const v10 = r1[k];
          area += this.triangleArea(v00, v01, v11);
          area += this.triangleArea(v00, v11, v10);
        }
      }
      return area;
    };
    return { outer: calc(this.elbow1Rings) + calc(this.elbow2Rings) };
  }

  getDimensions() {
    return {
      W1A: this.params.W1A,
      H1A: this.params.H1A,
      W2A: this.params.W2A,
      H2A: this.params.H2A,
      R_inA: this.params.R_inA,
      A1: this.params.A1,
      W1B: this.params.W1B,
      H1B: this.params.H1B,
      W2B: this.params.W2B,
      H2B: this.params.H2B,
      R_inB: this.params.R_inB,
      A2: this.params.A2,
      t: this.params.t
    };
  }
}
