// Y-Branch 2 Component
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class YBranch2 extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.name = 'Y-Branch 2'; // Tutarlılık için isim ekle
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();

    this.params = {
      ...this.params,
      W1A: 40,
      W1B: 40,
      H1: 25,
      W2A: 30,
      W2B: 30,
      H2A: 20,
      H2B: 20,
      t: 0.12,
      R_inA: 20,
      R_inB: 20,
      A1: 90,
      A2: 90,
      steps: 100,
      colorW1: '#007bff',
      colorH1: '#ffd400',
      // ... (diğer renk parametreleri)
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
          name: 'Ölçüler',
          params: [
            { key: 'W1A', label: 'Son Genişlik A (W1A)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
            { key: 'W1B', label: 'Son Genişlik B (W1B)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
            { key: 'H1', label: 'Ortak Yükseklik (H1)', min: 10, max: 200, step: 1, unit: 'cm', default: 25 },
            { key: 'W2A', label: 'Başlangıç Genişlik A (W2A)', min: 10, max: 200, step: 1, unit: 'cm', default: 30 },
            { key: 'W2B', label: 'Başlangıç Genişlik B (W2B)', min: 10, max: 200, step: 1, unit: 'cm', default: 30 },
            { key: 'H2A', label: 'Başlangıç Yükseklik A (H2A)', min: 10, max: 200, step: 1, unit: 'cm', default: 20 },
            { key: 'H2B', label: 'Başlangıç Yükseklik B (H2B)', min: 10, max: 200, step: 1, unit: 'cm', default: 20 },
            { key: 't', label: 'Sac Kalınlığı', min: 0.02, max: 1.0, step: 0.01, unit: 'cm', default: 0.12 },
            { key: 'R_inA', label: 'İç Yarıçap A', min: 1, max: 300, step: 1, unit: 'cm', default: 20 },
            { key: 'R_inB', label: 'İç Yarıçap B', min: 1, max: 300, step: 1, unit: 'cm', default: 20 },
            { key: 'A1', label: 'Açı A', min: 10, max: 180, step: 1, unit: '°', default: 90 },
            { key: 'A2', label: 'Açı B', min: 10, max: 180, step: 1, unit: '°', default: 90 },
            { key: 'steps', label: 'Segment Sayısı', min: 16, max: 400, step: 1, unit: '', default: 100 }
          ]
        },
        {
          name: 'Görünüm',
          params: [
            ...common.view, // Ortak görünüm parametrelerini yay
            { key: 'showLocalAxes', label: 'Lokal Eksenleri Göster', type: 'checkbox', default: false } // Yeni parametre
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
        // Ortak parametre gruplarını ekle
        { name: '🔧 Flanş Ayarları', params: common.flange },
        { name: '✨ Malzeme Özellikleri', params: common.material },
        { name: '📐 Ölçülendirme Ayarları', params: common.dimension },
        { name: '📊 Alan Hesabı', params: common.area }
      ]
    };
  }

  buildGeometry() {
    const W1a = BasePart.cm(this.params.W1A);
    const W1b = BasePart.cm(this.params.W1B);
    const H1 = BasePart.cm(this.params.H1);
    const W2a = BasePart.cm(this.params.W2A);
    const W2b = BasePart.cm(this.params.W2B);
    const H2a = BasePart.cm(this.params.H2A);
    const H2b = BasePart.cm(this.params.H2B);
    const t = BasePart.cm(this.params.t);
    const RinA = BasePart.cm(this.params.R_inA);
    const RinB = BasePart.cm(this.params.R_inB);
    const thetaA = THREE.MathUtils.degToRad(this.params.A1);
    const thetaB = THREE.MathUtils.degToRad(this.params.A2);

    const steps = Math.max(16, Math.floor(this.params.steps));

    // Elbow builder per branch
    const buildElbow = (direction, sideName, W1, W2, H2, Rin, theta, centerSign = 1) => {
      const W_avg = (W1 + W2) / 2;
      const R_mid = Rin + W_avg / 2;
      const centerX = -R_mid * (Math.cos(theta / 2));
      const centerZ = centerSign * R_mid * (Math.sin(theta / 2));
      const R_center0 = Rin + W2 / 2;

      const ringsOuter = [];
      const ringsInner = [];

      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const angle = u * theta;

        // Boyut interpolasyonu
        const W = W2 + (W1 - W2) * u;
        const H = H2 + (H1 - H2) * u;

        // Path pozisyonu
        const R_center = Rin + W / 2;
        const x = -R_center * Math.cos(angle) - centerX;
        const z = R_center * Math.sin(angle) - centerZ;

        const pathPos = new THREE.Vector3(x, 0, z);

        // Tangent, normal, binormal (binormal'ı direction ile aynala)
        const tangent = new THREE.Vector3(R_center * Math.sin(angle), 0, R_center * Math.cos(angle)).normalize();
        const binormal = new THREE.Vector3(0, direction, 0); // direction ile mirror
        const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
        const Wi = Math.max(W - 2 * t, 0.001);
        const Hi = Math.max(H - 2 * t, 0.001);

        // Dikdörtgen köşeleri
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

      return { ringsOuter, ringsInner };
    };

    // İki dirsek oluştur (A: +Y, B: -Y)
    const elbow1 = buildElbow(1, 'Elbow1', W1a, W2a, H2a, RinA, thetaA, 1);
    const elbow2 = buildElbow(-1, 'Elbow2', W1b, W2b, H2b, RinB, thetaB, -1);

    // Vertex ve index dizileri
    const vertices = [];
    const indices = [];
    const N = 4;

    const pushRing = (ring) => {
      for (const v of ring) {
        vertices.push(v.x, v.y, v.z);
      }
    };

    const quad = (a, b, c, d) => {
      indices.push(a, b, c, a, c, d);
    };

    // Elbow 1 - Dış halkalar
    const elbow1OuterBase = 0;
    for (let i = 0; i <= steps; i++) pushRing(elbow1.ringsOuter[i]);

    // Elbow 1 - İç halkalar
    const elbow1InnerBase = vertices.length / 3;
    for (let i = 0; i <= steps; i++) pushRing(elbow1.ringsInner[i]);

    // Elbow 2 - Dış halkalar
    const elbow2OuterBase = vertices.length / 3;
    for (let i = 0; i <= steps; i++) pushRing(elbow2.ringsOuter[i]);

    // Elbow 2 - İç halkalar
    const elbow2InnerBase = vertices.length / 3;
    for (let i = 0; i <= steps; i++) pushRing(elbow2.ringsInner[i]);

    // Elbow 1 - Dış yüzeyler
    for (let i = 0; i < steps; i++) {
      const b0 = elbow1OuterBase + i * N;
      const b1 = elbow1OuterBase + (i + 1) * N;
      for (let k = 0; k < N; k++) {
        const a = b0 + k;
        const b = b0 + (k + 1) % N;
        const c = b1 + (k + 1) % N;
        const d = b1 + k;
        quad(a, b, c, d);
      }
    }

    // Elbow 1 - İç yüzeyler
    for (let i = 0; i < steps; i++) {
      const b0 = elbow1InnerBase + i * N;
      const b1 = elbow1InnerBase + (i + 1) * N;
      for (let k = 0; k < N; k++) {
        const a = b0 + k;
        const b = b0 + (k + 1) % N;
        const c = b1 + (k + 1) % N;
        const d = b1 + k;
        quad(d, c, b, a);
      }
    }

    // Elbow 2 - Dış yüzeyler
    for (let i = 0; i < steps; i++) {
      const b0 = elbow2OuterBase + i * N;
      const b1 = elbow2OuterBase + (i + 1) * N;
      for (let k = 0; k < N; k++) {
        const a = b0 + k;
        const b = b0 + (k + 1) % N;
        const c = b1 + (k + 1) % N;
        const d = b1 + k;
        quad(a, b, c, d);
      }
    }

    // Elbow 2 - İç yüzeyler
    for (let i = 0; i < steps; i++) {
      const b0 = elbow2InnerBase + i * N;
      const b1 = elbow2InnerBase + (i + 1) * N;
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

    // Mirror plane: end flange center (p1) and normal n1 (H1 kenarı düzlemi)
    const R_center1 = Rin + W1 / 2;
    const mirrorPoint = new THREE.Vector3(-R_center1 * Math.cos(theta) - centerX, 0, R_center1 * Math.sin(theta) - centerZ);
    const t1m = new THREE.Vector3(R_center1 * Math.sin(theta), 0, R_center1 * Math.cos(theta)).normalize();
    const b1m = new THREE.Vector3(0, 1, 0);
    const n1m = new THREE.Vector3().crossVectors(b1m, t1m).normalize();
    const mirrorNormal = n1m; // H1 düzlemi normali
    this.mirrorMatrix = this.createReflectionMatrix(mirrorPoint, mirrorNormal);
    const mirrorOffset = new THREE.Matrix4().makeTranslation(
      -mirrorNormal.x * W1,
      -mirrorNormal.y * W1,
      -mirrorNormal.z * W1
    );
    this.mirrorMatrixWithOffset = mirrorOffset.clone().multiply(this.mirrorMatrix);

    const mirroredGeometry = geometry.clone();
    mirroredGeometry.applyMatrix4(this.mirrorMatrixWithOffset || this.mirrorMatrix);
    const mirIdx = mirroredGeometry.index.array;
    for (let i = 0; i < mirIdx.length; i += 3) {
      const tmp = mirIdx[i + 1];
      mirIdx[i + 1] = mirIdx[i + 2];
      mirIdx[i + 2] = tmp;
    }
    mirroredGeometry.computeVertexNormals();

    const mirrorMesh = new THREE.Mesh(mirroredGeometry, this.materials.get('metal'));
    this.scene.geometryGroup.add(mirrorMesh);

    // Lokal eksenler yerine başlangıç flanşı köşelerinde lokal düzlemler göster
    if (this.params.showLocalAxes) {
      const R_center0 = Rin + W2 / 2;
      const p0 = new THREE.Vector3(-R_center0 - centerX, 0, 0 - centerZ);
      const n0 = new THREE.Vector3(1, 0, 0);
      const b0 = new THREE.Vector3(0, 1, 0);
      const t0 = new THREE.Vector3(0, 0, 1);
      const halfW = W2 / 2;
      const halfH = H2 / 2; // Başlangıç flanşı yüksekliği H2, yarısı H2/2

      const flangeCorners = [
        p0.clone().add(n0.clone().multiplyScalar(-halfW)).add(b0.clone().multiplyScalar(-halfH)),
        p0.clone().add(n0.clone().multiplyScalar(halfW)).add(b0.clone().multiplyScalar(-halfH)),
        p0.clone().add(n0.clone().multiplyScalar(halfW)).add(b0.clone().multiplyScalar(halfH)),
        p0.clone().add(n0.clone().multiplyScalar(-halfW)).add(b0.clone().multiplyScalar(halfH))
      ];

      flangeCorners.forEach((corner, idx) => {
        const label = `FlangeBase_C${idx + 1}`;
        // Ana düzlem (n-b)
        this.addLocalPlane(corner, n0, b0, t0, label, '#00bcd4');
        // Dik düzlem 1 (n-t)
        this.addLocalPlane(corner, n0, t0, b0, `${label}_NT`, '#ff9800');
        // Dik düzlem 2 (b-t)
        this.addLocalPlane(corner, b0, t0, n0, `${label}_BT`, '#8bc34a');
      });
    }

    this.mainGeometry = geometry;
    this.ringsOuter = elbow1.ringsOuter;
    this.elbow1Rings = elbow1.ringsOuter;
    this.elbow2Rings = elbow2.ringsOuter;
  }

  /**
   * Lokal düzlem gösterimi (eksensiz). Normal (X) ve binormal (Y) vektörleriyle hizalanmış yarı saydam kare çiz.
   */
  addLocalPlane(position, normal, binormal, tangent, labelPrefix, color = '#00bcd4') {
    const size = BasePart.cm(12); // 12 cm kare
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

    // Etiketi düzlemin kenarına taşı
    const labelPos = position.clone()
      .add(n.clone().multiplyScalar(size * 0.6))
      .add(b.clone().multiplyScalar(size * 0.6));
    this.scene.addLabel(labelPrefix, labelPos, color);
  }

  // Genel düzleme göre yansıma matrisi oluştur
  createReflectionMatrix(point, normal) {
    const n = normal.clone().normalize();
    const nx = n.x, ny = n.y, nz = n.z;
    const reflect = new THREE.Matrix4().set(
      1 - 2 * nx * nx, -2 * nx * ny,     -2 * nx * nz,     0,
      -2 * ny * nx,    1 - 2 * ny * ny,  -2 * ny * nz,     0,
      -2 * nz * nx,    -2 * nz * ny,     1 - 2 * nz * nz,  0,
      0,               0,                0,                1
    );
    const T1 = new THREE.Matrix4().makeTranslation(point.x, point.y, point.z);
    const T0 = new THREE.Matrix4().makeTranslation(-point.x, -point.y, -point.z);
    return new THREE.Matrix4().multiplyMatrices(T1, reflect).multiply(T0);
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

    // buildGeometry ile aynı merkez hesabı
    const W_avg = (W1 + W2) / 2;
    const R_mid = Rin + W_avg / 2;
    const centerX = -R_mid * (Math.cos(theta / 2));
    const centerZ = R_mid * (Math.sin(theta / 2));
    const R_center0 = Rin + W2 / 2;

    // Ortak başlangıç flanşı (u=0) - her iki dirsek için birleşik flanş
    const p0 = new THREE.Vector3(-R_center0 - centerX, 0, 0 - centerZ);
    const t0 = new THREE.Vector3(0, 0, 1);
    const n0 = new THREE.Vector3(1, 0, 0);
    const b0 = new THREE.Vector3(0, 1, 0);

    const F0 = this.createFlangeRect(W2, H2, lip, fth);
    const M0 = new THREE.Matrix4().makeBasis(n0, b0, t0);
    F0.quaternion.setFromRotationMatrix(M0);
    F0.position.copy(p0.clone().add(t0.clone().multiplyScalar(-fth * 0.5)));
    this.scene.flangeGroup.add(F0);

    // Elbow 1 bitiş flanşı (u=1, pozitif Y)
    const R_center1 = Rin + W1 / 2;
    const p1 = new THREE.Vector3(-R_center1 * Math.cos(theta) - centerX, 0, R_center1 * Math.sin(theta) - centerZ);
    const t1 = new THREE.Vector3(R_center1 * Math.sin(theta), 0, R_center1 * Math.cos(theta)).normalize();
    const b1 = new THREE.Vector3(0, 1, 0);
    const n1 = new THREE.Vector3().crossVectors(b1, t1).normalize();

    const F1 = this.createFlangeRect(W1, H1, lip, fth);
    const M1 = new THREE.Matrix4().makeBasis(n1, b1, t1);
    F1.quaternion.setFromRotationMatrix(M1);
    F1.position.copy(p1.clone().add(t1.clone().multiplyScalar(fth * 0.5)));
    this.scene.flangeGroup.add(F1);

    // Elbow 2 bitiş flanşı (u=1, negatif Y - mirror)
    const p2 = new THREE.Vector3(-R_center1 * Math.cos(theta) - centerX, 0, R_center1 * Math.sin(theta) - centerZ);
    const t2 = new THREE.Vector3(R_center1 * Math.sin(theta), 0, R_center1 * Math.cos(theta)).normalize();
    const b2 = new THREE.Vector3(0, -1, 0); // Negatif Y
    const n2 = new THREE.Vector3().crossVectors(b2, t2).normalize();

    const F2 = this.createFlangeRect(W1, H1, lip, fth);
    const M2 = new THREE.Matrix4().makeBasis(n2, b2, t2);
    F2.quaternion.setFromRotationMatrix(M2);
    F2.position.copy(p2.clone().add(t2.clone().multiplyScalar(fth * 0.5)));
    this.scene.flangeGroup.add(F2);

    const mirrorMatrix = this.mirrorMatrixWithOffset || this.mirrorMatrix || new THREE.Matrix4().identity();

    const mirrorFlange = (width, height, pos, n, b, t) => {
      const world = new THREE.Matrix4().compose(pos, new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(n, b, t)), new THREE.Vector3(1, 1, 1));
      const geomWorld = this.createFlangeRect(width, height, lip, fth).geometry.clone().applyMatrix4(world).applyMatrix4(mirrorMatrix);
      const geomEdges = new THREE.EdgesGeometry(geomWorld, 1);

      const mesh = new THREE.Mesh(geomWorld, this.materials.get('flange'));
      mesh.add(new THREE.LineSegments(geomEdges, this.materials.get('edge')));
      this.scene.flangeGroup.add(mesh);
    };

    mirrorFlange(W2, H2, p0, n0, b0, t0);
    mirrorFlange(W1, H1, p1, n1, b1, t1);
    mirrorFlange(W1, H1, p2, n2, b2, t2);
  }

  addEdges() {
    // Çeyrek daire boyunca segment çizgilerini ekle
    if (!this.ringsOuter || this.ringsOuter.length === 0) return;

    const segments = [];

    // 1. Halkalar arası uzunlamasına çizgiler (dönüş çizgileri - 4 çizgi)
    for (let i = 0; i < this.ringsOuter.length - 1; i++) {
      const ring0 = this.ringsOuter[i];
      const ring1 = this.ringsOuter[i + 1];
      for (let k = 0; k < 4; k++) {
        segments.push(ring0[k], ring1[k]);
      }
    }

    // 2. Başlangıç ağız kenarı (ilk halka)
    const firstRing = this.ringsOuter[0];
    for (let k = 0; k < 4; k++) {
      segments.push(firstRing[k], firstRing[(k + 1) % 4]);
    }

    // 3. Bitiş ağız kenarı (son halka)
    const lastRing = this.ringsOuter[this.ringsOuter.length - 1];
    for (let k = 0; k < 4; k++) {
      segments.push(lastRing[k], lastRing[(k + 1) % 4]);
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(segments);
    const lines = new THREE.LineSegments(geometry, this.materials.get('edge'));
    this.scene.geometryGroup.add(lines);
  }

  drawDimensions() {
    const W1m = BasePart.cm(this.params.W1);
    const H1m = BasePart.cm(this.params.H1);
    const W2m = BasePart.cm(this.params.W2);
    const H2m = BasePart.cm(this.params.H2);
    const Rin = BasePart.cm(this.params.R_in);
    const theta = THREE.MathUtils.degToRad(this.params.A);

    // buildGeometry ile aynı merkez hesabı
    const W_avg = (W1m + W2m) / 2;
    const R_mid = Rin + W_avg / 2;
    const centerX = -R_mid * (Math.cos(theta / 2));
    const centerZ = R_mid * (Math.sin(theta / 2));
    const R_center0 = Rin + W2m / 2;

    // Başlangıç noktası (u=0) - orta hatta
    const p0 = new THREE.Vector3(-R_center0 - centerX, 0, 0 - centerZ);

    // Bitiş noktası (u=1) - orta hatta
    const R_center1 = Rin + W1m / 2;
    const p1 = new THREE.Vector3(-R_center1 * Math.cos(theta) - centerX, 0, R_center1 * Math.sin(theta) - centerZ);

    // Başlangıç frame (u=0)
    const t0 = new THREE.Vector3(0, 0, 1);
    const b0 = new THREE.Vector3(0, 1, 0);
    const n0 = new THREE.Vector3(1, 0, 0);

    // Bitiş frame (u=1)
    const t1 = new THREE.Vector3(R_center1 * Math.sin(theta), 0, R_center1 * Math.cos(theta)).normalize();
    const b1 = new THREE.Vector3(0, 1, 0);
    const n1 = new THREE.Vector3().crossVectors(b1, t1).normalize();

    // Başlangıç ağız W2, H2 ölçüleri - orta hatta, her iki yöne uzanır
    const p0_LB = p0.clone().add(n0.clone().multiplyScalar(-W2m / 2)).add(b0.clone().multiplyScalar(-H2m / 2));  // iç-alt
    const p0_RB = p0.clone().add(n0.clone().multiplyScalar(W2m / 2)).add(b0.clone().multiplyScalar(-H2m / 2));   // dış-alt
    const p0_LT = p0.clone().add(n0.clone().multiplyScalar(-W2m / 2)).add(b0.clone().multiplyScalar(H2m / 2));   // iç-üst

    // W2: alt kenar boyunca, uzatma aşağı
    this.createDimensionLine(p0_LB, p0_RB, b0.clone().negate(), `W2 = ${BasePart.formatDimension(this.params.W2)} cm`, this.params.colorW2, 'W2');

    // H2: iç kenar boyunca, uzatma içe
    this.createDimensionLine(p0_LB, p0_LT, n0.clone().negate(), `H2 = ${BasePart.formatDimension(this.params.H2)} cm`, this.params.colorH2, 'H2');

    // Bitiş ağız W1, H1 ölçüleri - orta hatta, her iki yöne uzanır
    const p1_LB = p1.clone().add(n1.clone().multiplyScalar(-W1m / 2)).add(b1.clone().multiplyScalar(-H1m / 2));  // iç-alt
    const p1_RB = p1.clone().add(n1.clone().multiplyScalar(W1m / 2)).add(b1.clone().multiplyScalar(-H1m / 2));   // dış-alt
    const p1_LT = p1.clone().add(n1.clone().multiplyScalar(-W1m / 2)).add(b1.clone().multiplyScalar(H1m / 2));   // iç-üst

    // W1: alt kenar boyunca, uzatma aşağı
    this.createDimensionLine(p1_LB, p1_RB, b1.clone().negate(), `W1 = ${BasePart.formatDimension(this.params.W1)} cm`, this.params.colorW1, 'W1');

    // H1: iç kenar boyunca, uzatma içe
    this.createDimensionLine(p1_LB, p1_LT, n1.clone().negate(), `H1 = ${BasePart.formatDimension(this.params.H1)} cm`, this.params.colorH1, 'H1');

    // R(iç) yarıçapı gösterimi - gerçek iç yay üzerinde
    // İç yay merkezi Rin yarıçapında olmalı
    const innerArcCenter = new THREE.Vector3(0 - centerX, 0, 0 - centerZ);

    // İç yay başlangıç noktası: başlangıç ağzının iç kenarı
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

    // R_in ve A parametreleri için paramData bul (gruplu yapı uyumu)
    const definitions = this.getParameterDefinitions();
    let allParams = [];
    if (definitions.groups) {
      definitions.groups.forEach(group => {
        if (group.params) allParams.push(...group.params);
      });
    } else {
      allParams = [
        ...(definitions.dimensions || []),
        ...(definitions.material || []),
        ...(definitions.view || [])
      ];
    }
    const paramDataR = allParams.find(p => p.key === 'R_in');
    const paramDataA = allParams.find(p => p.key === 'A');

    // R(iç) etiketi - iç yay üzerinde, biraz dışa kaydırılmış
    const labelOffsetR = 0.15; // R etiketi için offset
    this.scene.addLabel(`R(iç) = ${BasePart.formatDimension(this.params.R_in)} cm`,
      startR.clone().add(innerArcPoint).multiplyScalar(0.5).add(new THREE.Vector3(0, labelOffsetR, 0)), this.params.colorR, paramDataR);

    // Açı yayı - orta hat üzerinde (merkez çizgisi)
    const arcPts = [];
    const segs = 48;
    const R_mid_arc = Rin + W_avg / 2; // Orta hat yarıçapı
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

    // Açı etiketi - orta hat üzerinde, merkeze daha yakın
    const midAngle = theta / 2;
    const labelOffsetA = -0.1; // A etiketi için offset (aşağı)
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
