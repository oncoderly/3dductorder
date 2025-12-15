// Y-Branch Component
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class YBranch extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.name = 'Y-Branch';
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();

    this.params = {
      ...this.params,
      W1a: 40, // Center flange width (single elbow)
      H1: 25,  // Center flange height
      W2: 30,  // End flange width
      H2: 20,  // End flange height
      t: 0.12,
      R_in: 20,
      A: 90,
      steps: 100,
      colorW1a: '#007bff',
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
      dimensions: [
        { key: 'W1a', label: 'Merkez Genişlik (W1a)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
        { key: 'H1', label: 'Merkez Yükseklik (H1)', min: 10, max: 200, step: 1, unit: 'cm', default: 25 },
        { key: 'W2', label: 'Dirsek Bitiş Genişlik (W2)', min: 10, max: 200, step: 1, unit: 'cm', default: 30 },
        { key: 'H2', label: 'Dirsek Bitiş Yükseklik (H2)', min: 10, max: 200, step: 1, unit: 'cm', default: 20 },
        { key: 't', label: 'Sac Kalınlığı', min: 0.02, max: 1.0, step: 0.01, unit: 'cm', default: 0.12 },
        { key: 'R_in', label: 'İç Yarıçap', min: 1, max: 300, step: 1, unit: 'cm', default: 20 },
        { key: 'A', label: 'Açı', min: 10, max: 180, step: 1, unit: '°', default: 90 },
        { key: 'steps', label: 'Segment Sayısı', min: 16, max: 400, step: 1, unit: '', default: 100 }
      ],
      colors: [
        { key: 'colorW1a', label: 'W1a Rengi', default: '#007bff' },
        { key: 'colorH1', label: 'H1 Rengi', default: '#ffd400' },
        { key: 'colorW2', label: 'W2 Rengi', default: '#00c853' },
        { key: 'colorH2', label: 'H2 Rengi', default: '#ff8c00' },
        { key: 'colorR', label: 'R Rengi', default: '#ff1744' },
        { key: 'colorA', label: 'Açı Rengi', default: '#7e57c2' }
      ],
      // Ortak parametreler (BasePart'tan)
      ...common
    };
  }

  buildGeometry() {
    const W1a = BasePart.cm(this.params.W1a);
    const H1 = BasePart.cm(this.params.H1);
    const W2 = BasePart.cm(this.params.W2);
    const H2 = BasePart.cm(this.params.H2);
    const t = BasePart.cm(this.params.t);
    const Rin = BasePart.cm(this.params.R_in);
    const theta = THREE.MathUtils.degToRad(this.params.A);

    const steps = Math.max(16, Math.floor(this.params.steps));

    // Geometri merkezi hesabı
    const W_avg = (W1a + W2) / 2;
    const R_mid = Rin + W_avg / 2;
    const centerX = -R_mid * (Math.cos(theta / 2));
    const centerZ = R_mid * (Math.sin(theta / 2));

    // Center point (p1) - merkez nokta (iki dirseğin arasında)
    const R_center1 = Rin + W1a / 2;
    const p1 = new THREE.Vector3(-R_center1 * Math.cos(theta) - centerX, 0, R_center1 * Math.sin(theta) - centerZ);
    const t1_original = new THREE.Vector3(R_center1 * Math.sin(theta), 0, R_center1 * Math.cos(theta)).normalize();
    const b1 = new THREE.Vector3(0, 1, 0);
    const n1 = new THREE.Vector3().crossVectors(b1, t1_original).normalize();

    // ============ RIGHT ELBOW (Original direction) ============
    this.buildElbow(steps, W1a, H1, W2, H2, t, Rin, theta, centerX, centerZ, 1, 'right');

    // ============ LEFT ELBOW (Mirrored - negative centerZ) ============
    this.buildElbow(steps, W1a, H1, W2, H2, t, Rin, theta, centerX, -centerZ, -1, 'left');
  }

  buildElbow(steps, W1a, H1, W2, H2, t, Rin, theta, centerX, centerZ, direction, side) {
    // direction: 1 for right (positive n1), -1 for left (negative n1)

    // Outer and inner rings
    const ringsOuter = [];
    const ringsInner = [];

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const angle = u * theta;

      // Dimension interpolation - from W2/H2 at u=0 to W1a/H1 at u=1
      const W = W2 + (W1a - W2) * u;
      const H = H2 + (H1 - H2) * u;

      // Path position - variable radius
      const R_center = Rin + W / 2;
      const x = -R_center * Math.cos(angle) - centerX;
      const z = direction * (R_center * Math.sin(angle)) - centerZ;
      const pathPos = new THREE.Vector3(x, 0, z);

      // Tangent, normal, binormal - mirror tangent for left elbow
      const tangent = new THREE.Vector3(R_center * Math.sin(angle), 0, direction * R_center * Math.cos(angle)).normalize();
      const binormal = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

      // Debug log - first and last step only
      if (i === 0 || i === steps) {
        console.log(`[${side}] Step ${i}/${steps}:`, {
          direction,
          angle: (angle * 180 / Math.PI).toFixed(1) + '°',
          pathPos: { x: pathPos.x.toFixed(2), y: pathPos.y.toFixed(2), z: pathPos.z.toFixed(2) },
          tangent: { x: tangent.x.toFixed(3), y: tangent.y.toFixed(3), z: tangent.z.toFixed(3) },
          normal: { x: normal.x.toFixed(3), y: normal.y.toFixed(3), z: normal.z.toFixed(3) }
        });
      }

      const Wi = Math.max(W - 2 * t, 0.001);
      const Hi = Math.max(H - 2 * t, 0.001);

      // Rectangle corners - path in center, cross-section extends W/2 in both directions
      const outerRing = [
        pathPos.clone().add(normal.clone().multiplyScalar(-W / 2)).add(binormal.clone().multiplyScalar(-H / 2)),  // inner-bottom
        pathPos.clone().add(normal.clone().multiplyScalar(W / 2)).add(binormal.clone().multiplyScalar(-H / 2)),   // outer-bottom
        pathPos.clone().add(normal.clone().multiplyScalar(W / 2)).add(binormal.clone().multiplyScalar(H / 2)),    // outer-top
        pathPos.clone().add(normal.clone().multiplyScalar(-W / 2)).add(binormal.clone().multiplyScalar(H / 2))    // inner-top
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

    // Vertex and index arrays
    const vertices = [];
    const indices = [];
    const N = 4;

    const pushRing = (ring) => {
      for (const v of ring) {
        vertices.push(v.x, v.y, v.z);
      }
    };

    // Outer rings
    for (let i = 0; i <= steps; i++) pushRing(ringsOuter[i]);

    // Inner rings
    const innerBase = vertices.length / 3;
    for (let i = 0; i <= steps; i++) pushRing(ringsInner[i]);

    const quad = (a, b, c, d) => {
      indices.push(a, b, c, a, c, d);
    };

    // Outer surfaces
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

    // Inner surfaces
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

    // Create elbow geometry
    const elbowGeometry = new THREE.BufferGeometry();
    elbowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    elbowGeometry.setIndex(indices);
    elbowGeometry.computeVertexNormals();

    const elbowMesh = new THREE.Mesh(elbowGeometry, this.materials.get('metal'));
    this.scene.geometryGroup.add(elbowMesh);

    // Store references (keep only right elbow for area calculation)
    if (side === 'right') {
      this.mainGeometry = elbowGeometry;
      this.ringsOuter = ringsOuter;
    }

    // Store both elbow rings for edge drawing
    if (!this.allRingsOuter) this.allRingsOuter = [];
    this.allRingsOuter.push({ rings: ringsOuter, side: side });
  }

  buildFlange() {
    const W1a = BasePart.cm(this.params.W1a);
    const H1 = BasePart.cm(this.params.H1);
    const W2 = BasePart.cm(this.params.W2);
    const H2 = BasePart.cm(this.params.H2);
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);
    const Rin = BasePart.cm(this.params.R_in);
    const theta = THREE.MathUtils.degToRad(this.params.A);

    // buildGeometry ile aynı merkez hesabı
    const W_avg = (W1a + W2) / 2;
    const R_mid = Rin + W_avg / 2;
    const centerX = -R_mid * (Math.cos(theta / 2));
    const centerZ = R_mid * (Math.sin(theta / 2));

    // Center point (p1) - where both elbows meet at u=1 (end of elbow path)
    const R_center1 = Rin + W1a / 2;
    const p1 = new THREE.Vector3(-R_center1 * Math.cos(theta) - centerX, 0, R_center1 * Math.sin(theta) - centerZ);
    const t1 = new THREE.Vector3(R_center1 * Math.sin(theta), 0, R_center1 * Math.cos(theta)).normalize();
    const b1 = new THREE.Vector3(0, 1, 0);
    const n1_original = new THREE.Vector3().crossVectors(b1, t1).normalize();

    // TEK BİRLEŞİK FLANŞ: (2×W1a) x H1
    // Her iki dirseğin birleştiği noktada tek büyük flanş
    const W_combined = 2 * W1a; // İki dirseğin genişliği
    const F1_combined = this.createFlangeRect(W_combined, H1, lip, fth);
    const M1_combined = new THREE.Matrix4().makeBasis(n1_original, b1, t1);
    F1_combined.quaternion.setFromRotationMatrix(M1_combined);

    // Flanş merkezi p1'de (her iki dirseğin orta noktası)
    const F1_combined_pos = p1.clone().add(t1.clone().multiplyScalar(fth * 0.5));
    F1_combined.position.copy(F1_combined_pos);
    this.scene.flangeGroup.add(F1_combined);

    // Right elbow end flange (W2 x H2)
    const R_center0_right = Rin + W2 / 2;
    const p0_right = new THREE.Vector3(-R_center0_right - centerX, 0, 0 - centerZ);
    const t0_right = new THREE.Vector3(0, 0, 1);
    const n0_right = new THREE.Vector3(1, 0, 0);
    const b0_right = new THREE.Vector3(0, 1, 0);

    const F_right = this.createFlangeRect(W2, H2, lip, fth);
    const t0_right_reversed = t0_right.clone().negate();
    const M_right = new THREE.Matrix4().makeBasis(n0_right, b0_right, t0_right_reversed);
    F_right.quaternion.setFromRotationMatrix(M_right);
    const F_right_pos = p0_right.clone().add(t0_right_reversed.clone().multiplyScalar(-fth * 0.5));
    F_right.position.copy(F_right_pos);
    this.scene.flangeGroup.add(F_right);

    // Left elbow end flange (W2 x H2) - mirrored in Z axis
    const R_center0_left = Rin + W2 / 2;
    const p0_left = new THREE.Vector3(-R_center0_left - centerX, 0, 0 + centerZ); // Mirror Z
    const t0_left = new THREE.Vector3(0, 0, -1); // Reversed Z direction
    const n0_left = new THREE.Vector3(-1, 0, 0); // Mirrored normal
    const b0_left = new THREE.Vector3(0, 1, 0);

    const F_left = this.createFlangeRect(W2, H2, lip, fth);
    const t0_left_reversed = t0_left.clone().negate();
    const M_left = new THREE.Matrix4().makeBasis(n0_left, b0_left, t0_left_reversed);
    F_left.quaternion.setFromRotationMatrix(M_left);
    const F_left_pos = p0_left.clone().add(t0_left_reversed.clone().multiplyScalar(-fth * 0.5));
    F_left.position.copy(F_left_pos);
    this.scene.flangeGroup.add(F_left);
  }

  addEdges() {
    if (!this.allRingsOuter || this.allRingsOuter.length === 0) return;

    const segments = [];

    // Process both elbows
    for (const elbowData of this.allRingsOuter) {
      const rings = elbowData.rings;

      // 1. Longitudinal lines between rings (4 lines per elbow)
      for (let i = 0; i < rings.length - 1; i++) {
        const ring0 = rings[i];
        const ring1 = rings[i + 1];
        for (let k = 0; k < 4; k++) {
          segments.push(ring0[k], ring1[k]);
        }
      }

      // 2. End mouth edges (first ring of each elbow)
      const firstRing = rings[0];
      for (let k = 0; k < 4; k++) {
        segments.push(firstRing[k], firstRing[(k + 1) % 4]);
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(segments);
    const lines = new THREE.LineSegments(geometry, this.materials.get('edge'));
    this.scene.geometryGroup.add(lines);
  }

  drawDimensions() {
    const W1am = BasePart.cm(this.params.W1a);
    const H1m = BasePart.cm(this.params.H1);
    const W2m = BasePart.cm(this.params.W2);
    const H2m = BasePart.cm(this.params.H2);
    const Rin = BasePart.cm(this.params.R_in);
    const theta = THREE.MathUtils.degToRad(this.params.A);

    // buildGeometry ile aynı merkez hesabı
    const W_avg = (W1am + W2m) / 2;
    const R_mid = Rin + W_avg / 2;
    const centerX = -R_mid * (Math.cos(theta / 2));
    const centerZ = R_mid * (Math.sin(theta / 2));

    // Center point (p1)
    const R_center1 = Rin + W1am / 2;
    const p1 = new THREE.Vector3(-R_center1 * Math.cos(theta) - centerX, 0, R_center1 * Math.sin(theta) - centerZ);
    const t1 = new THREE.Vector3(R_center1 * Math.sin(theta), 0, R_center1 * Math.cos(theta)).normalize();
    const b1 = new THREE.Vector3(0, 1, 0);
    const n1 = new THREE.Vector3().crossVectors(b1, t1).normalize();

    // Right elbow end (u=0)
    const R_center0_right = Rin + W2m / 2;
    const p0_right = new THREE.Vector3(-R_center0_right - centerX, 0, 0 - centerZ);
    const t0_right = new THREE.Vector3(0, 0, 1);
    const b0_right = new THREE.Vector3(0, 1, 0);
    const n0_right = new THREE.Vector3(1, 0, 0);

    // Right elbow W2/H2 dimensions
    const p0_right_LB = p0_right.clone().add(n0_right.clone().multiplyScalar(-W2m / 2)).add(b0_right.clone().multiplyScalar(-H2m / 2));
    const p0_right_RB = p0_right.clone().add(n0_right.clone().multiplyScalar(W2m / 2)).add(b0_right.clone().multiplyScalar(-H2m / 2));
    const p0_right_LT = p0_right.clone().add(n0_right.clone().multiplyScalar(-W2m / 2)).add(b0_right.clone().multiplyScalar(H2m / 2));

    // W2: right elbow bottom edge
    this.createDimensionLine(p0_right_LB, p0_right_RB, b0_right.clone().negate(), `W2 = ${BasePart.formatDimension(this.params.W2)} cm`, this.params.colorW2, 'W2');

    // H2: right elbow left edge
    this.createDimensionLine(p0_right_LB, p0_right_LT, n0_right.clone().negate(), `H2 = ${BasePart.formatDimension(this.params.H2)} cm`, this.params.colorH2, 'H2');

    // Left elbow end (u=0) - mirrored
    const R_center0_left = Rin + W2m / 2;
    const p0_left = new THREE.Vector3(-R_center0_left - centerX, 0, 0 - centerZ);
    const t0_left = new THREE.Vector3(0, 0, 1);
    const b0_left = new THREE.Vector3(0, 1, 0);
    const n0_left = new THREE.Vector3(-1, 0, 0); // Mirrored

    // Birleşik merkez flanş ölçüleri: İKİ AYRI W1a göster (sol ve sağ dirsek için)

    // SAĞ DİRSEK W1a (sağ yarı - pozitif n1 yönünde)
    const p1a_right_left = p1.clone(); // Merkez (sağ W1a'nın sol kenarı)
    const p1a_right_right = p1.clone().add(n1.clone().multiplyScalar(W1am / 2)); // Sağ W1a'nın sağ kenarı
    const p1a_right_LB = p1a_right_left.clone().add(b1.clone().multiplyScalar(-H1m / 2));
    const p1a_right_RB = p1a_right_right.clone().add(b1.clone().multiplyScalar(-H1m / 2));

    // SAĞ W1a dimension çizgisi
    this.createDimensionLine(p1a_right_LB, p1a_right_RB, b1.clone().negate(), `W1a = ${BasePart.formatDimension(this.params.W1a)} cm`, this.params.colorW1a, 'W1a-right');

    // SOL DİRSEK W1a (sol yarı - negatif n1 yönünde)
    const p1a_left_left = p1.clone().add(n1.clone().multiplyScalar(-W1am / 2)); // Sol W1a'nın sol kenarı
    const p1a_left_right = p1.clone(); // Merkez (sol W1a'nın sağ kenarı)
    const p1a_left_LB = p1a_left_left.clone().add(b1.clone().multiplyScalar(-H1m / 2));
    const p1a_left_RB = p1a_left_right.clone().add(b1.clone().multiplyScalar(-H1m / 2));

    // SOL W1a dimension çizgisi
    this.createDimensionLine(p1a_left_LB, p1a_left_RB, b1.clone().negate(), `W1a = ${BasePart.formatDimension(this.params.W1a)} cm`, this.params.colorW1a, 'W1a-left');

    // H1: sol kenar boyunca
    const p1_left_edge = p1.clone().add(n1.clone().multiplyScalar(-W1am / 2));
    const p1_LB = p1_left_edge.clone().add(b1.clone().multiplyScalar(-H1m / 2));
    const p1_LT = p1_left_edge.clone().add(b1.clone().multiplyScalar(H1m / 2));
    this.createDimensionLine(p1_LB, p1_LT, n1.clone().negate(), `H1 = ${BasePart.formatDimension(this.params.H1)} cm`, this.params.colorH1, 'H1');

    // R(iç) yarıçapı gösterimi - gerçek iç yay üzerinde
    const innerArcCenter = new THREE.Vector3(0 - centerX, 0, 0 - centerZ);
    const innerArcPoint = new THREE.Vector3(-Rin - centerX, 0, 0 - centerZ);

    const headLen = BasePart.cm(this.params.arrowHeadCm);
    const radius = BasePart.cm(this.params.arrowRadiusCm);
    const dirR = new THREE.Vector3().subVectors(innerArcPoint, innerArcCenter).normalize();
    const startR = innerArcCenter.clone().add(dirR.clone().multiplyScalar(BasePart.cm(this.params.dimOffsetCm)));

    const lineMat = this.materials.createDimensionLineMaterial(this.params.colorR, this.params.dimAlwaysOnTop);
    const geoR = new THREE.BufferGeometry().setFromPoints([startR, innerArcPoint]);
    const lineR = new THREE.Line(geoR, lineMat);
    lineR.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(lineR);

    const arrowMat = this.materials.createDimensionArrowMaterial(this.params.colorR, this.params.dimAlwaysOnTop);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, headLen, 12), arrowMat);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirR);
    cone.position.copy(innerArcPoint);
    cone.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(cone);

    // R_in ve A parametreleri için paramData bul
    const definitions = this.getParameterDefinitions();
    const allParams = [
      ...(definitions.dimensions || []),
      ...(definitions.material || []),
      ...(definitions.view || [])
    ];
    const paramDataR = allParams.find(p => p.key === 'R_in');
    const paramDataA = allParams.find(p => p.key === 'A');

    // R(iç) etiketi
    const labelOffsetR = 0.15;
    this.scene.addLabel(`R(iç) = ${BasePart.formatDimension(this.params.R_in)} cm`,
      startR.clone().add(innerArcPoint).multiplyScalar(0.5).add(new THREE.Vector3(0, labelOffsetR, 0)), this.params.colorR, paramDataR);

    // Açı yayı - orta hat üzerinde (merkez çizgisi)
    const arcPts = [];
    const segs = 48;
    const R_mid_arc = Rin + W_avg / 2;
    for (let i = 0; i <= segs; i++) {
      const a = i / segs * theta;
      arcPts.push(new THREE.Vector3(-R_mid_arc * Math.cos(a) - centerX, 0, R_mid_arc * Math.sin(a) - centerZ));
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

    // Açı etiketi
    const midAngle = theta / 2;
    const labelOffsetA = -0.1;
    this.scene.addLabel(`A = ${this.params.A}°`,
      new THREE.Vector3(-R_mid_arc * Math.cos(midAngle) * 0.7 - centerX, labelOffsetA, R_mid_arc * Math.sin(midAngle) * 0.7 - centerZ), this.params.colorA, paramDataA);
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

    // Double the area for both elbows (we only stored one for calculation)
    return { outer: outerArea * 2 };
  }

  getDimensions() {
    return {
      W1a: this.params.W1a,
      H1: this.params.H1,
      W2: this.params.W2,
      H2: this.params.H2,
      R: this.params.R_in,
      A: this.params.A,
      t: this.params.t
    };
  }
}
