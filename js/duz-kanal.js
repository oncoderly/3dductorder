// Düz Kanal - Rectangular Duct
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Viewer3D } from './3d-viewer-core.js';

// Parametreler
export const params = {
  W1: 25,
  H1: 30,
  L: 120,
  t: 0.12,
  steps: 16,
  showEdges: true,
  showDims: true,
  showFlange: true,
  flangeLip: 3,
  flangeThick: 0.6,
  metalRough: 0.35,
  metalness: 0.85,
  showAxis: false,
  showGrid: true,
  keepViewOnEdit: true,
  dimOffsetCm: 1.5,
  arrowHeadCm: 4,
  arrowRadiusCm: 1.2,
  extLenCm: 15,
  extGapCm: 1,
  dimPlaneOffsetCm: 20,
  labelOffsetCm: 0.5,
  dimAlwaysOnTop: true,
  dimFixedOffset: true,
  colorW1: '#207aff',
  colorH1: '#ff2d2d',
  colorL: '#00bcd4',
  areaIncludeFlange: false,
  wastePercent: 25,
  kFactor: 1
};

// Materials
let metalMat, flangeMat, edgeMat;
let viewer;
let areaEl;

export function init() {
  viewer = new Viewer3D();

  // Materials
  metalMat = new THREE.MeshPhysicalMaterial({
    color: 0xbfc7d2,
    roughness: params.metalRough,
    metalness: params.metalness,
    clearcoat: 0.5,
    clearcoatRoughness: 0.25,
    side: THREE.DoubleSide
  });

  flangeMat = new THREE.MeshPhysicalMaterial({
    color: 0x9aa3ad,
    roughness: 0.6,
    metalness: 0.9
  });

  edgeMat = new THREE.LineBasicMaterial({
    color: 0x3a3f46
  });

  // HUD area display
  const hud = document.getElementById('hud');
  areaEl = document.createElement('div');
  areaEl.style.marginTop = '6px';
  hud.appendChild(areaEl);

  // Axis labels
  const axisLen = 1.2;
  viewer.axes.scale.set(axisLen, axisLen, axisLen);
  viewer.addRootLabel('+X', Viewer3D.V(axisLen, 0, 0), '#ff6b6b');
  viewer.addRootLabel('+Y', Viewer3D.V(0, axisLen, 0), '#5cff5c');
  viewer.addRootLabel('+Z', Viewer3D.V(0, 0, axisLen), '#5cb6ff');

  setupGUI();
  build();
}

