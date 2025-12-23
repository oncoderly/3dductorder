// KaredenYuvarlaga - Kareden yuvarlağa geçiş parçası
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class KaredenYuvarlaga extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.name = 'KaredenYuvarlaga';
  }

  initDefaultParams() {
    super.initDefaultParams();

    // Kareden Yuvarlağa'ya özel parametreler
    this.defaultParams = {
      ...this.defaultParams,

      // Boyutlar (cm)
      W1: 100,        // Kare genişlik
      H1: 80,         // Kare yükseklik
      Phi: 60,        // Daire çapı
      L: 40,          // Uzunluk
      t: 0.12,        // Sac kalınlığı

      // Geometri
      steps: 120,     // Yol segmenti
      edgeSegs: 200,  // Halka noktası (N)

      // Ofset modları
      modeW: 'central',    // 'flatLeft', 'central', 'flatRight', 'value'
      modeH: 'central',    // 'flatBottom', 'central', 'flatTop', 'value'
      offWcm: 0,           // Manuel ofset genişlik (cm)
      offHcm: 0,           // Manuel ofset yükseklik (cm)

      // Görünüm
      showSideLabels: true,

      // Renkler
      colorW1: '#007bff',
      colorH1: '#ffd400',
      colorPhi: '#00c853',
      colorL: '#00bcd4'
    };

    this.params = { ...this.defaultParams };
  }

  getParameterDefinitions() {
    const common = this.getCommonParameterDefinitions();

    return {
      groups: [
        {
          name: 'Ölçüler',
          params: [
            { key: 'W1', label: 'W1 (kare) cm', type: 'number', min: 1, max: 400, step: 1 },
            { key: 'H1', label: 'H1 (kare) cm', type: 'number', min: 1, max: 400, step: 1 },
            { key: 'Phi', label: 'Ø (daire) cm', type: 'number', min: 1, max: 400, step: 1 },
            { key: 'L', label: 'L (uzunluk) cm', type: 'number', min: 1, max: 1000, step: 1 },
            { key: 't', label: 'Sac Kalınlığı t', type: 'number', min: 0.02, max: 1, step: 0.01 }
          ]
        },
        {
          name: 'Geometri',
          params: [
            { key: 'steps', label: 'Yol Segmenti (steps)', type: 'number', min: 8, max: 400, step: 1 },
            { key: 'edgeSegs', label: 'Halka Noktası (N)', type: 'number', min: 8, max: 400, step: 1 }
          ]
        },
        {
          name: 'Ofset',
          params: [
            {
              key: 'modeW',
              label: 'Ofset-Genişlik',
              type: 'select',
              options: [
                { value: 'flatLeft', label: 'Sol Düz' },
                { value: 'central', label: 'Merkezi' },
                { value: 'flatRight', label: 'Sağ Düz' },
                { value: 'value', label: 'Değer' }
              ]
            },
            { key: 'offWcm', label: 'Ofset-Genişlik (cm)', type: 'number', min: -200, max: 200, step: 1 },
            {
              key: 'modeH',
              label: 'Ofset-Yükseklik',
              type: 'select',
              options: [
                { value: 'flatBottom', label: 'Alt Düz' },
                { value: 'central', label: 'Merkezi' },
                { value: 'flatTop', label: 'Üst Düz' },
                { value: 'value', label: 'Değer' }
              ]
            },
            { key: 'offHcm', label: 'Ofset-Yükseklik (cm)', type: 'number', min: -200, max: 200, step: 1 }
          ]
        },
        {
          name: 'Görünüm',
          params: [
            // Ortak view parametreleri
            ...common.view,
            // KaredenYuvarlaga'ya özel
            { key: 'showSideLabels', label: 'Yüz Etiketleri', type: 'checkbox' }
          ]
        },
        {
          name: 'Renkler',
          params: [
            { key: 'colorW1', label: 'W1 Rengi', type: 'color' },
            { key: 'colorH1', label: 'H1 Rengi', type: 'color' },
            { key: 'colorPhi', label: 'Ø Rengi', type: 'color' },
            { key: 'colorL', label: 'L Rengi', type: 'color' }
          ]
        },
        {
          name: '🔧 Flanş Ayarları',
          params: common.flange
        },
        {
          name: '✨ Malzeme Özellikleri',
          params: common.material
        },
        {
          name: '📐 Ölçülendirme Ayarları',
          params: common.dimension
        },
        {
          name: '📊 Alan Hesabı',
          params: common.area
        }
      ]
    };
  }

  // Eşit aralıklı dikdörtgen noktaları
  rectEven(N, hx, hy) {
    const Pm = 4 * (hx + hy);
    const pts = [];

    for (let k = 0; k < N; k++) {
      let s = Pm * k / N;

      if (s < 2 * hx) {
        pts.push(new THREE.Vector3(-hx + s, -hy, 0));
      } else if ((s -= 2 * hx) < 2 * hy) {
        pts.push(new THREE.Vector3(hx, -hy + s, 0));
      } else if ((s -= 2 * hy) < 2 * hx) {
        pts.push(new THREE.Vector3(hx - s, hy, 0));
      } else {
        s -= 2 * hx;
        pts.push(new THREE.Vector3(-hx, hy - s, 0));
      }
    }

    return pts;
  }

  // Eşit aralıklı çember noktaları
  circleEven(N, r) {
    const pts = [];

    for (let k = 0; k < N; k++) {
      const th = -3 * Math.PI / 4 + 2 * Math.PI * k / N;
      pts.push(new THREE.Vector3(r * Math.cos(th), r * Math.sin(th), 0));
    }

    return pts;
  }

  buildGeometry() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const D = BasePart.cm(this.params.Phi);
    const L = BasePart.cm(this.params.L);
    const t = BasePart.cm(this.params.t);

    const N = Math.max(4, Math.floor(this.params.edgeSegs)); // Noktalar halka başına

    // Baş ve son kesit noktaları (outer/inner)
    const rectO = this.rectEven(N, W1 / 2, H1 / 2);
    const rectI = this.rectEven(N, Math.max(W1 / 2 - t, 1e-5), Math.max(H1 / 2 - t, 1e-5));
    const circO = this.circleEven(N, D / 2);
    const circI = this.circleEven(N, Math.max(D / 2 - t, 1e-5));

    // Merkez ofset fonksiyonları
    const Wu = u => W1 * (1 - u) + D * u;
    const Hu = u => H1 * (1 - u) + D * u;

    const left0 = -W1 / 2;
    const right0 = W1 / 2;
    const bottom0 = -H1 / 2;
    const top0 = H1 / 2;

    const offWx = BasePart.cm(this.params.offWcm);
    const offHy = BasePart.cm(this.params.offHcm);

    const cx = (u) => {
      switch (this.params.modeW) {
        case 'flatLeft': return left0 + Wu(u) / 2;
        case 'flatRight': return right0 - Wu(u) / 2;
        case 'value': return offWx * u;
        default: return 0; // central
      }
    };

    const cy = (u) => {
      switch (this.params.modeH) {
        case 'flatBottom': return bottom0 + Hu(u) / 2;
        case 'flatTop': return top0 - Hu(u) / 2;
        case 'value': return offHy * u;
        default: return 0; // central
      }
    };

    // Halka örme
    const vs = [];
    const idx = [];
    const Rout = [];
    const Rin = [];

    for (let i = 0; i <= this.params.steps; i++) {
      const u = i / this.params.steps;
      const O = [];
      const I = [];

      for (let k = 0; k < N; k++) {
        const po = rectO[k].clone().multiplyScalar(1 - u).add(circO[k].clone().multiplyScalar(u));
        const pi = rectI[k].clone().multiplyScalar(1 - u).add(circI[k].clone().multiplyScalar(u));

        po.x += cx(u);
        po.y += cy(u);
        po.z = (u - 0.5) * L; // Merkezi 0'a kaydır

        pi.x += cx(u);
        pi.y += cy(u);
        pi.z = (u - 0.5) * L; // Merkezi 0'a kaydır

        O.push(po);
        I.push(pi);
      }

      Rout.push(O);
      Rin.push(I);
    }

    // Vertex pozisyonlarını ekle
    const push = r => {
      for (const v of r) {
        vs.push(v.x, v.y, v.z);
      }
    };

    for (let i = 0; i <= this.params.steps; i++) push(Rout[i]);
    const innerBase = vs.length / 3;
    for (let i = 0; i <= this.params.steps; i++) push(Rin[i]);

    // Index'leri oluştur
    const quad = (a, b, c, d) => {
      idx.push(a, b, c, a, c, d);
    };

    // Dış yüzey
    for (let i = 0; i < this.params.steps; i++) {
      const b0 = i * N;
      const b1 = (i + 1) * N;

      for (let k = 0; k < N; k++) {
        const a = b0 + k;
        const bI = b0 + (k + 1) % N;
        const c = b1 + (k + 1) % N;
        const d = b1 + k;
        quad(a, bI, c, d);
      }
    }

    // İç yüzey
    for (let i = 0; i < this.params.steps; i++) {
      const b0 = innerBase + i * N;
      const b1 = innerBase + (i + 1) * N;

      for (let k = 0; k < N; k++) {
        const a = b0 + k;
        const bI = b0 + (k + 1) % N;
        const c = b1 + (k + 1) % N;
        const d = b1 + k;
        quad(d, c, bI, a);
      }
    }

    // Geometriyi oluştur
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3));
    geometry.setIndex(idx);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.materials.get('metal'));
    this.scene.geometryGroup.add(mesh);

    // Alan hesabı için dış yüzey noktalarını sakla
    this.Rout = Rout;
  }

  buildFlange() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const D = BasePart.cm(this.params.Phi);
    const L = BasePart.cm(this.params.L);
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);

    const n = new THREE.Vector3(1, 0, 0);
    const b = new THREE.Vector3(0, 1, 0);
    const tz = new THREE.Vector3(0, 0, 1);

    // Ofset fonksiyonlarını hesapla
    const cx0 = this.calculateCX(0);
    const cy0 = this.calculateCY(0);
    const cx1 = this.calculateCX(1);
    const cy1 = this.calculateCY(1);

    const p0 = new THREE.Vector3(cx0, cy0, -L / 2);
    const p1 = new THREE.Vector3(cx1, cy1, L / 2);

    // Dikdörtgen flanş (kare taraf)
    const F0 = this.createFlangeRect(W1, H1, lip, fth);

    // Yuvarlak flanş (daire taraf)
    const F1 = this.createFlangeRound(D, lip, fth);

    // Pozisyonlandırma helper
    const place = (obj, pos, tangent, normal, binormal) => {
      const M = new THREE.Matrix4().makeBasis(
        normal.clone(),
        binormal.clone(),
        tangent.clone()
      );
      const Q = new THREE.Quaternion().setFromRotationMatrix(M);
      obj.position.copy(pos);
      obj.quaternion.copy(Q);
    };

    place(F0, p0.clone().add(tz.clone().multiplyScalar(-fth * 0.5)), tz, n, b);
    place(F1, p1.clone().add(tz.clone().multiplyScalar(fth * 0.5)), tz, n, b);

    this.scene.flangeGroup.add(F0, F1);
  }

  // Yuvarlak flanş oluştur
  createFlangeRound(D, lip, th) {
    const Rr = D / 2;

    const shape = new THREE.Shape();
    shape.absarc(0, 0, Rr + lip, 0, Math.PI * 2, false);

    const hole = new THREE.Path();
    hole.absarc(0, 0, Rr, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geometry = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: false });
    geometry.center();

    const mesh = new THREE.Mesh(geometry, this.materials.get('flange'));
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), this.materials.get('edge')));

    return mesh;
  }

  // Ofset hesaplama helper'ları
  calculateCX(u) {
    const W1 = BasePart.cm(this.params.W1);
    const D = BasePart.cm(this.params.Phi);
    const Wu = u => W1 * (1 - u) + D * u;

    const left0 = -W1 / 2;
    const right0 = W1 / 2;
    const offWx = BasePart.cm(this.params.offWcm);

    switch (this.params.modeW) {
      case 'flatLeft': return left0 + Wu(u) / 2;
      case 'flatRight': return right0 - Wu(u) / 2;
      case 'value': return offWx * u;
      default: return 0; // central
    }
  }

  calculateCY(u) {
    const H1 = BasePart.cm(this.params.H1);
    const D = BasePart.cm(this.params.Phi);
    const Hu = u => H1 * (1 - u) + D * u;

    const bottom0 = -H1 / 2;
    const top0 = H1 / 2;
    const offHy = BasePart.cm(this.params.offHcm);

    switch (this.params.modeH) {
      case 'flatBottom': return bottom0 + Hu(u) / 2;
      case 'flatTop': return top0 - Hu(u) / 2;
      case 'value': return offHy * u;
      default: return 0; // central
    }
  }

  drawDimensions() {
    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const D = BasePart.cm(this.params.Phi);
    const L = BasePart.cm(this.params.L);

    const n = new THREE.Vector3(1, 0, 0);
    const b = new THREE.Vector3(0, 1, 0);

    const cx0 = this.calculateCX(0);
    const cy0 = this.calculateCY(0);
    const cx1 = this.calculateCX(1);
    const cy1 = this.calculateCY(1);

    const p0 = new THREE.Vector3(cx0, cy0, -L / 2);
    const p1 = new THREE.Vector3(cx1, cy1, L / 2);

    // Kare taraf ölçüleri
    const x0L = n.clone().multiplyScalar(-W1 / 2);
    const x0R = n.clone().multiplyScalar(W1 / 2);
    const y0T = b.clone().multiplyScalar(H1 / 2);
    const y0B = b.clone().multiplyScalar(-H1 / 2);

    this.createDimensionLine(
      p0.clone().add(x0L).add(y0T),
      p0.clone().add(x0R).add(y0T),
      b,
      `W1 = ${BasePart.formatDimension(this.params.W1)} cm`,
      this.params.colorW1,
      'W1'
    );

    this.createDimensionLine(
      p0.clone().add(x0R).add(y0B),
      p0.clone().add(x0R).add(y0T),
      n,
      `H1 = ${BasePart.formatDimension(this.params.H1)} cm`,
      this.params.colorH1,
      'H1'
    );

    // Daire çapı
    const Rr = D / 2;
    const xR = n.clone().multiplyScalar(Rr);

    this.createDimensionLine(
      p1.clone().add(xR.clone().negate()),
      p1.clone().add(xR),
      b,
      `Ø = ${BasePart.formatDimension(this.params.Phi)} cm`,
      this.params.colorPhi,
      'Phi'
    );

    // L ölçüsü
    const left0 = p0.x - W1 / 2;
    const left1 = p1.x - D / 2;
    const bottom0 = p0.y - H1 / 2;
    const bottom1 = p1.y - D / 2;
    const xr = Math.max(left0, left1);
    const yr = Math.max(bottom0, bottom1);

    this.createDimensionLine(
      new THREE.Vector3(xr, yr, -L / 2),
      new THREE.Vector3(xr, yr, L / 2),
      n.clone().negate(),
      `L = ${BasePart.formatDimension(this.params.L)} cm`,
      this.params.colorL,
      'L'
    );

    // Yüz etiketleri - eğimli yüzeylere yapışık 3D mesh etiketler
    if (this.params.showSideLabels && this.Rout && this.Rout.length > 2) {
      const midIdx = Math.floor(this.params.steps / 2);
      const ringMid = this.Rout[midIdx];
      if (ringMid && ringMid.length) {
        const pickIndex = (axis, dir) => {
          let bestIdx = 0;
          let bestVal = dir === 'max' ? -Infinity : Infinity;
          for (let i = 0; i < ringMid.length; i++) {
            const v = axis === 'x' ? ringMid[i].x : ringMid[i].y;
            if ((dir === 'max' && v > bestVal) || (dir === 'min' && v < bestVal)) {
              bestVal = v;
              bestIdx = i;
            }
          }
          return bestIdx;
        };

        const rightIdx = pickIndex('x', 'max');
        const leftIdx = pickIndex('x', 'min');
        const topIdx = pickIndex('y', 'max');
        const bottomIdx = pickIndex('y', 'min');
        const widthCm = 15; // Etiket genişliği (cm cinsinden)

        this.addSurfaceLabel('SAĞ', rightIdx, widthCm, '#ff6');
        this.addSurfaceLabel('SOL', leftIdx, widthCm, '#ff6');
        this.addSurfaceLabel('ÜST', topIdx, widthCm, '#ff6');
        this.addSurfaceLabel('ALT', bottomIdx, widthCm, '#ff6');
      }
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

  // Eğimli yüzey etiketi ekle - halka üzerinden yüzeye yapışık
  addSurfaceLabel(text, ringIndex, widthCm, color) {
    const mesh = this.makeTextPlane(text, widthCm, color);
    if (!this.Rout || this.Rout.length < 3) return mesh;

    const midIdx = Math.floor(this.params.steps / 2);
    const prevIdx = Math.max(0, midIdx - 1);
    const nextIdx = Math.min(this.params.steps, midIdx + 1);
    const ringMid = this.Rout[midIdx];
    const ringPrev = this.Rout[prevIdx];
    const ringNext = this.Rout[nextIdx];
    if (!ringMid || !ringPrev || !ringNext) return mesh;

    const N = ringMid.length;
    const idx = ((ringIndex % N) + N) % N;

    const pPrev = ringPrev[idx];
    const pNext = ringNext[idx];
    const pMid = ringMid[idx];

    const tLen = new THREE.Vector3().subVectors(pNext, pPrev);
    if (tLen.lengthSq() < 1e-8) return mesh;
    tLen.normalize();

    const pA = ringMid[(idx - 1 + N) % N];
    const pB = ringMid[(idx + 1) % N];
    const tRing = new THREE.Vector3().subVectors(pB, pA);
    if (tRing.lengthSq() < 1e-8) return mesh;
    tRing.normalize();

    let normal = new THREE.Vector3().crossVectors(tLen, tRing).normalize();
    const center = new THREE.Vector3();
    for (const p of ringMid) center.add(p);
    center.multiplyScalar(1 / N);
    const radial = new THREE.Vector3().subVectors(pMid, center);
    if (radial.lengthSq() > 1e-8 && normal.dot(radial) < 0) {
      normal.negate();
    }

    const tangentX = new THREE.Vector3().crossVectors(tLen, normal).normalize();
    const matrix = new THREE.Matrix4().makeBasis(tangentX, tLen, normal);
    mesh.quaternion.setFromRotationMatrix(matrix);

    // Etiket yüksekliğini hesapla (mesh döndürüldükten sonra)
    const W = BasePart.cm(widthCm);
    const aspect = mesh.geometry.parameters.width / mesh.geometry.parameters.height;
    const H = W / aspect;

    // Eğim açısını hesapla - tLen'in XY düzlemi ile açısı
    const tLenXY = new THREE.Vector2(tLen.x, tLen.y).length();
    const tLenZ = Math.abs(tLen.z);
    const slopeAngle = Math.atan2(tLenXY, tLenZ);

    // Normal offset - etiketi yüzeye yaklaştır
    const baseOffset = H * 0.7;
    const slopeExtra = H * Math.sin(slopeAngle) * 1.2;
    const normalOffset = (baseOffset + slopeExtra) * 0.2;

    mesh.position.copy(pMid.clone().add(normal.clone().multiplyScalar(normalOffset)));
    this.scene.dimensionGroup.add(mesh);
    return mesh;
  }

  calculateArea() {
    let Aout = 0;

    if (this.Rout && this.Rout.length > 0) {
      const N = this.Rout[0].length;

      for (let i = 0; i < this.params.steps; i++) {
        const r0 = this.Rout[i];
        const r1 = this.Rout[i + 1];

        for (let k = 0; k < N; k++) {
          const v00 = r0[k];
          const v01 = r0[(k + 1) % N];
          const v11 = r1[(k + 1) % N];
          const v10 = r1[k];

          Aout += this.triangleArea(v00, v01, v11);
          Aout += this.triangleArea(v00, v11, v10);
        }
      }
    }

    // Flanş alanı ekle (eğer istenirse)
    let flangeArea = 0;
    if (this.params.areaIncludeFlange) {
      this.scene.flangeGroup.children.forEach(mesh => {
        if (mesh.geometry) {
          const g = mesh.geometry;
          const p = g.attributes.position.array;
          const I = g.index ? g.index.array : null;

          let A = 0;
          const a = new THREE.Vector3();
          const b = new THREE.Vector3();
          const c = new THREE.Vector3();

          const read = (i, o) => o.set(p[3 * i], p[3 * i + 1], p[3 * i + 2]);

          if (I) {
            for (let i = 0; i < I.length; i += 3) {
              read(I[i], a);
              read(I[i + 1], b);
              read(I[i + 2], c);
              A += this.triangleArea(a, b, c);
            }
          } else {
            for (let i = 0; i < p.length; i += 9) {
              a.set(p[i], p[i + 1], p[i + 2]);
              b.set(p[i + 3], p[i + 4], p[i + 5]);
              c.set(p[i + 6], p[i + 7], p[i + 8]);
              A += this.triangleArea(a, b, c);
            }
          }

          flangeArea += A;
        }
      });
    }

    return {
      outer: Aout + flangeArea,
      inner: 0
    };
  }

  addEdges() {
    // Curved surfaces look better without segment lines
    // Edge lines disabled for smooth appearance
  }

  getDimensions() {
    return {
      W1: this.params.W1,
      H1: this.params.H1,
      Phi: this.params.Phi,
      L: this.params.L,
      t: this.params.t
    };
  }
}
