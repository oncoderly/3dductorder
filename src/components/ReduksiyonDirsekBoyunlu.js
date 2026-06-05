import * as THREE from 'three';
import { BasePart } from './BasePart.js';
import { ReduksiyonDirsek } from './ReduksiyonDirsek.js';

export class ReduksiyonDirsekBoyunlu extends ReduksiyonDirsek {
  constructor(scene, materials) {
    super(scene, materials);
    this.name = 'Reduksiyonlu Dirsek Boyunlu';
  }

  initParams() {
    super.initParams();

    this.params = {
      ...this.params,
      B: 20,
      colorB: '#ff00ff'
    };
  }

  getParameterDefinitions() {
    const definitions = super.getParameterDefinitions();
    const dimensions = [...(definitions.dimensions || [])];
    const colors = [...(definitions.colors || [])];

    const angleIndex = dimensions.findIndex(param => param.key === 'A');
    dimensions.splice(angleIndex >= 0 ? angleIndex + 1 : dimensions.length, 0, {
      key: 'B',
      label: 'Boyun Uzunlugu (B)',
      min: 0,
      max: 500,
      step: 1,
      unit: 'cm',
      default: 20
    });

    colors.push({ key: 'colorB', label: 'B Rengi', default: '#ff00ff' });

    return {
      ...definitions,
      dimensions,
      colors
    };
  }

  getEndFrame() {
    const W1 = BasePart.cm(this.params.W1);
    const W2 = BasePart.cm(this.params.W2);
    const Rin = BasePart.cm(this.params.R_in);
    const theta = THREE.MathUtils.degToRad(this.params.A);

    const WAvg = (W1 + W2) / 2;
    const rMid = Rin + WAvg / 2;
    const centerX = -rMid * Math.cos(theta / 2);
    const centerZ = rMid * Math.sin(theta / 2);
    const rCenter = Rin + W1 / 2;

    const p = new THREE.Vector3(
      -rCenter * Math.cos(theta) - centerX,
      0,
      rCenter * Math.sin(theta) - centerZ
    );
    const tangent = new THREE.Vector3(
      rCenter * Math.sin(theta),
      0,
      rCenter * Math.cos(theta)
    ).normalize();
    const binormal = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

    return { p, tangent, normal, binormal };
  }

  createRectRing(center, normal, binormal, width, height) {
    return [
      center.clone().add(normal.clone().multiplyScalar(-width / 2)).add(binormal.clone().multiplyScalar(-height / 2)),
      center.clone().add(normal.clone().multiplyScalar(width / 2)).add(binormal.clone().multiplyScalar(-height / 2)),
      center.clone().add(normal.clone().multiplyScalar(width / 2)).add(binormal.clone().multiplyScalar(height / 2)),
      center.clone().add(normal.clone().multiplyScalar(-width / 2)).add(binormal.clone().multiplyScalar(height / 2))
    ];
  }

  buildGeometry() {
    super.buildGeometry();

    const B = BasePart.cm(this.params.B || 0);
    if (B <= 0 || !this.ringsOuter || this.ringsOuter.length === 0) return;

    const W = BasePart.cm(this.params.W1);
    const H = BasePart.cm(this.params.H1);
    const t = BasePart.cm(this.params.t);
    const Wi = Math.max(W - 2 * t, 0.001);
    const Hi = Math.max(H - 2 * t, 0.001);
    const { p, tangent, normal, binormal } = this.getEndFrame();
    const pEnd = p.clone().add(tangent.clone().multiplyScalar(B));

    const outerStart = this.createRectRing(p, normal, binormal, W, H);
    const outerEnd = this.createRectRing(pEnd, normal, binormal, W, H);
    const innerStart = this.createRectRing(p, normal, binormal, Wi, Hi);
    const innerEnd = this.createRectRing(pEnd, normal, binormal, Wi, Hi);

    const vertices = [];
    const indices = [];
    const pushRing = (ring) => ring.forEach(v => vertices.push(v.x, v.y, v.z));
    const quad = (a, b, c, d) => indices.push(a, b, c, a, c, d);

    pushRing(outerStart);
    pushRing(outerEnd);
    pushRing(innerStart);
    pushRing(innerEnd);

    for (let k = 0; k < 4; k++) {
      quad(k, (k + 1) % 4, 4 + ((k + 1) % 4), 4 + k);
    }

    for (let k = 0; k < 4; k++) {
      quad(12 + k, 12 + ((k + 1) % 4), 8 + ((k + 1) % 4), 8 + k);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.materials.get('metal'));
    this.scene.geometryGroup.add(mesh);

    this.ringsOuter.push(outerEnd);
    this.neckEndFrame = { p: pEnd, tangent, normal, binormal };
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

    const WAvg = (W1 + W2) / 2;
    const rMid = Rin + WAvg / 2;
    const centerX = -rMid * Math.cos(theta / 2);
    const centerZ = rMid * Math.sin(theta / 2);

    const rCenter0 = Rin + W2 / 2;
    const p0 = new THREE.Vector3(-rCenter0 - centerX, 0, -centerZ);
    const t0 = new THREE.Vector3(0, 0, 1);
    const n0 = new THREE.Vector3(1, 0, 0);
    const b0 = new THREE.Vector3(0, 1, 0);

    const F0 = this.createFlangeRect(W2, H2, lip, fth);
    F0.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(n0, b0, t0));
    F0.position.copy(p0.clone().add(t0.clone().multiplyScalar(-fth * 0.5)));
    this.scene.flangeGroup.add(F0);

    const B = BasePart.cm(this.params.B || 0);
    const { p, tangent, normal, binormal } = this.getEndFrame();
    const pEnd = p.clone().add(tangent.clone().multiplyScalar(B));

    const F1 = this.createFlangeRect(W1, H1, lip, fth);
    F1.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(normal, binormal, tangent));
    F1.position.copy(pEnd.clone().add(tangent.clone().multiplyScalar(fth * 0.5)));
    this.scene.flangeGroup.add(F1);
  }

  drawDimensions() {
    super.drawDimensions();

    const B = BasePart.cm(this.params.B || 0);
    if (B <= 0) return;

    const W1 = BasePart.cm(this.params.W1);
    const H1 = BasePart.cm(this.params.H1);
    const { p, tangent, normal, binormal } = this.getEndFrame();
    const pEnd = p.clone().add(tangent.clone().multiplyScalar(B));

    const start = p.clone()
      .add(normal.clone().multiplyScalar(W1 / 2))
      .add(binormal.clone().multiplyScalar(H1 / 2));
    const end = pEnd.clone()
      .add(normal.clone().multiplyScalar(W1 / 2))
      .add(binormal.clone().multiplyScalar(H1 / 2));

    this.createDimensionLine(
      start,
      end,
      binormal,
      `B = ${BasePart.formatDimension(this.params.B)} cm`,
      this.params.colorB,
      'B'
    );
  }

  getDimensions() {
    return {
      ...super.getDimensions(),
      B: this.params.B
    };
  }
}
