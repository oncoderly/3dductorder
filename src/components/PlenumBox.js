// Plenum Box Component - Çoklu Yüz Manşonları
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class PlenumBox extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.dimsToDraw = [];
    this.initParams();
  }

  // PlenumBox için özel rotated gruplar oluştur
  setupRotatedGroups() {
    // Önceki grupları temizle
    if (this.rotatedGeometryGroup) {
      this.scene.geometryGroup.remove(this.rotatedGeometryGroup);
    }
    if (this.rotatedFlangeGroup) {
      this.scene.flangeGroup.remove(this.rotatedFlangeGroup);
    }
    if (this.rotatedDimensionGroup) {
      this.scene.dimensionGroup.remove(this.rotatedDimensionGroup);
    }

    // Yeni gruplar oluştur
    this.rotatedGeometryGroup = new THREE.Group();
    this.rotatedGeometryGroup.rotation.x = Math.PI / 2;
    this.scene.geometryGroup.add(this.rotatedGeometryGroup);

    this.rotatedFlangeGroup = new THREE.Group();
    this.rotatedFlangeGroup.rotation.x = Math.PI / 2;
    this.scene.flangeGroup.add(this.rotatedFlangeGroup);

    this.rotatedDimensionGroup = new THREE.Group();
    this.rotatedDimensionGroup.rotation.x = Math.PI / 2;
    this.scene.dimensionGroup.add(this.rotatedDimensionGroup);
  }

  initParams() {
    super.initDefaultParams();

    this.params = {
      ...this.params,
      W1: 100,
      H1: 80,
      L: 120,
      Phi: 60,
      spigotLenCm: 10,
      t: 0.12,
      steps: 80,
      colorW1: '#3ea2ff',
      colorH1: '#ffd400',
      colorL: '#00bcd4',
      colorPhi: '#00c853',
      showSideLabels: true,
      faces: {
        right: { count: 1, ports: [{ diam: 60 }] },
        left: { count: 0, ports: [] },
        front: { count: 0, ports: [] },
        back: { count: 0, ports: [] },
        top: { count: 0, ports: [] }
      }
    };
  }

  getParameterDefinitions() {
    return {
      dimensions: [
        { key: 'W1', label: 'Genişlik (W)', min: 10, max: 400, step: 0.1, unit: 'cm', default: 100 },
        { key: 'H1', label: 'Yükseklik (H)', min: 10, max: 400, step: 0.1, unit: 'cm', default: 80 },
        { key: 'L', label: 'Derinlik (L)', min: 10, max: 1000, step: 0.1, unit: 'cm', default: 120 },
        { key: 'Phi', label: 'Ø varsayılan', min: 10, max: 400, step: 0.1, unit: 'cm', default: 60 },
        { key: 'spigotLenCm', label: 'Manşon Uzunluğu', min: 1, max: 100, step: 0.1, unit: 'cm', default: 10 },
        { key: 't', label: 'Sac Kalınlığı', min: 0.02, max: 1.0, step: 0.01, unit: 'cm', default: 0.12 },
        { key: 'steps', label: 'Segment Sayısı', min: 8, max: 400, step: 1, unit: '', default: 80 }
      ],
      faces: [
        { key: 'right', label: 'Sağ Yüz' },
        { key: 'left', label: 'Sol Yüz' },
        { key: 'front', label: 'Ön Yüz' },
        { key: 'back', label: 'Arka Yüz' },
        { key: 'top', label: 'Üst Yüz' }
      ],
      view: [
        { key: 'showEdges', label: 'Kenar Çizgileri', type: 'checkbox' },
        { key: 'showDims', label: 'Ölçülendirme', type: 'checkbox' },
        { key: 'showFlange', label: 'Flanşları Göster', type: 'checkbox' },
        { key: 'showSideLabels', label: 'Yüz Etiketleri', type: 'checkbox' }
      ],
      colors: [
        { key: 'colorW1', label: 'W Rengi', default: '#3ea2ff' },
        { key: 'colorH1', label: 'H Rengi', default: '#ffd400' },
        { key: 'colorL', label: 'L Rengi', default: '#00bcd4' },
        { key: 'colorPhi', label: 'Ø Rengi', default: '#00c853' }
      ]
    };
  }

  // Her yüz için port sayısını güncelle
  ensureFacePorts(faceKey, count) {
    const face = this.params.faces[faceKey];
    if (!face) return;

    if (!Array.isArray(face.ports)) face.ports = [];

    // Port sayısını ayarla
    while (face.ports.length < count) {
      face.ports.push({ diam: this.params.Phi });
    }
    if (face.ports.length > count) {
      face.ports.length = count;
    }
    face.count = count;
  }

  buildGeometry() {
    // Rotated grupları her rebuild'de yeniden oluştur
    this.setupRotatedGroups();

    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const L = BasePart.cm(this.params.L);
    const t = BasePart.cm(this.params.t);

    const steps = Math.max(8, Math.floor(this.params.steps));
    const N = 4;

    // Dikdörtgen köşeler (üst kenar W1×H1 y=0'da, alt kenar y=-H1'de)
    const rectO = [
      new THREE.Vector3(-W1 / 2, 0, 0),      // sol üst
      new THREE.Vector3(W1 / 2, 0, 0),       // sağ üst
      new THREE.Vector3(W1 / 2, -H1, 0),     // sağ alt
      new THREE.Vector3(-W1 / 2, -H1, 0)     // sol alt
    ];

    const rectI = [
      new THREE.Vector3(-W1 / 2 + t, -t, 0),
      new THREE.Vector3(W1 / 2 - t, -t, 0),
      new THREE.Vector3(W1 / 2 - t, -H1 + t, 0),
      new THREE.Vector3(-W1 / 2 + t, -H1 + t, 0)
    ];

    const vertices = [];
    const indices = [];
    const ringsOuter = [];
    const ringsInner = [];

    // Z ekseni boyunca halkalar (merkezde)
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const z = (u - 0.5) * L; // Merkezi 0'a kaydır

      const outer = [];
      const inner = [];

      for (let k = 0; k < N; k++) {
        const po = rectO[k].clone();
        po.z = z;
        const pi = rectI[k].clone();
        pi.z = z;

        outer.push(po);
        inner.push(pi);
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

    for (let i = 0; i <= steps; i++) pushRing(ringsOuter[i]);
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

    // Ana gövde mesh'i
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.materials.get('metal'));
    this.rotatedGeometryGroup.add(mesh);

    // Arka kapak (merkezde)
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(W1, H1),
      this.materials.get('metal')
    );
    back.position.set(0, -H1 / 2, -L / 2);
    this.rotatedGeometryGroup.add(back);

    this.mainGeometry = geometry;
    this.ringsOuter = ringsOuter;
    this.backPlane = back.geometry;
  }

  buildFlange() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const L = BasePart.cm(this.params.L);
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);

    // Bitiş flanşı (merkezde)
    const F = this.createFlangeRect(W1, H1, lip, fth);
    F.position.set(0, -H1 / 2, L / 2 + fth * 0.5);
    this.rotatedFlangeGroup.add(F);

    // Manşonları ekle
    this.buildSpigots();
  }

  buildSpigots() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const L = BasePart.cm(this.params.L);
    const t = BasePart.cm(this.params.t);
    const len = BasePart.cm(this.params.spigotLenCm);

    this.dimsToDraw = [];

    // Yüz tanımları (merkezde)
    const faceDefs = {
      right: { n: new THREE.Vector3(1, 0, 0), v: new THREE.Vector3(0, 1, 0), span: H1, base: new THREE.Vector3(W1 / 2, -H1 / 2, 0) },
      left: { n: new THREE.Vector3(-1, 0, 0), v: new THREE.Vector3(0, 1, 0), span: H1, base: new THREE.Vector3(-W1 / 2, -H1 / 2, 0) },
      front: { n: new THREE.Vector3(0, 0, 1), v: new THREE.Vector3(1, 0, 0), span: W1, base: new THREE.Vector3(0, -H1 / 2, L / 2) },
      back: { n: new THREE.Vector3(0, 0, -1), v: new THREE.Vector3(1, 0, 0), span: W1, base: new THREE.Vector3(0, -H1 / 2, -L / 2) },
      top: { n: new THREE.Vector3(0, 1, 0), v: new THREE.Vector3(1, 0, 0), span: W1, base: new THREE.Vector3(0, 0, 0) },
      bottom: { n: new THREE.Vector3(0, -1, 0), v: new THREE.Vector3(1, 0, 0), span: W1, base: new THREE.Vector3(0, -H1, 0) }
    };

    // Yüz eşleştirme (HTML'deki gibi)
    const mapFace = { right: 'right', left: 'left', front: 'bottom', back: 'top', top: 'back' };

    // Her yüz için manşonları ekle
    for (const key of ['right', 'left', 'front', 'back', 'top']) {
      const face = this.params.faces[key];
      if (!face || !face.count || face.count === 0) continue;

      const targetDef = faceDefs[mapFace[key]];
      const diamList = face.ports.map(p => Number(p.diam) || this.params.Phi);

      this.addPortsOnFace(key, targetDef, diamList, t, len);
    }
  }

  addPortsOnFace(key, fdef, diamList, t, len) {
    if (!diamList || diamList.length === 0) return;

    const n = fdef.n.clone().normalize();
    const v = fdef.v.clone().normalize();

    // Silindir ve halka için quaternion'lar
    const qCyl = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    const qRing = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);

    const Dm = diamList.map(d => BasePart.cm(d));
    const sumDm = Dm.reduce((a, b) => a + b, 0);
    const span = fdef.span;

    // Boşluk hesaplama
    const gap = Math.max(0, (span - sumDm) / (Dm.length + 1));

    let acc = 0;
    for (let i = 0; i < Dm.length; i++) {
      const D = Dm[i];
      const r = Math.max(D / 2, 1e-5);

      const off = -span / 2 + gap + r + acc;
      acc += D + gap;

      const center = fdef.base.clone().add(v.clone().multiplyScalar(off));

      // Silindir (manşon)
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, len, 48, 1, true),
        this.materials.get('metal')
      );
      tube.quaternion.copy(qCyl);
      tube.position.copy(center.clone().add(n.clone().multiplyScalar(len / 2)));
      this.rotatedFlangeGroup.add(tube);

      // Halka (kenar)
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(Math.max(r - t, 1e-5), r, 48),
        this.materials.get('metal')
      );
      ring.quaternion.copy(qRing);
      ring.position.copy(center.clone().add(n.clone().multiplyScalar(0.0005)));
      this.rotatedFlangeGroup.add(ring);

      // Delik (siyah kapama)
      const hole = new THREE.Mesh(
        new THREE.CircleGeometry(r * 0.999, 48),
        new THREE.MeshBasicMaterial({ color: 0x0b0e12, side: THREE.DoubleSide })
      );
      hole.quaternion.copy(qRing);
      hole.position.copy(center.clone().add(n.clone().multiplyScalar(0.00025)));
      this.rotatedFlangeGroup.add(hole);

      // Ø ölçüsü için noktalar
      const pA = center.clone().add(v.clone().multiplyScalar(-r));
      const pB = center.clone().add(v.clone().multiplyScalar(r));
      this.dimsToDraw.push({
        pA: pA,
        pB: pB,
        off: n.clone(),
        text: `Ø = ${(D * 100).toFixed(1)} cm`
      });
    }
  }

  addEdges() {
    if (this.mainGeometry) {
      const edges1 = new THREE.LineSegments(
        new THREE.EdgesGeometry(this.mainGeometry, 1),
        this.materials.get('edge')
      );
      this.rotatedGeometryGroup.add(edges1);
    }

    if (this.backPlane) {
      const edges2 = new THREE.LineSegments(
        new THREE.EdgesGeometry(this.backPlane),
        this.materials.get('edge')
      );
      this.rotatedGeometryGroup.add(edges2);
    }
  }

  // PlenumBox için dimension line override - rotatedDimensionGroup kullan
  createDimensionLine(p1, p2, offsetDir, label, color) {
    const n = offsetDir.clone().normalize();
    const gap = BasePart.cm(this.params.extGapCm);
    const targetOff = this.params.dimFixedOffset
      ? BasePart.cm(this.params.dimPlaneOffsetCm)
      : (gap + BasePart.cm(this.params.extLenCm));

    const s1 = p1.clone().add(n.clone().multiplyScalar(gap));
    const e1 = p1.clone().add(n.clone().multiplyScalar(targetOff));
    const s2 = p2.clone().add(n.clone().multiplyScalar(gap));
    const e2 = p2.clone().add(n.clone().multiplyScalar(targetOff));

    const mat = this.materials.createDimensionLineMaterial(color, this.params.dimAlwaysOnTop);

    const L1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([s1, e1]), mat);
    const L2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([s2, e2]), mat);

    L1.renderOrder = L2.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;

    // rotatedDimensionGroup'a ekle
    this.rotatedDimensionGroup.add(L1, L2);

    const head = BasePart.cm(this.params.arrowHeadCm);
    const rad = BasePart.cm(this.params.arrowRadiusCm);
    const dir = new THREE.Vector3().subVectors(e2, e1).normalize();
    const off = BasePart.cm(this.params.dimOffsetCm);

    const a1 = e1.clone().add(dir.clone().multiplyScalar(off));
    const a2 = e2.clone().add(dir.clone().multiplyScalar(-off));

    this.createArrowForDimension(a1, a2, color, head, rad);

    // Label pozisyonunu rotated space'den world space'e transform et
    const midRotated = a1.clone().add(a2).multiplyScalar(0.5).add(n.clone().multiplyScalar(BasePart.cm(this.params.labelOffsetCm)));
    const midWorld = new THREE.Vector3(midRotated.x, -midRotated.z, midRotated.y);

    return this.scene.addLabel(label, midWorld, color);
  }

  createArrowForDimension(p1, p2, color, head, rad) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([p1, p2]),
      this.materials.createDimensionLineMaterial(color, this.params.dimAlwaysOnTop)
    );
    line.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;

    const dir = new THREE.Vector3().subVectors(p2, p1).normalize();

    const makeCone = (q, p) => {
      const c = new THREE.Mesh(
        new THREE.ConeGeometry(rad, head, 12),
        new THREE.MeshBasicMaterial({
          color: color,
          depthTest: !this.params.dimAlwaysOnTop,
          depthWrite: !this.params.dimAlwaysOnTop,
          transparent: this.params.dimAlwaysOnTop
        })
      );
      c.quaternion.copy(q);
      c.position.copy(p);
      c.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
      return c;
    };

    const q2 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const q1 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().negate());

    // rotatedDimensionGroup'a ekle
    this.rotatedDimensionGroup.add(line, makeCone(q2, p2), makeCone(q1, p1));
  }

  drawDimensions() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const L = BasePart.cm(this.params.L);

    // Koordinat vektörleri (rotated space - HTML'deki gibi)
    const nX = new THREE.Vector3(1, 0, 0);
    const nY = new THREE.Vector3(0, 1, 0);
    const nZ = new THREE.Vector3(0, 0, 1);

    const p1 = new THREE.Vector3(0, -H1 / 2, L / 2);

    // Köşe vektörleri (üst kenar y=0, alt kenar y=-H1)
    const xL = nX.clone().multiplyScalar(-W1 / 2);
    const xR = nX.clone().multiplyScalar(W1 / 2);
    const yT = nY.clone().multiplyScalar(H1 / 2);  // y=0
    const yB = nY.clone().multiplyScalar(-H1 / 2); // y=-H1

    this.createDimensionLine(
      p1.clone().add(xL).add(yT),
      p1.clone().add(xR).add(yT),
      nY,
      `W1 = ${this.params.W1.toFixed(1)} cm`,
      this.params.colorW1
    );

    // H1 boyutu (sağda)
    this.createDimensionLine(
      p1.clone().add(xR).add(yB),
      p1.clone().add(xR).add(yT),
      nX,
      `H1 = ${this.params.H1.toFixed(1)} cm`,
      this.params.colorH1
    );

    // L boyutu (sol alt kenar, merkezde)
    this.createDimensionLine(
      new THREE.Vector3(-W1 / 2, 0, -L / 2),
      new THREE.Vector3(-W1 / 2, 0, L / 2),
      nX.clone().negate(),
      `L = ${this.params.L.toFixed(1)} cm`,
      this.params.colorL
    );

    // Ø ölçüleri (manşonlar)
    this.dimsToDraw.forEach(d => {
      this.createDimensionLine(d.pA, d.pB, d.off, d.text, this.params.colorPhi);
    });

    // Yüz etiketleri - yüzeye yapışık 3D mesh etiketler (alt kenar y=0)
    if (this.params.showSideLabels) {
      const widthCm = 30; // Etiket genişliği (cm cinsinden)

      const faceLabels = [
        { text: 'SAĞ', base: new THREE.Vector3(W1 / 2, -H1 / 2, 0), normal: new THREE.Vector3(1, 0, 0) },
        { text: 'SOL', base: new THREE.Vector3(-W1 / 2, -H1 / 2, 0), normal: new THREE.Vector3(-1, 0, 0) },
        { text: 'ALT', base: new THREE.Vector3(0, -H1 / 2, L / 2), normal: new THREE.Vector3(0, 0, 1) },
        { text: 'ÖN', base: new THREE.Vector3(0, -H1, 0), normal: new THREE.Vector3(0, -1, 0) },
        { text: 'ÜST', base: new THREE.Vector3(0, -H1 / 2, -L / 2), normal: new THREE.Vector3(0, 0, -1) },
        { text: 'ARKA', base: new THREE.Vector3(0, 0, 0), normal: new THREE.Vector3(0, 1, 0) }
      ];

      faceLabels.forEach(label => {
        this.addFaceTag(label.text, label.base, label.normal, widthCm, '#ff6');
      });
    }
  }

  // Canvas kullanarak 3D metin düzlemi oluştur (yüzeye yapışık etiket için)
  makeTextPlane(text, widthCm, color = '#ff6') {
    const pad = 20;
    const font = 64;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Metin boyutunu ölç
    ctx.font = `700 ${font}px system-ui`;
    const textWidth = ctx.measureText(text).width;
    const textHeight = font * 1.4;

    canvas.width = Math.ceil(textWidth) + pad * 2;
    canvas.height = Math.ceil(textHeight) + pad * 2;

    // Yeniden font ayarla (canvas boyutu değişti)
    ctx.font = `700 ${font}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Yuvarlatılmış arka plan
    const r = 16;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = 'rgba(18, 24, 34, 0.9)';
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    // Kenarlık
    ctx.strokeStyle = 'rgba(57, 65, 79, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Metin
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2);

    // Texture oluştur
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 4;

    // Plane geometrisi
    const aspect = w / h;
    const W = BasePart.cm(widthCm);
    const H = W / aspect;

    const geometry = new THREE.PlaneGeometry(W, H);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: true
    });

    return new THREE.Mesh(geometry, material);
  }

  // Yüz etiketini yüzeye yapışık olarak ekle
  addFaceTag(text, base, normal, widthCm, color) {
    const mesh = this.makeTextPlane(text, widthCm, color);

    // Epsilon - yüzeyden mesafe (eğimli yüzeylerde tamamen görünmesi için)
    const eps = 0.025;

    // Pozisyon: rotated space'de base + normal * eps
    const posRotated = base.clone().add(normal.clone().normalize().multiplyScalar(eps));
    mesh.position.copy(posRotated);

    // Quaternion: mesh'i normal yönüne döndür (z ekseni normal'e baksın)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal.clone().normalize()
    );
    mesh.quaternion.copy(quaternion);

    // Rotated dimension group'a ekle
    this.rotatedDimensionGroup.add(mesh);

    return mesh;
  }

  calculateArea() {
    if (!this.ringsOuter) return { outer: 0 };

    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const steps = this.ringsOuter.length - 1;
    let outerArea = 0;

    // Yan yüzeyler
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

    // Arka kapak ekle
    outerArea += W1 * H1;

    return { outer: outerArea };
  }

  getDimensions() {
    return {
      W: this.params.W1,
      H: this.params.H1,
      L: this.params.L,
      Phi: this.params.Phi,
      SpigotLen: this.params.spigotLenCm,
      t: this.params.t
    };
  }
}
