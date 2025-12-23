// Y-Branch 3 Component (SideBranch2 tabanlı, düz kanal yerine ikinci dirsek)
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class YBranch3 extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.name = 'Y-Branch 3';
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();

    this.params = {
      ...this.params,
      W1a: 40, // İlk dirsek bitiş genişliği
      W1b: 40, // İkinci dirsek başlangıç genişliği
      H1: 25,
      W2: 30,
      H2: 20,
      W3: 40,
      H3: 25,
      t: 0.12,
      R_in: 20,
      A: 90,
      steps: 100,
      colorW1a: '#007bff',
      colorW1b: '#00bcd4',
      colorH1: '#ffd400',
      colorW2: '#00c853',
      colorH2: '#ff8c00',
      colorW3: '#ff69b4',
      colorH3: '#9c27b0',
      colorR: '#ff1744',
      colorA: '#7e57c2'
    };
  }

  getParameterDefinitions() {
    const common = this.getCommonParameterDefinitions();

    return {
      dimensions: [
        { key: 'W1a', label: 'Dirsek Bitiş Genişlik (W1a)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
        { key: 'W1b', label: 'İkinci Dirsek Başlangıç Genişlik (W1b)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
        { key: 'H1', label: 'Ortak Yükseklik (H1)', min: 10, max: 200, step: 1, unit: 'cm', default: 25 },
        { key: 'W2', label: 'İlk Dirsek Başlangıç Genişlik (W2)', min: 10, max: 200, step: 1, unit: 'cm', default: 30 },
        { key: 'H2', label: 'İlk Dirsek Başlangıç Yükseklik (H2)', min: 10, max: 200, step: 1, unit: 'cm', default: 20 },
        { key: 'W3', label: 'İkinci Dirsek Bitiş Genişlik (W3)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
        { key: 'H3', label: 'İkinci Dirsek Bitiş Yükseklik (H3)', min: 10, max: 200, step: 1, unit: 'cm', default: 25 },
        { key: 't', label: 'Sac Kalınlığı', min: 0.02, max: 1.0, step: 0.01, unit: 'cm', default: 0.12 },
        { key: 'R_in', label: 'İç Yarıçap', min: 1, max: 300, step: 1, unit: 'cm', default: 20 },
        { key: 'A', label: 'Açı', min: 10, max: 180, step: 1, unit: '°', default: 90 },
        { key: 'steps', label: 'Segment Sayısı', min: 16, max: 400, step: 1, unit: '', default: 100 }
      ],
      colors: [
        { key: 'colorW1a', label: 'W1a Rengi', default: '#007bff' },
        { key: 'colorW1b', label: 'W1b Rengi', default: '#00bcd4' },
        { key: 'colorH1', label: 'H1 Rengi', default: '#ffd400' },
        { key: 'colorW2', label: 'W2 Rengi', default: '#00c853' },
        { key: 'colorH2', label: 'H2 Rengi', default: '#ff8c00' },
        { key: 'colorW3', label: 'W3 Rengi', default: '#ff69b4' },
        { key: 'colorH3', label: 'H3 Rengi', default: '#9c27b0' },
        { key: 'colorR', label: 'R Rengi', default: '#ff1744' },
        { key: 'colorA', label: 'Açı Rengi', default: '#7e57c2' }
      ],
      ...common
    };
  }

  buildGeometry() {
    const W1a = BasePart.cm(this.params.W1a);
    const W1b = BasePart.cm(this.params.W1b);
    const H1 = BasePart.cm(this.params.H1);
    const W2 = BasePart.cm(this.params.W2);
    const H2 = BasePart.cm(this.params.H2);
    const W3 = BasePart.cm(this.params.W3);
    const H3 = BasePart.cm(this.params.H3);
    const t = BasePart.cm(this.params.t);
    const Rin = BasePart.cm(this.params.R_in);
    const theta = THREE.MathUtils.degToRad(this.params.A);
    const steps = Math.max(16, Math.floor(this.params.steps));

    const buildElbowLocal = (WStart, HStart, WEnd, HEnd) => {
      const ringsOuter = [];
      const ringsInner = [];
      let startFrame = null;
      let endFrame = null;

      const W_avg = (WStart + WEnd) / 2;
      const R_mid = Rin + W_avg / 2;
      const centerX = -R_mid * Math.cos(theta / 2);
      const centerZ = R_mid * Math.sin(theta / 2);

      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const angle = u * theta;
        const W = WStart + (WEnd - WStart) * u;
        const H = HStart + (HEnd - HStart) * u;
        const R_center = Rin + W / 2;
        const x = -R_center * Math.cos(angle) - centerX;
        const z = R_center * Math.sin(angle) - centerZ;
        const pathPos = new THREE.Vector3(x, 0, z);

        const tangent = new THREE.Vector3(R_center * Math.sin(angle), 0, R_center * Math.cos(angle)).normalize();
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

        if (i === 0) startFrame = { pos: pathPos.clone(), tangent: tangent.clone(), normal: normal.clone(), binormal: binormal.clone(), width: W, height: H };
        if (i === steps) endFrame = { pos: pathPos.clone(), tangent: tangent.clone(), normal: normal.clone(), binormal: binormal.clone(), width: W, height: H };

        ringsOuter.push(outerRing);
        ringsInner.push(innerRing);
      }

      return { ringsOuter, ringsInner, startFrame, endFrame };
    };

    const transformWithFrame = (rings, frame) => {
      const basis = new THREE.Matrix4().makeBasis(frame.normal.clone(), frame.binormal.clone(), frame.tangent.clone());
      const transformPoint = (v) => v.clone().applyMatrix4(basis).add(frame.pos);
      return rings.map(ring => ring.map(transformPoint));
    };

    const transformFrame = (frm, frame) => {
      const basis = new THREE.Matrix4().makeBasis(frame.normal.clone(), frame.binormal.clone(), frame.tangent.clone());
      const dir = (v) => v.clone().applyMatrix4(basis).normalize();
      return {
        pos: frm.pos.clone().applyMatrix4(basis).add(frame.pos),
        tangent: dir(frm.tangent),
        normal: dir(frm.normal),
        binormal: dir(frm.binormal),
        width: frm.width,
        height: frm.height
      };
    };

    // İlk dirsek (W2/H2 -> W1a/H1), sağ tarafta
    const totalWidth = W1b + W1a; // Toplam genişlik
    const p1a = new THREE.Vector3(totalWidth / 2 - W1a / 2, 0, 0); // Sağ tarafta W1a'nın merkezi
    const baseFrame = { pos: p1a, tangent: new THREE.Vector3(0, 0, 1), normal: new THREE.Vector3(1, 0, 0), binormal: new THREE.Vector3(0, 1, 0) };
    const elbow1Local = buildElbowLocal(W2, H2, W1a, H1);
    const elbow1RingsOuter = transformWithFrame(elbow1Local.ringsOuter, baseFrame);
    const elbow1RingsInner = transformWithFrame(elbow1Local.ringsInner, baseFrame);
    const elbow1Frames = { start: transformFrame(elbow1Local.startFrame, baseFrame), end: transformFrame(elbow1Local.endFrame, baseFrame) };

    // İkinci dirsek (W1b/H1 -> W3/H3), W1a'nın solunda başlar, aynı Z=0 noktasından
    // W1b ve W1a yan yana, aynı başlangıç düzleminde olmalı
    const p1b = new THREE.Vector3(-(totalWidth / 2 - W1b / 2), 0, 0); // Sol tarafta W1b'nin merkezi
    const t1b = new THREE.Vector3(0, 0, 1); // Z yönünde ilerler
    const n1b = new THREE.Vector3(1, 0, 0); // X yönünde normal
    const b1b = new THREE.Vector3(0, 1, 0); // Y yönünde binormal

    const elbow2FrameStart = { pos: p1b, tangent: t1b, normal: n1b, binormal: b1b };
    const elbow2Local = buildElbowLocal(W1b, H1, W3, H3);
    const elbow2RingsOuter = transformWithFrame(elbow2Local.ringsOuter, elbow2FrameStart);
    const elbow2RingsInner = transformWithFrame(elbow2Local.ringsInner, elbow2FrameStart);
    const elbow2Frames = { start: transformFrame(elbow2Local.startFrame, elbow2FrameStart), end: transformFrame(elbow2Local.endFrame, elbow2FrameStart) };

    // Tek geometriye birleştir
    const vertices = [];
    const indices = [];
    const N = 4;
    const pushRing = (ring) => ring.forEach(v => vertices.push(v.x, v.y, v.z));
    const quad = (a, b, c, d) => indices.push(a, b, c, a, c, d);

    const addElbow = (ringsOuter, ringsInner) => {
      const baseOuter = vertices.length / 3;
      ringsOuter.forEach(pushRing);
      const baseInner = vertices.length / 3;
      ringsInner.forEach(pushRing);
      for (let i = 0; i < steps; i++) {
        const b0 = baseOuter + i * N;
        const b1i = baseOuter + (i + 1) * N;
        for (let k = 0; k < N; k++) {
          const a = b0 + k;
          const b = b0 + (k + 1) % N;
          const c = b1i + (k + 1) % N;
          const d = b1i + k;
          quad(a, b, c, d);
        }
      }
      for (let i = 0; i < steps; i++) {
        const b0 = baseInner + i * N;
        const b1i = baseInner + (i + 1) * N;
        for (let k = 0; k < N; k++) {
          const a = b0 + k;
          const b = b0 + (k + 1) % N;
          const c = b1i + (k + 1) % N;
          const d = b1i + k;
          quad(d, c, b, a);
        }
      }
    };

    addElbow(elbow1RingsOuter, elbow1RingsInner);
    addElbow(elbow2RingsOuter, elbow2RingsInner);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.materials.get('metal'));
    this.scene.geometryGroup.add(mesh);

    this.mainGeometry = geometry;
    this.elbow1Rings = elbow1RingsOuter;
    this.elbow2Rings = elbow2RingsOuter;
    this.elbow1Frames = elbow1Frames;
    this.elbow2Frames = elbow2Frames;
  }

  buildFlange() {
    const W1a = BasePart.cm(this.params.W1a);
    const W1b = BasePart.cm(this.params.W1b);
    const W2 = BasePart.cm(this.params.W2);
    const W3 = BasePart.cm(this.params.W3);
    const H1 = BasePart.cm(this.params.H1);
    const H2 = BasePart.cm(this.params.H2);
    const H3 = BasePart.cm(this.params.H3);
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);

    if (!this.elbow1Frames || !this.elbow2Frames) return;

    const placeFlange = (frame, width, height, flipTangent = false) => {
      const flange = this.createFlangeRect(width, height, lip, fth);
      const tAxis = flipTangent ? frame.tangent.clone().negate() : frame.tangent.clone();
      const basis = new THREE.Matrix4().makeBasis(frame.normal.clone(), frame.binormal.clone(), tAxis.clone());
      flange.quaternion.setFromRotationMatrix(basis);
      const pos = frame.pos.clone().add(tAxis.multiplyScalar(flipTangent ? -fth * 0.5 : fth * 0.5));
      flange.position.copy(pos);
      this.scene.flangeGroup.add(flange);
    };

    // Başlangıç flanşı (ilk dirsek girişi)
    placeFlange(this.elbow1Frames.start, W2, H2, true);

    // Birleşik flanş (W1a+W1b) - sidebranch-2 ile aynı mantık
    const p1 = this.elbow1Frames.end.pos.clone();
    const t1_original = this.elbow1Frames.end.tangent.clone();
    const b1 = this.elbow1Frames.end.binormal.clone();
    const n1_original = this.elbow1Frames.end.normal.clone();

    const W_combined = W1a + W1b; // Birleşik genişlik
    const F1_combined = this.createFlangeRect(W_combined, H1, lip, fth);
    const M1_combined = new THREE.Matrix4().makeBasis(n1_original, b1, t1_original);
    F1_combined.quaternion.setFromRotationMatrix(M1_combined);

    // Flanş merkezi: p1'den W1b/2 kadar sola (negatif n1 yönünde) kaydır
    // Böylece flanş tam ortada olur: solda W1b, sağda W1a
    const flange_center = p1.clone().add(n1_original.clone().multiplyScalar(-W1b / 2));
    const F1_combined_pos = flange_center.clone().add(t1_original.clone().multiplyScalar(fth * 0.5));
    F1_combined.position.copy(F1_combined_pos);
    this.scene.flangeGroup.add(F1_combined);

    // İkinci dirsek bitiş flanşı
    placeFlange(this.elbow2Frames.end, W3, H3, false);
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
    const geometry = new THREE.BufferGeometry().setFromPoints([...collect(this.elbow1Rings), ...collect(this.elbow2Rings)]);
    const lines = new THREE.LineSegments(geometry, this.materials.get('edge'));
    this.scene.geometryGroup.add(lines);
  }

  drawDimensions() {
    const W1am = BasePart.cm(this.params.W1a);
    const W1bm = BasePart.cm(this.params.W1b);
    const W2m = BasePart.cm(this.params.W2);
    const W3m = BasePart.cm(this.params.W3);
    const H1m = BasePart.cm(this.params.H1);
    const H2m = BasePart.cm(this.params.H2);
    const H3m = BasePart.cm(this.params.H3);
    const Rin = BasePart.cm(this.params.R_in);
    const theta = THREE.MathUtils.degToRad(this.params.A);

    if (!this.elbow1Rings || !this.elbow2Rings) return;

    // İlk dirsek
    const firstRingA = this.elbow1Rings[0];
    const lastRingA = this.elbow1Rings[this.elbow1Rings.length - 1];
    const p0A = firstRingA.reduce((s, v) => s.add(v), new THREE.Vector3()).divideScalar(firstRingA.length);
    const p1A = lastRingA.reduce((s, v) => s.add(v), new THREE.Vector3()).divideScalar(lastRingA.length);
    const t0A = new THREE.Vector3(0, 0, 1);
    const b0A = new THREE.Vector3(0, 1, 0);
    const n0A = new THREE.Vector3(1, 0, 0);
    const secondLastRingA = this.elbow1Rings[this.elbow1Rings.length - 2];
    const secondLastCenterA = secondLastRingA.reduce((s, v) => s.add(v), new THREE.Vector3()).divideScalar(secondLastRingA.length);
    const t1A = new THREE.Vector3().subVectors(p1A, secondLastCenterA).normalize();
    const b1A = new THREE.Vector3(0, 1, 0);
    const n1A = new THREE.Vector3().crossVectors(b1A, t1A).normalize();

    const p0A_LB = p0A.clone().add(n0A.clone().multiplyScalar(-W2m / 2)).add(b0A.clone().multiplyScalar(-H2m / 2));
    const p0A_RB = p0A.clone().add(n0A.clone().multiplyScalar(W2m / 2)).add(b0A.clone().multiplyScalar(-H2m / 2));
    const p0A_LT = p0A.clone().add(n0A.clone().multiplyScalar(-W2m / 2)).add(b0A.clone().multiplyScalar(H2m / 2));
    this.createDimensionLine(p0A_LB, p0A_RB, b0A.clone().negate(), `W2 = ${BasePart.formatDimension(this.params.W2)} cm`, this.params.colorW2, 'W2');
    this.createDimensionLine(p0A_LB, p0A_LT, n0A.clone().negate(), `H2 = ${BasePart.formatDimension(this.params.H2)} cm`, this.params.colorH2, 'H2');

    const p1A_LB = lastRingA[0];
    const p1A_RB = lastRingA[1];
    const p1A_LT = lastRingA[3];
    this.createDimensionLine(p1A_LB, p1A_RB, b1A.clone().negate(), `W1a = ${BasePart.formatDimension(this.params.W1a)} cm`, this.params.colorW1a, 'W1a');
    this.createDimensionLine(p1A_LB, p1A_LT, n1A.clone().negate(), `H1 = ${BasePart.formatDimension(this.params.H1)} cm`, this.params.colorH1, 'H1');

    // İkinci dirsek
    const firstRingB = this.elbow2Rings[0];
    const lastRingB = this.elbow2Rings[this.elbow2Rings.length - 1];
    const p0B = firstRingB.reduce((s, v) => s.add(v), new THREE.Vector3()).divideScalar(firstRingB.length);
    const p1B = lastRingB.reduce((s, v) => s.add(v), new THREE.Vector3()).divideScalar(lastRingB.length);
    const nextRingB = this.elbow2Rings[1];
    const nextCenterB = nextRingB.reduce((s, v) => s.add(v), new THREE.Vector3()).divideScalar(nextRingB.length);
    const t0B = new THREE.Vector3().subVectors(nextCenterB, p0B).normalize();
    const b0B = new THREE.Vector3(0, 1, 0);
    const n0B = new THREE.Vector3().crossVectors(b0B, t0B).normalize();
    const secondLastRingB = this.elbow2Rings[this.elbow2Rings.length - 2];
    const secondLastCenterB = secondLastRingB.reduce((s, v) => s.add(v), new THREE.Vector3()).divideScalar(secondLastRingB.length);
    const t1B = new THREE.Vector3().subVectors(p1B, secondLastCenterB).normalize();
    const b1B = new THREE.Vector3(0, 1, 0);
    const n1B = new THREE.Vector3().crossVectors(b1B, t1B).normalize();

    const p0B_LB = p0B.clone().add(n0B.clone().multiplyScalar(-W1bm / 2)).add(b0B.clone().multiplyScalar(-H1m / 2));
    const p0B_RB = p0B.clone().add(n0B.clone().multiplyScalar(W1bm / 2)).add(b0B.clone().multiplyScalar(-H1m / 2));
    const p0B_LT = p0B.clone().add(n0B.clone().multiplyScalar(-W1bm / 2)).add(b0B.clone().multiplyScalar(H1m / 2));
    this.createDimensionLine(p0B_LB, p0B_RB, b0B.clone().negate(), `W1b = ${BasePart.formatDimension(this.params.W1b)} cm`, this.params.colorW1b, 'W1b');
    this.createDimensionLine(p0B_LB, p0B_LT, n0B.clone().negate(), `H1 = ${BasePart.formatDimension(this.params.H1)} cm`, this.params.colorH1, 'H1-second');

    const p1B_LB = lastRingB[0];
    const p1B_RB = lastRingB[1];
    const p1B_LT = lastRingB[3];
    this.createDimensionLine(p1B_LB, p1B_RB, b1B.clone().negate(), `W3 = ${BasePart.formatDimension(this.params.W3)} cm`, this.params.colorW3, 'W3');
    this.createDimensionLine(p1B_LB, p1B_LT, n1B.clone().negate(), `H3 = ${BasePart.formatDimension(this.params.H3)} cm`, this.params.colorH3, 'H3');

    // R ve A (ilk dirsek referansı)
    const headLen = BasePart.cm(this.params.arrowHeadCm);
    const radius = BasePart.cm(this.params.arrowRadiusCm);
    const innerArcCenter = new THREE.Vector3(0, 0, 0);
    const innerArcPoint = new THREE.Vector3(-Rin, 0, 0);
    const dirR = new THREE.Vector3().subVectors(innerArcPoint, innerArcCenter).normalize();
    const startR = innerArcCenter.clone().add(dirR.clone().multiplyScalar(BasePart.cm(this.params.dimOffsetCm)));
    this.addDimensionSegment(startR, innerArcPoint, this.params.colorR, this.scene.dimensionGroup, this.params.dimAlwaysOnTop);
    const arrowMat = this.materials.createDimensionArrowMaterial(this.params.colorR, this.params.dimAlwaysOnTop);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, headLen, 12), arrowMat);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirR);
    cone.position.copy(innerArcPoint);
    cone.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(cone);

    const definitions = this.getParameterDefinitions();
    const allParams = [
      ...(definitions.dimensions || []),
      ...(definitions.material || []),
      ...(definitions.view || [])
    ];
    const paramDataR = allParams.find(p => p.key === 'R_in');
    const paramDataA = allParams.find(p => p.key === 'A');

    const labelOffsetR = 0.15;
    this.scene.addLabel(`R(iç) = ${BasePart.formatDimension(this.params.R_in)} cm`,
      startR.clone().add(innerArcPoint).multiplyScalar(0.5).add(new THREE.Vector3(0, labelOffsetR, 0)), this.params.colorR, paramDataR);

    const arcPts = [];
    const segs = 48;
    const W_avg = (W1am + W2m) / 2;
    const R_mid_arc = Rin + W_avg / 2;
    for (let i = 0; i <= segs; i++) {
      const a = i / segs * theta;
      arcPts.push(new THREE.Vector3(-R_mid_arc * Math.cos(a), 0, R_mid_arc * Math.sin(a)));
    }
    const arcLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arcPts),
      new THREE.LineDashedMaterial({
        color: new THREE.Color(this.params.colorA),
        dashSize: 0.06,
        gapSize: 0.04,
        depthTest: !this.params.dimAlwaysOnTop
      })
    );
    arcLine.computeLineDistances();
    arcLine.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(arcLine);

    const midAngle = theta / 2;
    const labelOffsetA = -0.1;
    this.scene.addLabel(`A = ${this.params.A}°`,
      new THREE.Vector3(-R_mid_arc * Math.cos(midAngle) * 0.7, labelOffsetA, R_mid_arc * Math.sin(midAngle) * 0.7), this.params.colorA, paramDataA);
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
      W1a: this.params.W1a,
      W1b: this.params.W1b,
      H1: this.params.H1,
      W2: this.params.W2,
      H2: this.params.H2,
      W3: this.params.W3,
      H3: this.params.H3,
      R: this.params.R_in,
      A: this.params.A,
      t: this.params.t
    };
  }
}
