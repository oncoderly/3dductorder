// Manson Component
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class Manson extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();

    this.params = {
      ...this.params,
      Phi: 25,
      L: 10,
      t: 0.12,
      colorPhi: '#00c853',
      colorL: '#00bcd4'
    };
  }

  getParameterDefinitions() {
    const common = this.getCommonParameterDefinitions();

    return {
      dimensions: [
        { key: 'Phi', label: 'Ø', min: 5, max: 200, step: 1, unit: 'cm', default: 25 },
        { key: 'L', label: 'L', min: 2, max: 200, step: 1, unit: 'cm', default: 10 },
        { key: 't', label: 'Sac Kalinligi', min: 0.02, max: 1.0, step: 0.01, unit: 'cm', default: 0.12 }
      ],
      colors: [
        { key: 'colorPhi', label: 'Ø Rengi', default: '#00c853' },
        { key: 'colorL', label: 'L Rengi', default: '#00bcd4' }
      ],
      ...common
    };
  }

  getRingSpec() {
    const D = BasePart.cm(this.params.Phi);
    const L = BasePart.cm(this.params.L);
    const t = BasePart.cm(this.params.t);
    const R = Math.max(D / 2, 0.001);
    const Ri = Math.max(R - t, 0.001);
    const ringWidth = Math.min(R * 0.12, BasePart.cm(1.5));
    const ringOuter = Math.max(R + ringWidth, 0.001);
    const hasRing = ringWidth > 0.0001;

    return {
      D,
      L,
      t,
      R,
      Ri,
      ringWidth,
      ringOuter,
      hasRing
    };
  }

  buildGeometry() {
    const { L, R, Ri, ringOuter, hasRing } = this.getRingSpec();
    const segments = 48;

    const outerBodyGeom = new THREE.CylinderGeometry(R, R, L, segments, 1, true);
    outerBodyGeom.rotateX(Math.PI / 2);
    const innerBodyGeom = new THREE.CylinderGeometry(Ri, Ri, L, segments, 1, true);
    innerBodyGeom.rotateX(Math.PI / 2);

    const ringGeom = hasRing ? new THREE.RingGeometry(R, ringOuter, segments) : null;

    const outerBody = new THREE.Mesh(outerBodyGeom, this.materials.get('metal'));
    const innerBody = new THREE.Mesh(innerBodyGeom, this.materials.get('metal'));
    const ring = ringGeom ? new THREE.Mesh(ringGeom, this.materials.get('metal')) : null;

    const zStart = -L / 2;
    outerBody.position.z = zStart + L / 2;
    innerBody.position.z = zStart + L / 2;
    if (ring) {
      ring.position.z = zStart + L;
    }

    this.scene.geometryGroup.add(outerBody);
    this.scene.geometryGroup.add(innerBody);
    if (ring) {
      this.scene.geometryGroup.add(ring);
    }
  }

  drawDimensions() {
    const D = BasePart.cm(this.params.Phi);
    const L = BasePart.cm(this.params.L);
    const R = D / 2;

    this.createDimensionLine(
      new THREE.Vector3(-R, 0, -L / 2),
      new THREE.Vector3(R, 0, -L / 2),
      new THREE.Vector3(0, 1, 0),
      `Ø = ${BasePart.formatDimension(this.params.Phi)} cm`,
      this.params.colorPhi,
      'Phi'
    );

    this.createDimensionLine(
      new THREE.Vector3(R, 0, -L / 2),
      new THREE.Vector3(R, 0, L / 2),
      new THREE.Vector3(1, 0, 0),
      `L = ${BasePart.formatDimension(this.params.L)} cm`,
      this.params.colorL,
      'L'
    );
  }

  calculateArea() {
    const { R, L, ringOuter, hasRing } = this.getRingSpec();
    const mainArea = 2 * Math.PI * R * L;
    const ringArea = hasRing ? Math.PI * (ringOuter * ringOuter - R * R) : 0;
    const outerArea = mainArea + ringArea;
    return { outer: outerArea };
  }

  addEdges() {
    const { L, R, Ri, ringOuter, hasRing, ringWidth } = this.getRingSpec();

    this.addMouthRings(R, Ri, -L / 2);
    this.addMouthRings(R, Ri, L / 2);
    if (hasRing && ringOuter > R) {
      this.addRingOutlines(R, ringOuter, L / 2, ringWidth);
    }
  }

  addRingOutlines(innerRadius, outerRadius, zPos, ringWidth) {
    const zOffset = BasePart.cm(0.05);
    const band = Math.max(outerRadius - innerRadius, 0);
    const lineThick = Math.min(band * 0.35, BasePart.cm(0.12), ringWidth);
    const z = zPos + zOffset;

    this.addMouthRings(innerRadius, null, z);
    this.addMouthRings(outerRadius, null, z);

    if (lineThick > 0) {
      const inner2 = Math.min(innerRadius + lineThick, outerRadius - 0.0001);
      const outer2 = Math.max(outerRadius - lineThick, innerRadius + 0.0001);
      if (inner2 > innerRadius + 0.00001) {
        this.addMouthRings(inner2, null, z);
      }
      if (outer2 < outerRadius - 0.00001) {
        this.addMouthRings(outer2, null, z);
      }
    }
  }

  addMouthRings(outerRadius, innerRadius, zPos) {
    const makeRing = (radius) => {
      if (!Number.isFinite(radius) || radius <= 0) return;
      const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2);
      const points = curve.getPoints(64).map(p => new THREE.Vector3(p.x, p.y, 0));
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const ring = new THREE.LineLoop(geom, this.materials.get('edge'));
      ring.position.z = zPos;
      this.scene.geometryGroup.add(ring);
    };

    makeRing(outerRadius);
    makeRing(innerRadius);
  }

  getDimensions() {
    return {
      Phi: this.params.Phi,
      L: this.params.L,
      t: this.params.t
    };
  }
}
