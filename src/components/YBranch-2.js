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
            { key: 'W2B', label: 'Başlangıç Genişlik B (W2B)', min: 10, max: 200, step: 1, unit: 'cm', default: 30 },
            { key: 'H1A', label: 'Son Yükseklik (ortak H1)', min: 10, max: 200, step: 1, unit: 'cm', default: 25 },
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
    const H1b = H1a; // shared height
    const W2b = BasePart.cm(this.params.W2B);
    const H2b = BasePart.cm(this.params.H2B);
    const RinB = BasePart.cm(this.params.R_inB);
    const thetaB = THREE.MathUtils.degToRad(this.params.A2);

    const t = BasePart.cm(this.params.t);
    const steps = Math.max(16, Math.floor(this.params.steps));

    const buildElbow = (direction, W1, H1, W2, H2, Rin, theta, centerSign, W_ref) => {
      // W_ref: referans genişlik (merkez hesabı için sabit)
      const R_mid = Rin + W_ref / 2;
      const centerX = -R_mid * Math.cos(theta / 2);
      const centerZ = centerSign * R_mid * Math.sin(theta / 2);

      const ringsOuter = [];
      const ringsInner = [];
      let startFrame = null;
      let endFrame = null;
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

        if (i === 0) {
          startFrame = {
            pos: pathPos.clone(),
            tangent: tangent.clone(),
            normal: normal.clone(),
            binormal: binormal.clone(),
            width: W,
            height: H
          };
        }
        if (i === steps) {
          endFrame = {
            pos: pathPos.clone(),
            tangent: tangent.clone(),
            normal: normal.clone(),
            binormal: binormal.clone(),
            width: W,
            height: H
          };
        }

        ringsOuter.push(outerRing);
        ringsInner.push(innerRing);
      }

      return { ringsOuter, ringsInner, centerX, centerZ, startFrame, endFrame };
    };

    // Ortak referans genişlik: Her iki dalın başlangıç genişliğinin ortalaması
    const W_ref = (W2a + W2b) / 2;

    const elbowA = buildElbow(1, W1a, H1a, W2a, H2a, RinA, thetaA, 1, W_ref);
    const elbowB = buildElbow(-1, W1b, H1b, W2b, H2b, RinB, thetaB, -1, W_ref);

    // End plane Z alignment: A dalının SAĞ KENARI ve B dalının SOL KENARI Z=0'da buluşmalı
    const lastRingA = elbowA.ringsOuter[elbowA.ringsOuter.length - 1];
    const lastRingB = elbowB.ringsOuter[elbowB.ringsOuter.length - 1];

    // BİTİŞ YÜZEYLERİNİ HİZALA: Her iki dalın bitiş kenarları ortak noktada buluşmalı
    // A dalının sağ kenarı (max Z) ve B dalının sol kenarı (min Z) aynı Z'de olmalı
    const maxZA = Math.max(...lastRingA.map(v => v.z));  // A'nın sağ kenar Z'si
    const minZB = Math.min(...lastRingB.map(v => v.z));  // B'nin sol kenar Z'si

    // Ortak buluşma noktası: Z=0
    const TARGET_Z = 0;
    const offsetA = TARGET_Z - maxZA;  // A'nın sağ kenarını Z=0'a getir
    const offsetB = TARGET_Z - minZB;  // B'nin sol kenarını Z=0'a getir

    const shiftRings = (rings, dz) => {
      rings.forEach(r => r.forEach(v => { v.z += dz; }));
    };
    shiftRings(elbowA.ringsOuter, offsetA);
    shiftRings(elbowA.ringsInner, offsetA);
    shiftRings(elbowB.ringsOuter, offsetB);
    shiftRings(elbowB.ringsInner, offsetB);

    if (elbowA.startFrame && elbowA.endFrame) {
      elbowA.startFrame.pos.z += offsetA;
      elbowA.endFrame.pos.z += offsetA;
    }
    if (elbowB.startFrame && elbowB.endFrame) {
      elbowB.startFrame.pos.z += offsetB;
      elbowB.endFrame.pos.z += offsetB;
    }

    // --- X-EKSENİ HİZALAMA BAŞLANGICI ---
    // SABİT REFERANS YAKLAŞIMI: W1 (H1) tarafını (BİTİŞ) sabit tut
    // Flanş ve bitiş yüzeyi sabit kalmalı, W2 (H2) tarafı (BAŞLANGIÇ) değişebilir
    // R veya açı değişince sadece başlangıç tarafı hareket eder

    // Ring'lerin GERÇEK köşe pozisyonlarını kullan (frame değil!)
    const lastRingA_temp = elbowA.ringsOuter[elbowA.ringsOuter.length - 1];
    const lastRingB_temp = elbowB.ringsOuter[elbowB.ringsOuter.length - 1];

    // Her dalın bitiş X'ini ayrı hesapla
    const endMaxXA = Math.max(...lastRingA_temp.map(v => v.x));
    const endMaxXB = Math.max(...lastRingB_temp.map(v => v.x));

    // İlk hesaplamada her dalın target pozisyonunu ayrı kaydet
    if (this.targetEndXA === undefined) {
      this.targetEndXA = endMaxXA;
    }
    if (this.targetEndXB === undefined) {
      this.targetEndXB = endMaxXB;
    }

    // Her dal kendi target'ına kaydırılacak
    const dx_offsetA = this.targetEndXA - endMaxXA;
    const dx_offsetB = this.targetEndXB - endMaxXB;

    const shiftRingsX = (rings, dx) => {
        rings.forEach(r => r.forEach(v => { v.x += dx; }));
    };

    // A dalını kaydır
    if (Math.abs(dx_offsetA) > 0.0001) {
        shiftRingsX(elbowA.ringsOuter, dx_offsetA);
        shiftRingsX(elbowA.ringsInner, dx_offsetA);
        if (elbowA.startFrame) elbowA.startFrame.pos.x += dx_offsetA;
        if (elbowA.endFrame) elbowA.endFrame.pos.x += dx_offsetA;
    }

    // B dalını kaydır
    if (Math.abs(dx_offsetB) > 0.0001) {
        shiftRingsX(elbowB.ringsOuter, dx_offsetB);
        shiftRingsX(elbowB.ringsInner, dx_offsetB);
        if (elbowB.startFrame) elbowB.startFrame.pos.x += dx_offsetB;
        if (elbowB.endFrame) elbowB.endFrame.pos.x += dx_offsetB;
    }
    // --- X-EKSENİ HİZALAMA SONU ---

    // --- BİTİŞ YÜZEYİNİ DİKEY HALE GETİR (SADECE X EKSENİNDE) ---
    // Problem: Açı 90° değilse, bitiş yüzeyinin X koordinatları farklı oluyor
    // Çözüm: Sadece X koordinatlarını düzelt, Z'yi değiştirme (rotation yok!)
    const lastRingA_tilt = elbowA.ringsOuter[elbowA.ringsOuter.length - 1];
    const lastRingB_tilt = elbowB.ringsOuter[elbowB.ringsOuter.length - 1];

    console.log(`\n🔧 BİTİŞ YÜZEYİ X DÜZELTMESİ:`);

    // Branch A için X düzeltmesi
    const minXA = Math.min(...lastRingA_tilt.map(v => v.x));
    const maxXA = Math.max(...lastRingA_tilt.map(v => v.x));
    const xRangeA = maxXA - minXA;

    console.log(`  Branch A: X aralığı = ${xRangeA.toFixed(4)} (min=${minXA.toFixed(4)}, max=${maxXA.toFixed(4)})`);

    if (xRangeA > 0.001) {
      // Tüm köşeleri maxX pozisyonuna getir (sadece X'i değiştir, Z sabit kalsın!)
      console.log(`  ⚠️ Branch A X variation detected! Setting all X to ${maxXA.toFixed(4)}`);

      const xCorrection = maxXA - minXA;

      // Her ring için X düzeltmesi yap
      // Ama sadece bitiş ring'ini DEĞİL, TÜM ring'leri orantılı düzelt
      elbowA.ringsOuter.forEach((ring, ringIndex) => {
        const ratio = ringIndex / (elbowA.ringsOuter.length - 1);
        ring.forEach((v) => {
          // Son ring'e yaklaştıkça daha fazla düzelt
          v.x += xCorrection * ratio;
        });
      });
      elbowA.ringsInner.forEach((ring, ringIndex) => {
        const ratio = ringIndex / (elbowA.ringsInner.length - 1);
        ring.forEach((v) => {
          v.x += xCorrection * ratio;
        });
      });

      console.log(`  ✅ Branch A X correction applied!`);
    }

    // Branch B için X düzeltmesi
    const minXB = Math.min(...lastRingB_tilt.map(v => v.x));
    const maxXB = Math.max(...lastRingB_tilt.map(v => v.x));
    const xRangeB = maxXB - minXB;

    console.log(`  Branch B: X aralığı = ${xRangeB.toFixed(4)} (min=${minXB.toFixed(4)}, max=${maxXB.toFixed(4)})`);

    if (xRangeB > 0.001) {
      console.log(`  ⚠️ Branch B X variation detected! Setting all X to ${maxXB.toFixed(4)}`);

      const xCorrection = maxXB - minXB;

      elbowB.ringsOuter.forEach((ring, ringIndex) => {
        const ratio = ringIndex / (elbowB.ringsOuter.length - 1);
        ring.forEach((v) => {
          v.x += xCorrection * ratio;
        });
      });
      elbowB.ringsInner.forEach((ring, ringIndex) => {
        const ratio = ringIndex / (elbowB.ringsInner.length - 1);
        ring.forEach((v) => {
          v.x += xCorrection * ratio;
        });
      });

      console.log(`  ✅ Branch B X correction applied!`);
    }
    // --- BİTİŞ YÜZEYİ X DÜZELTMESİ SONU ---

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
    this.elbowAFrames = { start: elbowA.startFrame, end: elbowA.endFrame };
    this.elbowBFrames = { start: elbowB.startFrame, end: elbowB.endFrame };
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
    const W1b = BasePart.cm(this.params.W1B);
    const W2b = BasePart.cm(this.params.W2B);
    const H2b = BasePart.cm(this.params.H2B);
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);

    const framesA = this.elbowAFrames;
    const framesB = this.elbowBFrames;
    if (!framesA || !framesB || !framesA.start || !framesA.end || !framesB.start || !framesB.end) return;

    const placeFlange = (frame, width, height, flipTangent = false) => {
      const flange = this.createFlangeRect(width, height, lip, fth);
      const tAxis = flipTangent ? frame.tangent.clone().negate() : frame.tangent.clone();
      const basis = new THREE.Matrix4().makeBasis(frame.normal.clone(), frame.binormal.clone(), tAxis.clone());
      flange.quaternion.setFromRotationMatrix(basis);
      const pos = frame.pos.clone().add(tAxis.multiplyScalar(flipTangent ? -fth * 0.5 : fth * 0.5));
      flange.position.copy(pos);
      this.scene.flangeGroup.add(flange);
    };

    // Başlangıç flanşları: dirsekten dışarı bakan ters tangent ile hizala
    placeFlange(framesA.start, W2a, H2a, true);
    placeFlange(framesB.start, W2b, H2b, true);

    // A dalının bitiş yüzeyi köşeleri (son ring)
    const lastRingA = this.elbow1Rings[this.elbow1Rings.length - 1];
    // B dalının bitiş yüzeyi köşeleri (son ring)
    const lastRingB = this.elbow2Rings[this.elbow2Rings.length - 1];


    // Geometrinin gerçek Z sınırlarını bul
    const geomMinZ = Math.min(...lastRingA.map(v => v.z), ...lastRingB.map(v => v.z));
    const geomMaxZ = Math.max(...lastRingA.map(v => v.z), ...lastRingB.map(v => v.z));
    const geomCenterZ = (geomMinZ + geomMaxZ) / 2;

    // FLANŞ X POZİSYONU: Bitiş yüzeyinin EN UZAK X'i (maksimum X değeri)
    // Çünkü açılı bitişte ortalama kullanırsak flanş geometriden ayrışır
    const allEndPoints = [...lastRingA, ...lastRingB];
    const endSurfaceMaxX = Math.max(...allEndPoints.map(v => v.x));
    const endSurfaceCenterY = allEndPoints.reduce((sum, v) => sum + v.y, 0) / allEndPoints.length;

    // Flanş merkezi hesabı - BİTİŞ YÜZEYİNİN MERKEZİNDEN
    const totalWidth = W1a + W1b;
    const centerCalc = new THREE.Vector3(endSurfaceMaxX, endSurfaceCenterY, geomCenterZ);

    console.log('\n========== W1 BİTİŞ KÖŞE POZİSYONLARI (A1/A2 için) ==========');
    console.log('lastRingA köşeleri:');
    lastRingA.forEach((v, i) => {
      console.log(`  A[${i}]: X=${v.x.toFixed(4)}, Z=${v.z.toFixed(4)}`);
    });
    console.log('lastRingB köşeleri:');
    lastRingB.forEach((v, i) => {
      console.log(`  B[${i}]: X=${v.x.toFixed(4)}, Z=${v.z.toFixed(4)}`);
    });

    // Normal ve Tangent - SABİT REFERANS KULLAN (geometri sınırlarından türet)
    const refPointA = new THREE.Vector3(endSurfaceMaxX, 0, geomMinZ);
    const refPointB = new THREE.Vector3(endSurfaceMaxX, 0, geomMaxZ);
    const nAxisRaw = refPointB.clone().sub(refPointA);
    const nAxis = nAxisRaw.lengthSq() > 1e-8 ? nAxisRaw.normalize() : new THREE.Vector3(0, 0, 1);
    const bCombined = new THREE.Vector3(0, 1, 0);
    const tCombined = new THREE.Vector3().crossVectors(nAxis, bCombined);
    if (tCombined.lengthSq() < 1e-8) {
      tCombined.set(1, 0, 0);
    } else {
      tCombined.normalize();
    }

    console.log('\n🧭 FLANŞ YÖNLENDİRME:');
    console.log('  nAxis:', `(${nAxis.x.toFixed(3)}, ${nAxis.y.toFixed(3)}, ${nAxis.z.toFixed(3)})`);
    console.log('  tCombined:', `(${tCombined.x.toFixed(3)}, ${tCombined.y.toFixed(3)}, ${tCombined.z.toFixed(3)})`);

    const combinedFlange = this.createFlangeRect(W1a + W1b, H1a, lip, fth);
    const M_combined = new THREE.Matrix4().makeBasis(nAxis, bCombined, tCombined);
    combinedFlange.quaternion.setFromRotationMatrix(M_combined);

    // Flanş pozisyonu: bitiş yüzeyinden fth/2 kadar X+ yönünde
    // tCombined her zaman cross(nAxis, bCombined) = cross(Z, Y) = -X yönünde
    // Bu yüzden negatif edip pozitif X yönüne çeviriyoruz
    const tangentDirection = new THREE.Vector3(-tCombined.x, -tCombined.y, -tCombined.z);

    // Log için değeri kaydet (multiplyScalar mutate ediyor!)
    const tangentDirForLog = tangentDirection.clone();

    const flangePos = centerCalc.clone().add(tangentDirection.multiplyScalar(fth * 0.5));
    combinedFlange.position.copy(flangePos);

    console.log('\n🎯 FLANŞ FİNAL:');
    console.log('  tCombined:', `(${tCombined.x.toFixed(3)}, ${tCombined.y.toFixed(3)}, ${tCombined.z.toFixed(3)})`);
    console.log('  tangentDirection (normalized):', `(${tangentDirForLog.x.toFixed(3)}, ${tangentDirForLog.y.toFixed(3)}, ${tangentDirForLog.z.toFixed(3)})`);
    console.log('  fth:', fth.toFixed(4));
    console.log('  centerCalc:', `(${centerCalc.x.toFixed(4)}, ${centerCalc.y.toFixed(4)}, ${centerCalc.z.toFixed(4)})`);
    console.log('  flangePos:', `(${flangePos.x.toFixed(4)}, ${flangePos.y.toFixed(4)}, ${flangePos.z.toFixed(4)})`);
    console.log('  Flanş boyutu: W=' + (W1a + W1b).toFixed(4) + ', H=' + H1a.toFixed(4));
    console.log('==========================================\n');

    this.scene.flangeGroup.add(combinedFlange);
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

    // GERÇEK GEOMETRİ KÖŞE POZİSYONLARINI KULLAN (zaten kaydırılmış)
    if (!this.elbow1Rings || !this.elbow2Rings || this.elbow1Rings.length === 0 || this.elbow2Rings.length === 0) {
      console.warn('Geometri henüz oluşturulmamış, ölçüler çizilemedi.');
      return;
    }

    const W2mA = BasePart.cm(this.params.W2A);
    const H2mA = BasePart.cm(this.params.H2A);
    const H2mB = BasePart.cm(this.params.H2B);
    const RinA = BasePart.cm(this.params.R_inA);

    // GERÇEK köşelerden pozisyonları al (X ve Z kaydırmaları uygulanmış)
    const firstRingA = this.elbow1Rings[0]; // Başlangıç
    const lastRingA = this.elbow1Rings[this.elbow1Rings.length - 1]; // Bitiş

    // Başlangıç ve bitiş merkezlerini hesapla
    const p0A = firstRingA.reduce((sum, v) => sum.add(v), new THREE.Vector3()).divideScalar(firstRingA.length);
    const p1A = lastRingA.reduce((sum, v) => sum.add(v), new THREE.Vector3()).divideScalar(lastRingA.length);


    // Tangent ve normal vektörlerini gerçek köşelerden hesapla
    const t0A = new THREE.Vector3(0, 0, 1);
    const b0A = new THREE.Vector3(0, 1, 0);
    const n0A = new THREE.Vector3(1, 0, 0);

    // Bitiş frame için tangent hesapla (son iki ring arasındaki yön)
    const secondLastRingA = this.elbow1Rings[this.elbow1Rings.length - 2];
    const secondLastCenterA = secondLastRingA.reduce((sum, v) => sum.add(v), new THREE.Vector3()).divideScalar(secondLastRingA.length);
    const t1A = new THREE.Vector3().subVectors(p1A, secondLastCenterA).normalize();
    const b1A = new THREE.Vector3(0, 1, 0);
    const n1A = new THREE.Vector3().crossVectors(b1A, t1A).normalize();


    // Branch A başlangıç ölçüleri
    const p0A_LB = p0A.clone().add(n0A.clone().multiplyScalar(-W2mA / 2)).add(b0A.clone().multiplyScalar(-H2mA / 2));
    const p0A_RB = p0A.clone().add(n0A.clone().multiplyScalar(W2mA / 2)).add(b0A.clone().multiplyScalar(-H2mA / 2));
    const p0A_LT = p0A.clone().add(n0A.clone().multiplyScalar(-W2mA / 2)).add(b0A.clone().multiplyScalar(H2mA / 2));
    this.createDimensionLine(p0A_LB, p0A_RB, b0A.clone().negate(), `W2A = ${BasePart.formatDimension(this.params.W2A)} cm`, this.params.colorW2, 'W2A');
    this.createDimensionLine(p0A_LB, p0A_LT, n0A.clone().negate(), `H2A = ${BasePart.formatDimension(this.params.H2A)} cm`, this.params.colorH2, 'H2A');

    // Branch A bitiş ölçüleri - GERÇEK köşelerden al
    const p1A_LB = lastRingA[0]; // Sol alt köşe
    const p1A_RB = lastRingA[1]; // Sağ alt köşe
    const p1A_LT = lastRingA[3]; // Sol üst köşe
    this.createDimensionLine(p1A_LB, p1A_RB, b1A.clone().negate(), `W1A = ${BasePart.formatDimension(this.params.W1A)} cm`, this.params.colorW1, 'W1A');
    this.createDimensionLine(p1A_LB, p1A_LT, n1A.clone().negate(), `H1A = ${BasePart.formatDimension(this.params.H1A)} cm`, this.params.colorH1, 'H1A');

    // Branch A R çizgisi - GERÇEK geometriden hesapla
    // İlk ring'in merkezi (başlangıç noktası)
    const startCenterA = firstRingA.reduce((sum, v) => sum.add(v), new THREE.Vector3()).divideScalar(firstRingA.length);

    // İlk ring'in iç kenarı (en sol X koordinatı - sol alt ve sol üst köşelerin ortası)
    const startLeftEdgeA = Math.min(...firstRingA.map(v => v.x));
    const innerPointsA = firstRingA.filter(v => Math.abs(v.x - startLeftEdgeA) < 0.001);
    const innerArcPointA = innerPointsA.reduce((sum, v) => sum.add(v), new THREE.Vector3()).divideScalar(innerPointsA.length);

    // Dirsek yayının merkezi: iç yarıçap üzerindeki noktadan RinA kadar içeride
    const dirToInnerA = new THREE.Vector3().subVectors(innerArcPointA, startCenterA).normalize();
    const innerArcCenterA = innerArcPointA.clone().sub(dirToInnerA.clone().multiplyScalar(RinA));
    const headLen = BasePart.cm(this.params.arrowHeadCm);
    const radius = BasePart.cm(this.params.arrowRadiusCm);
    const dirRA = new THREE.Vector3().subVectors(innerArcPointA, innerArcCenterA).normalize();
    const startRA = innerArcCenterA.clone().add(dirRA.clone().multiplyScalar(BasePart.cm(this.params.dimOffsetCm)));

    this.addDimensionSegment(startRA, innerArcPointA, this.params.colorR, this.scene.dimensionGroup, this.params.dimAlwaysOnTop);

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

    // Açı yayı - GERÇEK geometriden hesapla
    const arcPtsA = [];
    const segs = 48;

    // Açı yayı: innerArcCenterA merkezli, başlangıç ve bitiş arasında
    const vecStartA = new THREE.Vector3().subVectors(startCenterA, innerArcCenterA);
    const vecEndA = new THREE.Vector3().subVectors(p1A, innerArcCenterA);
    const radiusArcA = vecStartA.length();

    // Başlangıç ve bitiş açıları (atan2 kullanarak)
    let angleStartA = Math.atan2(vecStartA.z, vecStartA.x);
    let angleEndA = Math.atan2(vecEndA.z, vecEndA.x);

    // Açı farkını doğru yönde hesapla
    let angleDiffA = angleEndA - angleStartA;
    // Açı farkı -180 ile +180 arası olmalı
    if (angleDiffA > Math.PI) angleDiffA -= 2 * Math.PI;
    if (angleDiffA < -Math.PI) angleDiffA += 2 * Math.PI;

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const angle = angleStartA + angleDiffA * t;
      const x = innerArcCenterA.x + radiusArcA * Math.cos(angle);
      const z = innerArcCenterA.z + radiusArcA * Math.sin(angle);
      arcPtsA.push(new THREE.Vector3(x, 0, z));
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
    const labelOffsetA = 0.15;
    const midAngleA = angleStartA + angleDiffA / 2;
    const labelPosA = new THREE.Vector3(
      innerArcCenterA.x + radiusArcA * 0.7 * Math.cos(midAngleA),
      labelOffsetA,
      innerArcCenterA.z + radiusArcA * 0.7 * Math.sin(midAngleA)
    );
    this.scene.addLabel(`A1 = ${this.params.A1}°`, labelPosA, this.params.colorA, paramDataA1);

    // ========== BRANCH B DIMENSIONS ==========
    const W2mB = BasePart.cm(this.params.W2B);
    // B kolu yüksekliği artık bağımsız
    const RinB = BasePart.cm(this.params.R_inB);

    // GERÇEK köşelerden pozisyonları al
    const firstRingB = this.elbow2Rings[0];
    const lastRingB = this.elbow2Rings[this.elbow2Rings.length - 1];

    const p0B = firstRingB.reduce((sum, v) => sum.add(v), new THREE.Vector3()).divideScalar(firstRingB.length);
    const p1B = lastRingB.reduce((sum, v) => sum.add(v), new THREE.Vector3()).divideScalar(lastRingB.length);

    const t0B = new THREE.Vector3(0, 0, -1);
    const b0B = new THREE.Vector3(0, 1, 0);
    const n0B = new THREE.Vector3(1, 0, 0);
    const b1B = new THREE.Vector3(0, 1, 0);

    // Branch B başlangıç ölçüleri
    const p0B_LB = p0B.clone().add(n0B.clone().multiplyScalar(-W2mB / 2)).add(b0B.clone().multiplyScalar(-H2mB / 2));
    const p0B_RB = p0B.clone().add(n0B.clone().multiplyScalar(W2mB / 2)).add(b0B.clone().multiplyScalar(-H2mB / 2));
    const p0B_LT = p0B.clone().add(n0B.clone().multiplyScalar(-W2mB / 2)).add(b0B.clone().multiplyScalar(H2mB / 2));
    this.createDimensionLine(p0B_LB, p0B_RB, b0B.clone().negate(), `W2B = ${BasePart.formatDimension(this.params.W2B)} cm`, this.params.colorW2, 'W2B');
    this.createDimensionLine(p0B_LB, p0B_LT, n0B.clone().negate(), `H2B = ${BasePart.formatDimension(this.params.H2B)} cm`, this.params.colorH2, 'H2B');
    // Branch B bitiş ölçüleri - GERÇEK köşelerden al
    const p1B_LB = lastRingB[0]; // Sol alt köşe
    const p1B_RB = lastRingB[1]; // Sağ alt köşe
    const p1B_LT = lastRingB[3]; // Sol üst köşe
    this.createDimensionLine(p1B_LB, p1B_RB, b1B.clone().negate(), `W1B = ${BasePart.formatDimension(this.params.W1B)} cm`, this.params.colorW1, 'W1B');

    // Branch B R çizgisi - GERÇEK geometriden hesapla
    const startCenterB = firstRingB.reduce((sum, v) => sum.add(v), new THREE.Vector3()).divideScalar(firstRingB.length);

    // İlk ring'in iç kenarı (en sol X koordinatı)
    const startLeftEdgeB = Math.min(...firstRingB.map(v => v.x));
    const innerPointsB = firstRingB.filter(v => Math.abs(v.x - startLeftEdgeB) < 0.001);
    const innerArcPointB = innerPointsB.reduce((sum, v) => sum.add(v), new THREE.Vector3()).divideScalar(innerPointsB.length);

    const dirToInnerB = new THREE.Vector3().subVectors(innerArcPointB, startCenterB).normalize();
    const innerArcCenterB = innerArcPointB.clone().sub(dirToInnerB.clone().multiplyScalar(RinB));
    const dirRB = new THREE.Vector3().subVectors(innerArcPointB, innerArcCenterB).normalize();
    const startRB = innerArcCenterB.clone().add(dirRB.clone().multiplyScalar(BasePart.cm(this.params.dimOffsetCm)));

    this.addDimensionSegment(startRB, innerArcPointB, this.params.colorR, this.scene.dimensionGroup, this.params.dimAlwaysOnTop);

    const arrowMatB = this.materials.createDimensionArrowMaterial(this.params.colorR, this.params.dimAlwaysOnTop);
    const coneB = new THREE.Mesh(new THREE.ConeGeometry(radius, headLen, 12), arrowMatB);
    coneB.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirRB);
    coneB.position.copy(innerArcPointB);
    coneB.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(coneB);

    const paramDataRB = allParams.find(p => p.key === 'R_inB');
    this.scene.addLabel(`R(iç)B = ${BasePart.formatDimension(this.params.R_inB)} cm`,
      startRB.clone().add(innerArcPointB).multiplyScalar(0.5).add(new THREE.Vector3(0, labelOffsetR, 0)), this.params.colorR, paramDataRB);

    // Açı yayı - GERÇEK geometriden hesapla
    const arcPtsB = [];
    const vecStartB = new THREE.Vector3().subVectors(startCenterB, innerArcCenterB);
    const vecEndB = new THREE.Vector3().subVectors(p1B, innerArcCenterB);
    const radiusArcB = vecStartB.length();

    let angleStartB = Math.atan2(vecStartB.z, vecStartB.x);
    let angleEndB = Math.atan2(vecEndB.z, vecEndB.x);

    // Açı farkını doğru yönde hesapla
    let angleDiffB = angleEndB - angleStartB;
    if (angleDiffB > Math.PI) angleDiffB -= 2 * Math.PI;
    if (angleDiffB < -Math.PI) angleDiffB += 2 * Math.PI;

    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const angle = angleStartB + angleDiffB * t;
      const x = innerArcCenterB.x + radiusArcB * Math.cos(angle);
      const z = innerArcCenterB.z + radiusArcB * Math.sin(angle);
      arcPtsB.push(new THREE.Vector3(x, 0, z));
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
    const midAngleB = angleStartB + angleDiffB / 2;
    const labelPosB = new THREE.Vector3(
      innerArcCenterB.x + radiusArcB * 0.7 * Math.cos(midAngleB),
      labelOffsetA,
      innerArcCenterB.z + radiusArcB * 0.7 * Math.sin(midAngleB)
    );
    this.scene.addLabel(`A2 = ${this.params.A2}°`, labelPosB, this.params.colorA, paramDataA2);
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
      W2B: this.params.W2B,
      H2B: this.params.H2B,
      R_inB: this.params.R_inB,
      A2: this.params.A2,
      t: this.params.t
    };
  }
}
