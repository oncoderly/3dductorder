// Side Branch 2 Component
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class SideBranch2 extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.name = 'Side Branch 2';
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();

    this.params = {
      ...this.params,
      W1a: 40, // Dirsek bitiş genişliği
      W1b: 40, // Düz kanal başlangıç genişliği
      H1: 25,
      W2: 30,
      H2: 20,
      W3: 40,
      H3: 25,
      L3: 50,
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
      colorL3: '#00ff00',
      colorR: '#ff1744',
      colorA: '#7e57c2'
    };
  }

  getParameterDefinitions() {
    const common = this.getCommonParameterDefinitions();

    return {
      dimensions: [
        { key: 'W1a', label: 'Dirsek Bitiş Genişlik (W1a)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
        { key: 'W1b', label: 'Düz Kanal Başlangıç Genişlik (W1b)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
        { key: 'H1', label: 'Ortak Yükseklik (H1)', min: 10, max: 200, step: 1, unit: 'cm', default: 25 },
        { key: 'W2', label: 'Dirsek Başlangıç Genişlik (W2)', min: 10, max: 200, step: 1, unit: 'cm', default: 30 },
        { key: 'H2', label: 'Dirsek Başlangıç Yükseklik (H2)', min: 10, max: 200, step: 1, unit: 'cm', default: 20 },
        { key: 'W3', label: 'Düz Kanal Bitiş Genişlik (W3)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
        { key: 'H3', label: 'Düz Kanal Bitiş Yükseklik (H3)', min: 10, max: 200, step: 1, unit: 'cm', default: 25 },
        { key: 'L3', label: 'Düz Kanal Uzunluk (L3)', min: 10, max: 300, step: 1, unit: 'cm', default: 50 },
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
        { key: 'colorL3', label: 'L3 Rengi', default: '#00ff00' },
        { key: 'colorR', label: 'R Rengi', default: '#ff1744' },
        { key: 'colorA', label: 'Açı Rengi', default: '#7e57c2' }
      ],
      // Ortak parametreler (BasePart'tan)
      ...common
    };
  }

  buildGeometry() {
    const W1a = BasePart.cm(this.params.W1a); // Dirsek bitiş genişliği
    const W1b = BasePart.cm(this.params.W1b); // Düz kanal başlangıç genişliği
    const H1 = BasePart.cm(this.params.H1);
    const W2 = BasePart.cm(this.params.W2);
    const H2 = BasePart.cm(this.params.H2);
    const t = BasePart.cm(this.params.t);
    const Rin = BasePart.cm(this.params.R_in);
    const theta = THREE.MathUtils.degToRad(this.params.A);

    const steps = Math.max(16, Math.floor(this.params.steps));

    // İç yay sabit Rin yarıçapında
    // Path orta hatta (Rin + W/2) - değişken yarıçaplı
    // Geometri merkezi hesabı için ortalama yarıçap (W1a ve W2 sıraları değişti ama ortalama aynı)
    const W_avg = (W1a + W2) / 2;
    const R_mid = Rin + W_avg / 2;
    const centerX = -R_mid * (Math.cos(theta / 2));
    const centerZ = R_mid * (Math.sin(theta / 2));

    // Outer ve inner rings
    const ringsOuter = [];
    const ringsInner = [];

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const angle = u * theta;

      // Boyut interpolasyonu - W1a kullan (dirsek bitiş genişliği)
      const W = W2 + (W1a - W2) * u;
      const H = H2 + (H1 - H2) * u;

      // Path pozisyonu - orta hatta (Rin + W/2 yarıçapında - DEĞİŞKEN)
      const R_center = Rin + W / 2;
      const x = -R_center * Math.cos(angle) - centerX;
      const z = R_center * Math.sin(angle) - centerZ;
      const pathPos = new THREE.Vector3(x, 0, z);

      // Tangent, normal, binormal
      const tangent = new THREE.Vector3(R_center * Math.sin(angle), 0, R_center * Math.cos(angle)).normalize();
      const binormal = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();
      const Wi = Math.max(W - 2 * t, 0.001);
      const Hi = Math.max(H - 2 * t, 0.001);

      // Dikdörtgen köşeleri - path ortada, kesit her iki yöne W/2 uzanır
      const outerRing = [
        pathPos.clone().add(normal.clone().multiplyScalar(-W / 2)).add(binormal.clone().multiplyScalar(-H / 2)),  // iç-alt
        pathPos.clone().add(normal.clone().multiplyScalar(W / 2)).add(binormal.clone().multiplyScalar(-H / 2)),   // dış-alt
        pathPos.clone().add(normal.clone().multiplyScalar(W / 2)).add(binormal.clone().multiplyScalar(H / 2)),    // dış-üst
        pathPos.clone().add(normal.clone().multiplyScalar(-W / 2)).add(binormal.clone().multiplyScalar(H / 2))    // iç-üst
      ];

      const innerRing = [
        pathPos.clone().add(normal.clone().multiplyScalar(-Wi / 2)).add(binormal.clone().multiplyScalar(-Hi / 2)),  // iç-alt
        pathPos.clone().add(normal.clone().multiplyScalar(Wi / 2)).add(binormal.clone().multiplyScalar(-Hi / 2)),   // dış-alt
        pathPos.clone().add(normal.clone().multiplyScalar(Wi / 2)).add(binormal.clone().multiplyScalar(Hi / 2)),    // dış-üst
        pathPos.clone().add(normal.clone().multiplyScalar(-Wi / 2)).add(binormal.clone().multiplyScalar(Hi / 2))    // iç-üst
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

    // Dirsek Geometry oluştur
    const elbowGeometry = new THREE.BufferGeometry();
    elbowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    elbowGeometry.setIndex(indices);
    elbowGeometry.computeVertexNormals();

    const elbowMesh = new THREE.Mesh(elbowGeometry, this.materials.get('metal'));
    this.scene.geometryGroup.add(elbowMesh);

    this.mainGeometry = elbowGeometry;
    this.ringsOuter = ringsOuter;

    // ============ DÜZ KANAL EKLEME (H1/W1b kenarından) ============
    const W3 = BasePart.cm(this.params.W3);
    const H3 = BasePart.cm(this.params.H3);
    const L3 = BasePart.cm(this.params.L3);

    // Dirsek bitiş noktası (W1a merkezinde)
    const R_center1 = Rin + W1a / 2;
    const p1 = new THREE.Vector3(-R_center1 * Math.cos(theta) - centerX, 0, R_center1 * Math.sin(theta) - centerZ);
    const t1_original = new THREE.Vector3(R_center1 * Math.sin(theta), 0, R_center1 * Math.cos(theta)).normalize();
    const b1 = new THREE.Vector3(0, 1, 0);
    const n1 = new THREE.Vector3().crossVectors(b1, t1_original).normalize();

    // Düz kanal için TERS yön (t1'in tersi)
    const t1 = t1_original.clone().negate();

    // Düz kanal başlangıç noktası: p1'den YANA KAYDIRMA (n1 yönünde NEGATIF - ters tarafa)
    const p1b = p1.clone().add(n1.clone().multiplyScalar(-(W1a / 2 + W1b / 2)));

    // Düz kanal için iki halka (başlangıç = W1b/H1, bitiş = W3/H3)
    const straightRingsOuter = [];
    const straightRingsInner = [];

    for (let i = 0; i <= 1; i++) {
      const u = i; // 0 veya 1
      const W = W1b + (W3 - W1b) * u; // W1b kullan (düz kanal başlangıç genişliği)
      const H = H1 + (H3 - H1) * u;
      const Wi = Math.max(W - 2 * t, 0.001);
      const Hi = Math.max(H - 2 * t, 0.001);

      // Pozisyon: p1b'den t1 yönünde L3 * u kadar ilerle
      const pos = p1b.clone().add(t1.clone().multiplyScalar(L3 * u));

      const outerRing = [
        pos.clone().add(n1.clone().multiplyScalar(-W / 2)).add(b1.clone().multiplyScalar(-H / 2)),  // sol-alt
        pos.clone().add(n1.clone().multiplyScalar(W / 2)).add(b1.clone().multiplyScalar(-H / 2)),   // sağ-alt
        pos.clone().add(n1.clone().multiplyScalar(W / 2)).add(b1.clone().multiplyScalar(H / 2)),    // sağ-üst
        pos.clone().add(n1.clone().multiplyScalar(-W / 2)).add(b1.clone().multiplyScalar(H / 2))    // sol-üst
      ];

      const innerRing = [
        pos.clone().add(n1.clone().multiplyScalar(-Wi / 2)).add(b1.clone().multiplyScalar(-Hi / 2)),
        pos.clone().add(n1.clone().multiplyScalar(Wi / 2)).add(b1.clone().multiplyScalar(-Hi / 2)),
        pos.clone().add(n1.clone().multiplyScalar(Wi / 2)).add(b1.clone().multiplyScalar(Hi / 2)),
        pos.clone().add(n1.clone().multiplyScalar(-Wi / 2)).add(b1.clone().multiplyScalar(Hi / 2))
      ];

      straightRingsOuter.push(outerRing);
      straightRingsInner.push(innerRing);
    }

    // Düz kanal vertex ve index dizileri
    const straightVertices = [];
    const straightIndices = [];

    // Dış halkalar
    for (let i = 0; i <= 1; i++) {
      for (const v of straightRingsOuter[i]) {
        straightVertices.push(v.x, v.y, v.z);
      }
    }

    // İç halkalar
    const straightInnerBase = straightVertices.length / 3;
    for (let i = 0; i <= 1; i++) {
      for (const v of straightRingsInner[i]) {
        straightVertices.push(v.x, v.y, v.z);
      }
    }

    // Dış yüzeyler
    for (let k = 0; k < 4; k++) {
      const a = k;
      const b = (k + 1) % 4;
      const c = 4 + (k + 1) % 4;
      const d = 4 + k;
      straightIndices.push(a, b, c, a, c, d);
    }

    // İç yüzeyler
    for (let k = 0; k < 4; k++) {
      const a = straightInnerBase + k;
      const b = straightInnerBase + (k + 1) % 4;
      const c = straightInnerBase + 4 + (k + 1) % 4;
      const d = straightInnerBase + 4 + k;
      straightIndices.push(d, c, b, d, b, a);
    }

    // Düz kanal geometry oluştur
    const straightGeometry = new THREE.BufferGeometry();
    straightGeometry.setAttribute('position', new THREE.Float32BufferAttribute(straightVertices, 3));
    straightGeometry.setIndex(straightIndices);
    straightGeometry.computeVertexNormals();

    const straightMesh = new THREE.Mesh(straightGeometry, this.materials.get('metal'));
    this.scene.geometryGroup.add(straightMesh);

    // Referansları sakla
    this.straightRingsOuter = straightRingsOuter;
  }

  buildFlange() {
    const W1a = BasePart.cm(this.params.W1a); // Dirsek bitiş genişliği
    const W1b = BasePart.cm(this.params.W1b); // Düz kanal başlangıç genişliği
    const H1 = BasePart.cm(this.params.H1);
    const W2 = BasePart.cm(this.params.W2);
    const H2 = BasePart.cm(this.params.H2);
    const W3 = BasePart.cm(this.params.W3);
    const H3 = BasePart.cm(this.params.H3);
    const L3 = BasePart.cm(this.params.L3);
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);
    const Rin = BasePart.cm(this.params.R_in);
    const theta = THREE.MathUtils.degToRad(this.params.A);

    // buildGeometry ile aynı merkez hesabı
    const W_avg = (W1a + W2) / 2;
    const R_mid = Rin + W_avg / 2;
    const centerX = -R_mid * (Math.cos(theta / 2));
    const centerZ = R_mid * (Math.sin(theta / 2));

    // Başlangıç flanşı (u=0) - orta hatta, her iki yöne W2/2 uzanır
    const R_center0 = Rin + W2 / 2;
    const p0 = new THREE.Vector3(-R_center0 - centerX, 0, 0 - centerZ);
    const t0 = new THREE.Vector3(0, 0, 1);
    const n0 = new THREE.Vector3(1, 0, 0);
    const b0 = new THREE.Vector3(0, 1, 0);

    // W2/H2 flanşı - TERS YÖN (dışa bakmalı)
    const F0 = this.createFlangeRect(W2, H2, lip, fth);
    const t0_reversed = t0.clone().negate(); // Ters yön

    console.log('=== W2/H2 FLANŞ DEBUG ===');
    console.log('p0 (dirsek başlangıç):', { x: p0.x, y: p0.y, z: p0.z });
    console.log('t0 (orijinal):', { x: t0.x, y: t0.y, z: t0.z });
    console.log('t0_reversed (ters):', { x: t0_reversed.x, y: t0_reversed.y, z: t0_reversed.z });
    console.log('n0:', { x: n0.x, y: n0.y, z: n0.z });
    console.log('b0:', { x: b0.x, y: b0.y, z: b0.z });

    const M0 = new THREE.Matrix4().makeBasis(n0, b0, t0_reversed);
    F0.quaternion.setFromRotationMatrix(M0);
    // Pozisyon: Ters yönde olduğu için -fth * 0.5 kullan
    const F0_pos = p0.clone().add(t0_reversed.clone().multiplyScalar(-fth * 0.5));
    F0.position.copy(F0_pos);
    this.scene.flangeGroup.add(F0);

    console.log('W2/H2 Flanş pozisyonu (düzeltilmiş):', { x: F0_pos.x, y: F0_pos.y, z: F0_pos.z });

    // Dirsek bitiş noktası hesaplama
    const R_center1 = Rin + W1a / 2; // W1a kullan (dirsek bitiş genişliği)
    const p1 = new THREE.Vector3(-R_center1 * Math.cos(theta) - centerX, 0, R_center1 * Math.sin(theta) - centerZ);
    const t1_original = new THREE.Vector3(R_center1 * Math.sin(theta), 0, R_center1 * Math.cos(theta)).normalize();
    const b1 = new THREE.Vector3(0, 1, 0);
    const n1_original = new THREE.Vector3().crossVectors(b1, t1_original).normalize();

    // W1a/H1 ve W1b/H1 flanşları yerine TEK BÜYÜK FLANŞ: (W1a+W1b) x H1
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

    // Düz kanal için TERS yön
    const t1 = t1_original.clone().negate();
    const n1 = n1_original.clone(); // Normal aynı kalır

    // Düz kanal başlangıç noktası: p1'den YANA KAYDIRMA (n1 yönünde NEGATIF - ters tarafa)
    const p1b = p1.clone().add(n1.clone().multiplyScalar(-(W1a / 2 + W1b / 2)));

    console.log('=== FLANŞ DEBUG ===');
    console.log('Birleşik Flanş (W1a+W1b) x H1 pozisyonu:', { x: F1_combined_pos.x, y: F1_combined_pos.y, z: F1_combined_pos.z });
    console.log('Birleşik genişlik:', W_combined);
    console.log('p1b (düz kanal başlangıcı):', { x: p1b.x, y: p1b.y, z: p1b.z });
    console.log('t1_original:', { x: t1_original.x, y: t1_original.y, z: t1_original.z });
    console.log('t1 (ters):', { x: t1.x, y: t1.y, z: t1.z });

    // Düz kanal sonundaki pozisyon
    const p3 = p1b.clone().add(t1.clone().multiplyScalar(L3));
    console.log('p3 pozisyonu:', { x: p3.x, y: p3.y, z: p3.z });

    // W3/H3 flanşı (düz kanal bitişi) - FLANŞ YÖNLENDİRMESİ TERS OLMALI
    const F3 = this.createFlangeRect(W3, H3, lip, fth);
    // Flanş için t1_original kullan (kanal ters yönde ama flanş dışa bakmalı)
    const M3 = new THREE.Matrix4().makeBasis(n1, b1, t1_original);
    F3.quaternion.setFromRotationMatrix(M3);
    // Pozisyon için ise negated t1 kullan (kanal ters yönde)
    const F3_pos = p3.clone().add(t1_original.clone().multiplyScalar(-fth * 0.5));
    F3.position.copy(F3_pos);
    this.scene.flangeGroup.add(F3);

    console.log('W3/H3 Flanş pozisyonu:', { x: F3_pos.x, y: F3_pos.y, z: F3_pos.z });
  }

  addEdges() {
    // Dirsek kenarları
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

    // 3. Dirsek bitiş ağız kenarı - DÜZ KANAL BAŞLADIĞI İÇİN ATLA

    // Düz kanal kenarları
    if (this.straightRingsOuter && this.straightRingsOuter.length === 2) {
      const straight0 = this.straightRingsOuter[0];
      const straight1 = this.straightRingsOuter[1];

      // Uzunlamasına çizgiler
      for (let k = 0; k < 4; k++) {
        segments.push(straight0[k], straight1[k]);
      }

      // Bitiş ağız kenarı (son halka)
      for (let k = 0; k < 4; k++) {
        segments.push(straight1[k], straight1[(k + 1) % 4]);
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(segments);
    const lines = new THREE.LineSegments(geometry, this.materials.get('edge'));
    this.scene.geometryGroup.add(lines);
  }

  drawDimensions() {
    const W1am = BasePart.cm(this.params.W1a); // Dirsek bitiş genişliği
    const W1bm = BasePart.cm(this.params.W1b); // Düz kanal başlangıç genişliği
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

    // Başlangıç noktası (u=0) - orta hatta
    const R_center0 = Rin + W2m / 2;
    const p0 = new THREE.Vector3(-R_center0 - centerX, 0, 0 - centerZ);

    // Bitiş noktası (u=1) - orta hatta - W1a kullan (dirsek bitiş genişliği)
    const R_center1 = Rin + W1am / 2;
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

    // Birleşik flanş ölçüleri: W1a ve W1b ayrı ayrı göster
    // Düz kanal başlangıç noktası hesapla (ölçüler için)
    const p1b_dim = p1.clone().add(n1.clone().multiplyScalar(-(W1am / 2 + W1bm / 2)));

    // W1b kısmı (sol taraf - düz kanal tarafı)
    // Düz kanalın sol kenarı
    const p1b_left = p1b_dim.clone().add(n1.clone().multiplyScalar(-W1bm / 2));
    // Düz kanalın sağ kenarı (dirsekle birleşim noktası)
    const p1b_right = p1b_dim.clone().add(n1.clone().multiplyScalar(W1bm / 2));
    const p1b_LB = p1b_left.clone().add(b1.clone().multiplyScalar(-H1m / 2));   // sol-alt
    const p1b_RB = p1b_right.clone().add(b1.clone().multiplyScalar(-H1m / 2)); // sağ-alt

    // W1b: düz kanal tarafı genişlik
    this.createDimensionLine(p1b_LB, p1b_RB, b1.clone().negate(), `W1b = ${BasePart.formatDimension(this.params.W1b)} cm`, this.params.colorW1b, 'W1b');

    // W1a kısmı (sağ taraf - dirsek tarafı)
    // p1 dirsek bitiş noktası (merkezi)
    const p1a_left = p1.clone().add(n1.clone().multiplyScalar(-W1am / 2));  // Dirsek sol kenarı (birleşim noktası)
    const p1a_right = p1.clone().add(n1.clone().multiplyScalar(W1am / 2)); // Dirsek sağ kenarı
    const p1a_LB = p1a_left.clone().add(b1.clone().multiplyScalar(-H1m / 2)); // sol-alt
    const p1a_RB = p1a_right.clone().add(b1.clone().multiplyScalar(-H1m / 2));  // sağ-alt

    // W1a: dirsek tarafı genişlik
    this.createDimensionLine(p1a_LB, p1a_RB, b1.clone().negate(), `W1a = ${BasePart.formatDimension(this.params.W1a)} cm`, this.params.colorW1a, 'W1a');

    // H1: sol kenar boyunca (düz kanalın sol kenarı), uzatma içe
    const p1_LT = p1b_left.clone().add(b1.clone().multiplyScalar(H1m / 2));  // sol-üst
    this.createDimensionLine(p1b_LB, p1_LT, n1.clone().negate(), `H1 = ${BasePart.formatDimension(this.params.H1)} cm`, this.params.colorH1, 'H1');

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

   // R_in ve A parametreleri için paramData bul
    const definitions = this.getParameterDefinitions();
    const allParams = [
      ...(definitions.dimensions || []),
      ...(definitions.material || []),
      ...(definitions.view || [])
    ];
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

    // ============ DÜZ KANAL ÖLÇÜLERİ (W1b, W3, H3, L3) ============
    const W3m = BasePart.cm(this.params.W3);
    const H3m = BasePart.cm(this.params.H3);
    const L3m = BasePart.cm(this.params.L3);

    // Ters yön için t1'i yeniden hesapla
    const t1_straight = t1.clone().negate();

    // Düz kanal başlangıç noktası: p1'den YANA KAYDIRMA (n1 yönünde NEGATIF - ters tarafa)
    const p1b = p1.clone().add(n1.clone().multiplyScalar(-(W1am / 2 + W1bm / 2)));

    // W1b ölçü çizgisi KALDIRILDI - Artık birleşik W(1a+1b) ölçüsü var

    // Düz kanal bitiş pozisyonu (p3) - p1b'den başla
    const p3 = p1b.clone().add(t1_straight.clone().multiplyScalar(L3m));

    // Düz kanal bitiş köşeleri
    const p3_LB = p3.clone().add(n1.clone().multiplyScalar(-W3m / 2)).add(b1.clone().multiplyScalar(-H3m / 2));  // sol-alt
    const p3_RB = p3.clone().add(n1.clone().multiplyScalar(W3m / 2)).add(b1.clone().multiplyScalar(-H3m / 2));   // sağ-alt
    const p3_LT = p3.clone().add(n1.clone().multiplyScalar(-W3m / 2)).add(b1.clone().multiplyScalar(H3m / 2));   // sol-üst

    // W3: bitiş ağzında alt kenar
    this.createDimensionLine(p3_LB, p3_RB, b1.clone().negate(), `W3 = ${BasePart.formatDimension(this.params.W3)} cm`, this.params.colorW3, 'W3');

    // H3: bitiş ağzında sol kenar
    this.createDimensionLine(p3_LB, p3_LT, n1.clone().negate(), `H3 = ${BasePart.formatDimension(this.params.H3)} cm`, this.params.colorH3, 'H3');

    // L3: İKİ FLANŞ ARASI DİK MESAFE (p1b'den p3'e t1_straight yönünde)
    // Uzatma yönü: yukarı (b1 yönünde)
    this.createDimensionLine(
      p1b.clone(),  // W1b/H1 flanş merkezi (düz kanal başlangıcı)
      p3.clone(),   // W3/H3 flanş merkezi (düz kanal bitişi)
      b1.clone(),   // uzatma yönü: yukarı
      `L3 = ${BasePart.formatDimension(this.params.L3)} cm`,
      this.params.colorL3,
      'L3'
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
      W1a: this.params.W1a,
      W1b: this.params.W1b,
      H1: this.params.H1,
      W2: this.params.W2,
      H2: this.params.H2,
      W3: this.params.W3,
      H3: this.params.H3,
      L3: this.params.L3,
      R: this.params.R_in,
      A: this.params.A,
      t: this.params.t
    };
  }
}