export function build() {
  try {
    // Temizle
    viewer.clearGroup(viewer.geometryGroup);
    viewer.clearGroup(viewer.flangeGroup);
    viewer.clearGroup(viewer.dimensionGroup);
    viewer.clearGroup(viewer.labelGroup);
    document.querySelectorAll('.label').forEach(e => e.remove());

    const W1 = Viewer3D.cm(params.W1);
    const H1 = Viewer3D.cm(params.H1);
    const L = Viewer3D.cm(params.L);
    const t = Viewer3D.cm(params.t);
    const lip = Viewer3D.cm(params.flangeLip);
    const fth = Viewer3D.cm(params.flangeThick);

    // Gövde (içi boş dikdörtgen prizma kabuğu)
    const rectO = [
      new THREE.Vector3(-W1/2, -H1/2, 0),
      new THREE.Vector3(W1/2, -H1/2, 0),
      new THREE.Vector3(W1/2, H1/2, 0),
      new THREE.Vector3(-W1/2, H1/2, 0)
    ];
    const rectI = [
      new THREE.Vector3(-W1/2+t, -H1/2+t, 0),
      new THREE.Vector3(W1/2-t, -H1/2+t, 0),
      new THREE.Vector3(W1/2-t, H1/2-t, 0),
      new THREE.Vector3(-W1/2+t, H1/2-t, 0)
    ];

    const steps = Math.max(2, Math.floor(params.steps));
    const vs = [], idx = [];
    const N = 4;
    const Rout = [], Rin = [];

    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const z = u * L;
      const O = [], I = [];
      for (let k = 0; k < N; k++) {
        const po = rectO[k].clone();
        po.z = z;
        const pi = rectI[k].clone();
        pi.z = z;
        O.push(po);
        I.push(pi);
      }
      Rout.push(O);
      Rin.push(I);
    }

    const push = r => {
      for (const v of r) {
        vs.push(v.x, v.y, v.z);
      }
    };

    for (let i = 0; i <= steps; i++) push(Rout[i]);
    const innerBase = vs.length / 3;
    for (let i = 0; i <= steps; i++) push(Rin[i]);

    const quad = (a, b, c, d) => {
      idx.push(a, b, c, a, c, d);
    };

    for (let i = 0; i < steps; i++) {
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

    for (let i = 0; i < steps; i++) {
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

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, metalMat);
    viewer.geometryGroup.add(mesh);

    if (params.showEdges) {
      viewer.geometryGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 1), edgeMat));
    }

    // Flanşlar
    if (params.showFlange) {
      const Q = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, 1)
        )
      );
      const F0 = createFlangeRect(W1, H1, lip, fth);
      F0.quaternion.copy(Q);
      F0.position.set(0, 0, -fth * 0.5);
      viewer.flangeGroup.add(F0);

      const F1 = createFlangeRect(W1, H1, lip, fth);
      F1.quaternion.copy(Q);
      F1.position.set(0, 0, L + fth * 0.5);
      viewer.flangeGroup.add(F1);
    }

    // Alan hesaplama
    let Aout = 0;
    for (let i = 0; i < steps; i++) {
      const r0 = Rout[i], r1 = Rout[i + 1];
      for (let k = 0; k < 4; k++) {
        const v00 = r0[k];
        const v01 = r0[(k + 1) % 4];
        const v11 = r1[(k + 1) % 4];
        const v10 = r1[k];
        Aout += triangleArea(v00, v01, v11) + triangleArea(v00, v11, v10);
      }
    }

    const sheet = Aout * (params.kFactor ?? 1);
    const waste = sheet * (1 + ((params.wastePercent || 0) / 100));

    // Ölçülendirme
    if (params.showDims) {
      dimLine(
        new THREE.Vector3(-W1/2, H1/2, L),
        new THREE.Vector3(W1/2, H1/2, L),
        Viewer3D.V(0, 1, 0),
        `W1 = ${params.W1.toFixed(1)} cm`,
        params.colorW1
      );

      dimLine(
        new THREE.Vector3(-W1/2, -H1/2, L),
        new THREE.Vector3(-W1/2, H1/2, L),
        Viewer3D.V(-1, 0, 0),
        `H1 = ${params.H1.toFixed(1)} cm`,
        params.colorH1
      );

      dimLine(
        new THREE.Vector3(W1/2, -H1/2, 0),
        new THREE.Vector3(W1/2, -H1/2, L),
        Viewer3D.V(1, 0, 0),
        `L = ${params.L.toFixed(1)} cm`,
        params.colorL
      );
    }

    // Kadraj
    const preserve = params.keepViewOnEdit && viewer.didInitialFrame;
    let camState;
    if (preserve) {
      camState = {
        pos: viewer.camera.position.clone(),
        quat: viewer.camera.quaternion.clone(),
        tgt: viewer.controls.target.clone()
      };
    }
    if (!preserve) {
      viewer.frameFit(viewer.geometryGroup);
      viewer.didInitialFrame = true;
    } else {
      viewer.camera.position.copy(camState.pos);
      viewer.camera.quaternion.copy(camState.quat);
      viewer.camera.updateProjectionMatrix();
      viewer.controls.target.copy(camState.tgt);
      viewer.controls.update();
      viewer.lastCenter.copy(viewer.controls.target);
      viewer.lastDistance = viewer.camera.position.distanceTo(viewer.controls.target);
    }

    areaEl.textContent = `Dış: ${Aout.toFixed(3)} m² | k=${(params.kFactor ?? 1).toFixed(2)} ⇒ ${sheet.toFixed(3)} m² | +%${(params.wastePercent || 0).toFixed(1)} atık ⇒ ${waste.toFixed(3)} m²`;

  } catch (err) {
    console.error('[BUILD ERROR]', err);
    areaEl.textContent = 'Hata: ' + err.message;
  }
}

function createFlangeRect(Wm, Hm, lip, th) {
  const shape = new THREE.Shape([
    new THREE.Vector2(-Wm/2 - lip, -Hm/2 - lip),
    new THREE.Vector2(Wm/2 + lip, -Hm/2 - lip),
    new THREE.Vector2(Wm/2 + lip, Hm/2 + lip),
    new THREE.Vector2(-Wm/2 - lip, Hm/2 + lip)
  ]);

  const hole = new THREE.Path([
    new THREE.Vector2(-Wm/2, -Hm/2),
    new THREE.Vector2(Wm/2, -Hm/2),
    new THREE.Vector2(Wm/2, Hm/2),
    new THREE.Vector2(-Wm/2, Hm/2)
  ]);

  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: th, bevelEnabled: false });
  geometry.center();

  const mesh = new THREE.Mesh(geometry, flangeMat);
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMat));
  return mesh;
}

function triangleArea(a, b, c) {
  const ab = Viewer3D.V().subVectors(b, a);
  const ac = Viewer3D.V().subVectors(c, a);
  return ab.cross(ac).length() * 0.5;
}

