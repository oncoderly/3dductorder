// Spiro Dirsek Component
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class SpiroDirsek extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();

    this.params = {
      ...this.params,
      Phi: 30,
      A: 90,
      t: 0.12,
      steps: 72,
      radialSegments: 64,
      colorPhi: '#00c853',
      colorA: '#7e57c2'
    };
  }

  getParameterDefinitions() {
    const common = this.getCommonParameterDefinitions();

    return {
      dimensions: [
        { key: 'Phi', label: 'Çap (Ø)', min: 10, max: 200, step: 1, unit: 'cm', default: 30 },
        { key: 'A', label: 'Açı', min: 15, max: 180, step: 1, unit: '°', default: 90 },
        { key: 't', label: 'Sac Kalinligi', min: 0.02, max: 1.0, step: 0.01, unit: 'cm', default: 0.12 },
        { key: 'steps', label: 'Dirsek Segmenti', min: 24, max: 180, step: 1, unit: '', default: 72 },
        { key: 'radialSegments', label: 'Yuvarlak Hassasiyet', min: 24, max: 128, step: 4, unit: '', default: 64 }
      ],
      colors: [
        { key: 'colorPhi', label: 'Çap Rengi', default: '#00c853' },
        { key: 'colorA', label: 'Açı Rengi', default: '#7e57c2' }
      ],
      ...common
    };
  }

  getSpec() {
    const D = BasePart.cm(this.params.Phi);
    const r = Math.max(D / 2, 0.001);
    const t = BasePart.cm(this.params.t);
    const ri = Math.max(r - t, 0.001);
    const theta = THREE.MathUtils.degToRad(this.params.A);
    const radiusMid = Math.max(D, r + t + 0.001);
    const stubLength = Math.max(D * 0.35, BasePart.cm(4));
    const steps = Math.max(24, Math.floor(this.params.steps));
    const radialSegments = Math.max(24, Math.floor(this.params.radialSegments));

    return { D, r, t, ri, theta, radiusMid, stubLength, steps, radialSegments };
  }

  getArcFrame(u) {
    const { theta, radiusMid } = this.getSpec();
    const angle = u * theta;
    const centerX = -radiusMid * Math.cos(theta / 2);
    const centerZ = radiusMid * Math.sin(theta / 2);
    const position = new THREE.Vector3(
      -radiusMid * Math.cos(angle) - centerX,
      0,
      radiusMid * Math.sin(angle) - centerZ
    );
    const tangent = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).normalize();
    const binormal = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(binormal, tangent).normalize();

    return { position, tangent, normal, binormal, angle };
  }

  getArcCenter() {
    const { theta, radiusMid } = this.getSpec();
    const centerX = -radiusMid * Math.cos(theta / 2);
    const centerZ = radiusMid * Math.sin(theta / 2);
    return new THREE.Vector3(-centerX, 0, -centerZ);
  }

  buildFrames() {
    const { stubLength, steps } = this.getSpec();
    const straightSteps = Math.max(3, Math.round(steps * 0.12));
    const startArc = this.getArcFrame(0);
    const endArc = this.getArcFrame(1);
    const frames = [];

    for (let i = 0; i < straightSteps; i++) {
      const u = i / straightSteps;
      frames.push({
        position: startArc.position.clone().add(startArc.tangent.clone().multiplyScalar(-stubLength * (1 - u))),
        tangent: startArc.tangent.clone(),
        normal: startArc.normal.clone(),
        binormal: startArc.binormal.clone(),
        section: 'start'
      });
    }

    for (let i = 0; i <= steps; i++) {
      const frame = this.getArcFrame(i / steps);
      frame.section = 'arc';
      frames.push(frame);
    }

    for (let i = 1; i <= straightSteps; i++) {
      const u = i / straightSteps;
      frames.push({
        position: endArc.position.clone().add(endArc.tangent.clone().multiplyScalar(stubLength * u)),
        tangent: endArc.tangent.clone(),
        normal: endArc.normal.clone(),
        binormal: endArc.binormal.clone(),
        section: 'end'
      });
    }

    return frames;
  }

  buildGeometry() {
    const { r, ri, radialSegments } = this.getSpec();
    const frames = this.buildFrames();
    const vertices = [];
    const indices = [];
    const ringsOuter = [];
    const ringsInner = [];

    frames.forEach(frame => {
      const outer = [];
      const inner = [];

      for (let k = 0; k < radialSegments; k++) {
        const angle = (k / radialSegments) * Math.PI * 2;
        const radial = frame.normal.clone().multiplyScalar(Math.cos(angle))
          .add(frame.binormal.clone().multiplyScalar(Math.sin(angle)));

        outer.push(frame.position.clone().add(radial.clone().multiplyScalar(r)));
        inner.push(frame.position.clone().add(radial.clone().multiplyScalar(ri)));
      }

      ringsOuter.push(outer);
      ringsInner.push(inner);
    });

    const pushRing = (ring) => {
      ring.forEach(v => vertices.push(v.x, v.y, v.z));
    };

    ringsOuter.forEach(pushRing);
    const innerBase = vertices.length / 3;
    ringsInner.forEach(pushRing);

    const quad = (a, b, c, d) => {
      indices.push(a, b, c, a, c, d);
    };

    for (let i = 0; i < frames.length - 1; i++) {
      const row0 = i * radialSegments;
      const row1 = (i + 1) * radialSegments;
      const innerRow0 = innerBase + row0;
      const innerRow1 = innerBase + row1;

      for (let k = 0; k < radialSegments; k++) {
        const next = (k + 1) % radialSegments;
        quad(row0 + k, row0 + next, row1 + next, row1 + k);
        quad(innerRow1 + k, innerRow1 + next, innerRow0 + next, innerRow0 + k);
      }
    }

    const firstOuter = 0;
    const firstInner = innerBase;
    const lastOuter = (frames.length - 1) * radialSegments;
    const lastInner = innerBase + lastOuter;

    for (let k = 0; k < radialSegments; k++) {
      const next = (k + 1) % radialSegments;
      quad(firstInner + next, firstInner + k, firstOuter + k, firstOuter + next);
      quad(lastOuter + k, lastInner + k, lastInner + next, lastOuter + next);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.materials.get('metal'));
    this.scene.geometryGroup.add(mesh);

    this.mainGeometry = geometry;
    this.frames = frames;
    this.ringsOuter = ringsOuter;
    this.ringsInner = ringsInner;
  }

  buildFlange() {
    const { r, stubLength } = this.getSpec();
    const beadRadius = Math.min(Math.max(r * 0.035, BasePart.cm(0.35)), BasePart.cm(1));
    const start = this.frames?.[0];
    const end = this.frames?.[this.frames.length - 1];

    if (!start || !end) return;

    this.addBeadRing(start, 0, r, beadRadius);
    this.addBeadRing(start, Math.min(stubLength * 0.42, BasePart.cm(8)), r, beadRadius * 0.75);
    this.addBeadRing(end, 0, r, beadRadius);
    this.addBeadRing(end, -Math.min(stubLength * 0.42, BasePart.cm(8)), r, beadRadius * 0.75);

    [0.25, 0.5, 0.75].forEach(u => {
      this.addBeadRing(this.getArcFrame(u), 0, r, beadRadius * 0.65);
    });
  }

  addBeadRing(frame, tangentOffset, radius, beadRadius) {
    const geometry = new THREE.TorusGeometry(radius + beadRadius * 0.2, beadRadius, 8, 96);
    const mesh = new THREE.Mesh(geometry, this.materials.get('metal'));
    const basis = new THREE.Matrix4().makeBasis(frame.normal, frame.binormal, frame.tangent);

    mesh.quaternion.setFromRotationMatrix(basis);
    mesh.position.copy(frame.position.clone().add(frame.tangent.clone().multiplyScalar(tangentOffset)));
    this.scene.flangeGroup.add(mesh);
  }

  addEdges() {
    if (!this.frames || !this.ringsOuter) return;

    const { r, ri, radialSegments } = this.getSpec();
    const start = this.frames[0];
    const end = this.frames[this.frames.length - 1];

    this.addCircularEdge(start, r);
    this.addCircularEdge(start, ri);
    this.addCircularEdge(end, r);
    this.addCircularEdge(end, ri);

    [0.25, 0.5, 0.75].forEach(u => {
      this.addCircularEdge(this.getArcFrame(u), r);
    });

    const lineIndexes = [0, radialSegments / 4, radialSegments / 2, radialSegments * 3 / 4]
      .map(value => Math.floor(value) % radialSegments);

    lineIndexes.forEach(index => {
      const points = this.ringsOuter.map(ring => ring[index]);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, this.materials.get('edge'));
      this.scene.geometryGroup.add(line);
    });
  }

  addCircularEdge(frame, radius) {
    if (!Number.isFinite(radius) || radius <= 0) return;

    const points = [];
    const segs = 96;
    for (let i = 0; i < segs; i++) {
      const angle = (i / segs) * Math.PI * 2;
      const radial = frame.normal.clone().multiplyScalar(Math.cos(angle))
        .add(frame.binormal.clone().multiplyScalar(Math.sin(angle)));
      points.push(frame.position.clone().add(radial.multiplyScalar(radius)));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const loop = new THREE.LineLoop(geometry, this.materials.get('edge'));
    this.scene.geometryGroup.add(loop);
  }

  drawDimensions() {
    const { r, theta, radiusMid } = this.getSpec();
    const start = this.frames?.[0];
    if (!start) return;

    this.createDimensionLine(
      start.position.clone().add(start.normal.clone().multiplyScalar(-r)),
      start.position.clone().add(start.normal.clone().multiplyScalar(r)),
      start.binormal.clone(),
      `Ø = ${BasePart.formatDimension(this.params.Phi)} cm`,
      this.params.colorPhi,
      'Phi'
    );

    const center = this.getArcCenter();
    const measureRadius = Math.max(radiusMid - r * 1.25, r * 0.65);
    const points = [];
    const segs = 48;

    for (let i = 0; i <= segs; i++) {
      const angle = (i / segs) * theta;
      points.push(new THREE.Vector3(
        center.x - measureRadius * Math.cos(angle),
        center.y - r * 1.15,
        center.z + measureRadius * Math.sin(angle)
      ));
    }

    const arcLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineDashedMaterial({
        color: new THREE.Color(this.params.colorA),
        dashSize: 0.05,
        gapSize: 0.03,
        depthTest: !this.params.dimAlwaysOnTop
      })
    );
    arcLine.computeLineDistances();
    arcLine.renderOrder = this.params.dimAlwaysOnTop ? 999 : 0;
    this.scene.dimensionGroup.add(arcLine);

    const paramDataA = this.getParameterDefinitions().dimensions.find(p => p.key === 'A');
    const midAngle = theta / 2;
    this.scene.addLabel(
      `A = ${BasePart.formatDimension(this.params.A)}°`,
      new THREE.Vector3(
        center.x - measureRadius * Math.cos(midAngle),
        center.y - r * 1.55,
        center.z + measureRadius * Math.sin(midAngle)
      ),
      this.params.colorA,
      paramDataA
    );
  }

  calculateArea() {
    if (!this.ringsOuter) return { outer: 0 };

    let outerArea = 0;
    for (let i = 0; i < this.ringsOuter.length - 1; i++) {
      const ring0 = this.ringsOuter[i];
      const ring1 = this.ringsOuter[i + 1];

      for (let k = 0; k < ring0.length; k++) {
        const next = (k + 1) % ring0.length;
        outerArea += this.triangleArea(ring0[k], ring0[next], ring1[next]);
        outerArea += this.triangleArea(ring0[k], ring1[next], ring1[k]);
      }
    }

    return { outer: outerArea };
  }

  getDimensions() {
    return {
      Phi: this.params.Phi,
      A: this.params.A,
      t: this.params.t
    };
  }
}