function arrowBoth(p1, p2, color = 0x207aff, head = 0.04, rad = 0.01) {
  const mat = new THREE.LineBasicMaterial({
    color,
    depthTest: !params.dimAlwaysOnTop,
    depthWrite: !params.dimAlwaysOnTop,
    transparent: params.dimAlwaysOnTop
  });

  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p1, p2]), mat);
  line.renderOrder = params.dimAlwaysOnTop ? 999 : 0;

  const dir = Viewer3D.V().subVectors(p2, p1).normalize();

  const makeCone = (q, p) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(rad, head, 12),
      new THREE.MeshBasicMaterial({
        color,
        depthTest: !params.dimAlwaysOnTop,
        depthWrite: !params.dimAlwaysOnTop,
        transparent: params.dimAlwaysOnTop
      })
    );
    cone.quaternion.copy(q);
    cone.position.copy(p);
    cone.renderOrder = params.dimAlwaysOnTop ? 999 : 0;
    return cone;
  };

  const q2 = new THREE.Quaternion().setFromUnitVectors(Viewer3D.V(0, 1, 0), dir);
  const q1 = new THREE.Quaternion().setFromUnitVectors(Viewer3D.V(0, 1, 0), dir.clone().negate());

  viewer.dimensionGroup.add(line, makeCone(q2, p2), makeCone(q1, p1));
}

function dimLine(p1, p2, offsetDir, label, color) {
  const n = offsetDir.clone().normalize();
  const gap = Viewer3D.cm(params.extGapCm);
  const targetOff = params.dimFixedOffset
    ? Viewer3D.cm(params.dimPlaneOffsetCm)
    : (gap + Viewer3D.cm(params.extLenCm));

  const s1 = p1.clone().add(n.clone().multiplyScalar(gap));
  const e1 = p1.clone().add(n.clone().multiplyScalar(targetOff));
  const s2 = p2.clone().add(n.clone().multiplyScalar(gap));
  const e2 = p2.clone().add(n.clone().multiplyScalar(targetOff));

  const mat = new THREE.LineBasicMaterial({
    color: new THREE.Color(color || 0x207aff),
    depthTest: !params.dimAlwaysOnTop,
    depthWrite: !params.dimAlwaysOnTop,
    transparent: params.dimAlwaysOnTop
  });

  const L1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([s1, e1]), mat);
  const L2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints([s2, e2]), mat);
  L1.renderOrder = L2.renderOrder = params.dimAlwaysOnTop ? 999 : 0;

  viewer.dimensionGroup.add(L1, L2);

  const head = Viewer3D.cm(params.arrowHeadCm);
  const rad = Viewer3D.cm(params.arrowRadiusCm);
  const dir = Viewer3D.V().subVectors(e2, e1).normalize();
  const off = Viewer3D.cm(params.dimOffsetCm);

  const a1 = e1.clone().add(dir.clone().multiplyScalar(off));
  const a2 = e2.clone().add(dir.clone().multiplyScalar(-off));
  arrowBoth(a1, a2, color, head, rad);

  const mid = a1.clone().add(a2).multiplyScalar(0.5).add(n.clone().multiplyScalar(Viewer3D.cm(params.labelOffsetCm)));
  return viewer.addLabel(label, mid, color);
}

function setupGUI() {
  const rangeControls = [
    { id: 'flange-lip', param: 'flangeLip', display: 'flange-lip-display' },
    { id: 'flange-thick', param: 'flangeThick', display: 'flange-thick-display' },
    { id: 'metal-rough', param: 'metalRough', display: 'metal-rough-display' },
    { id: 'metalness', param: 'metalness', display: 'metalness-display' }
  ];

  rangeControls.forEach(({ id, param, display }) => {
    const range = document.getElementById(`${id}-range`);
    const displayEl = document.getElementById(display);

    if (range && displayEl) {
      range.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        params[param] = value;

        if (param === 'metalRough' || param === 'metalness') {
          displayEl.textContent = value.toFixed(2);
        } else {
          displayEl.textContent = value.toFixed(1);
        }

        if (param === 'metalRough') metalMat.roughness = value;
        if (param === 'metalness') metalMat.metalness = value;

        build();
      });
    }
  });

  const checkboxControls = [
    { id: 'show-edges', param: 'showEdges' },
    { id: 'show-dims', param: 'showDims' },
    { id: 'show-flange', param: 'showFlange' },
    { id: 'keep-view', param: 'keepViewOnEdit' }
  ];

  checkboxControls.forEach(({ id, param }) => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        params[param] = e.target.checked;
        build();
      });
    }
  });

  const colorControls = [
    { id: 'color-w1', param: 'colorW1' },
    { id: 'color-h1', param: 'colorH1' },
    { id: 'color-l', param: 'colorL' }
  ];

  colorControls.forEach(({ id, param }) => {
    const colorInput = document.getElementById(id);
    if (colorInput) {
      colorInput.addEventListener('change', (e) => {
        params[param] = e.target.value;
        build();
      });
    }
  });
}

// Export parameters for parent
window.P = params;