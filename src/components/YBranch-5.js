// Y-Branch 5 Component - Kusursuzlaştırılmış Y-Kol
// - 'sidebranch-2.js' ve 'YBranch-2.js' kodlarından ilham almıştır.
// - İki bağımsız kol (A ve B) bulunur.
// - Geometri, flanş ve ölçülendirme mantığı daha sağlam ve hatasız olacak şekilde yeniden düzenlenmiştir.
import * as THREE from 'three';
import { BasePart } from './BasePart.js';

export class YBranch5 extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.name = 'Y-Branch 5';
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();

    this.params = {
      ...this.params,
      // Branch A
      W1A: 40, 
      H1A: 25,
      W2A: 30,
      H2A: 20,
      R_inA: 20,
      A1: 45,
      
      // Branch B
      W1B: 40,
      H1B: 25,
      W2B: 30,
      H2B: 20,
      R_inB: 20,
      A2: 45,

      // Genel
      t: 0.12,
      steps: 100,

      // Renkler
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
            { key: 'W1A', label: 'Bitiş Genişlik A (W1A)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
            { key: 'H1A', label: 'Bitiş Yükseklik A (H1A)', min: 10, max: 200, step: 1, unit: 'cm', default: 25 },
            { key: 'W2A', label: 'Başlangıç Genişlik A (W2A)', min: 10, max: 200, step: 1, unit: 'cm', default: 30 },
            { key: 'H2A', label: 'Başlangıç Yükseklik A (H2A)', min: 10, max: 200, step: 1, unit: 'cm', default: 20 },
            { key: 'R_inA', label: 'İç Yarıçap A (R_inA)', min: 1, max: 300, step: 1, unit: 'cm', default: 20 },
            { key: 'A1', label: 'Açı A (A1)', min: 10, max: 90, step: 1, unit: '°', default: 45 }
          ]
        },
        {
          name: 'Branch B Ölçüleri',
          params: [
            { key: 'W1B', label: 'Bitiş Genişlik B (W1B)', min: 10, max: 200, step: 1, unit: 'cm', default: 40 },
            { key: 'H1B', label: 'Bitiş Yükseklik B (H1B)', min: 10, max: 200, step: 1, unit: 'cm', default: 25 },
            { key: 'W2B', label: 'Başlangıç Genişlik B (W2B)', min: 10, max: 200, step: 1, unit: 'cm', default: 30 },
            { key: 'H2B', label: 'Başlangıç Yükseklik B (H2B)', min: 10, max: 200, step: 1, unit: 'cm', default: 20 },
            { key: 'R_inB', label: 'İç Yarıçap B (R_inB)', min: 1, max: 300, step: 1, unit: 'cm', default: 20 },
            { key: 'A2', label: 'Açı B (A2)', min: 10, max: 90, step: 1, unit: '°', default: 45 }
          ]
        },
        { name: 'Genel Ayarlar', params: [
            { key: 't', label: 'Sac Kalınlığı', min: 0.02, max: 1.0, step: 0.01, unit: 'cm', default: 0.12 },
            { key: 'steps', label: 'Segment Sayısı', min: 16, max: 400, step: 1, unit: '', default: 100 }
        ]},
        { name: 'Görünüm', params: common.view },
        { name: 'Renkler', params: [
            { key: 'colorW1', label: 'W1 Rengi', type: 'color', default: '#007bff' },
            { key: 'colorH1', label: 'H1 Rengi', type: 'color', default: '#ffd400' },
            { key: 'colorW2', label: 'W2 Rengi', type: 'color', default: '#00c853' },
            { key: 'colorH2', label: 'H2 Rengi', type: 'color', default: '#ff8c00' },
            { key: 'colorR', label: 'R Rengi', type: 'color', default: '#ff1744' },
            { key: 'colorA', label: 'Açı Rengi', type: 'color', default: '#7e57c2' }
        ]},
        { name: 'Flanş Ayarları', params: common.flange },
        { name: 'Malzeme Özellikleri', params: common.material },
        { name: 'Ölçülendirme Ayarları', params: common.dimension },
        { name: 'Alan Hesabı', params: common.area }
      ]
    };
  }

  buildGeometry() {
    const t = BasePart.cm(this.params.t);
    const steps = Math.max(16, Math.floor(this.params.steps));

    // Branch A parameters
    const W1A = BasePart.cm(this.params.W1A);
    const H1A = BasePart.cm(this.params.H1A);
    const W2A = BasePart.cm(this.params.W2A);
    const H2A = BasePart.cm(this.params.H2A);
    const R_inA = BasePart.cm(this.params.R_inA);
    const thetaA = THREE.MathUtils.degToRad(this.params.A1);

    // Branch B parameters
    const W1B = BasePart.cm(this.params.W1B);
    const H1B = BasePart.cm(this.params.H1B);
    const W2B = BasePart.cm(this.params.W2B);
    const H2B = BasePart.cm(this.params.H2B);
    const R_inB = BasePart.cm(this.params.R_inB);
    const thetaB = THREE.MathUtils.degToRad(this.params.A2);

    const elbowA = this.createElbow(1, W1A, H1A, W2A, H2A, R_inA, thetaA, t, steps);
    const elbowB = this.createElbow(-1, W1B, H1B, W2B, H2B, R_inB, thetaB, t, steps);

    const vertices = [];
    const indices = [];
    const N = 4;
    const quad = (a, b, c, d) => { indices.push(a, b, c, a, c, d); };

    const addElbowToGeometry = (elbow) => {
      const baseOuter = vertices.length / 3;
      elbow.ringsOuter.forEach(ring => ring.forEach(v => vertices.push(v.x, v.y, v.z)));
      const baseInner = vertices.length / 3;
      elbow.ringsInner.forEach(ring => ring.forEach(v => vertices.push(v.x, v.y, v.z)));
      
      for (let i = 0; i < steps; i++) {
        const b0_out = baseOuter + i * N;
        const b1_out = baseOuter + (i + 1) * N;
        for (let k = 0; k < N; k++) {
          quad(b0_out + k, b0_out + (k + 1) % N, b1_out + (k + 1) % N, b1_out + k);
        }
        
        const b0_in = baseInner + i * N;
        const b1_in = baseInner + (i + 1) * N;
        for (let k = 0; k < N; k++) {
          quad(b1_in + k, b1_in + (k + 1) % N, b0_in + (k + 1) % N, b0_in + k);
        }
      }
    };

    addElbowToGeometry(elbowA);
    addElbowToGeometry(elbowB);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, this.materials.get('metal'));
    this.scene.geometryGroup.add(mesh);

    this.mainGeometry = geometry;
    this.elbowA = elbowA;
    this.elbowB = elbowB;
  }

  createElbow(direction, W1, H1, W2, H2, Rin, theta, t, steps) {
    const ringsOuter = [];
    const ringsInner = [];
    
    // Path calculation
    const R_mid = Rin + (W1 + W2) / 4;
    const path = new THREE.CatmullRomCurve3(
        [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(R_mid * Math.sin(theta/2), 0, direction * R_mid * (1 - Math.cos(theta/2))),
            new THREE.Vector3(R_mid * Math.sin(theta), 0, direction * R_mid * Math.sin(theta))
        ]
    );

    const frames = path.getSpacedPoints(steps);
    const tangents = path.getTangents(steps);
    
    for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const pos = frames[i];
        
        const W = W2 + (W1 - W2) * u;
        const H = H2 + (H1 - H2) * u;
        const Wi = Math.max(W - 2 * t, 0.001);
        const Hi = Math.max(H - 2 * t, 0.001);

        const tangent = tangents[i];
        const binormal = new THREE.Vector3(0, 1, 0);
        const normal = new THREE.Vector3().crossVectors(tangent, binormal).normalize();

        const outerRing = [
            pos.clone().add(normal.clone().multiplyScalar(-W / 2)).add(binormal.clone().multiplyScalar(-H / 2)),
            pos.clone().add(normal.clone().multiplyScalar(W / 2)).add(binormal.clone().multiplyScalar(-H / 2)),
            pos.clone().add(normal.clone().multiplyScalar(W / 2)).add(binormal.clone().multiplyScalar(H / 2)),
            pos.clone().add(normal.clone().multiplyScalar(-W / 2)).add(binormal.clone().multiplyScalar(H / 2))
        ];

        const innerRing = [
            pos.clone().add(normal.clone().multiplyScalar(-Wi / 2)).add(binormal.clone().multiplyScalar(-Hi / 2)),
            pos.clone().add(normal.clone().multiplyScalar(Wi / 2)).add(binormal.clone().multiplyScalar(-Hi / 2)),
            pos.clone().add(normal.clone().multiplyScalar(Wi / 2)).add(binormal.clone().multiplyScalar(Hi / 2)),
            pos.clone().add(normal.clone().multiplyScalar(-Wi / 2)).add(binormal.clone().multiplyScalar(Hi / 2))
        ];
        
        ringsOuter.push(outerRing);
        ringsInner.push(innerRing);
    }
    
    // Rotate elbow to correct orientation
    const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), direction * -theta);
    const finalRing = ringsOuter[steps];
    const finalCenter = finalRing.reduce((acc, v) => acc.add(v), new THREE.Vector3()).divideScalar(4);
    
    ringsOuter.forEach(ring => ring.forEach(v => v.sub(finalCenter).applyQuaternion(rotation).add(finalCenter)));
    ringsInner.forEach(ring => ring.forEach(v => v.sub(finalCenter).applyQuaternion(rotation).add(finalCenter)));

    return { ringsOuter, ringsInner, path };
  }

  buildFlange() {
    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);

    // Branch A flanges
    const { W1A, H1A, W2A, H2A } = this.params;
    this.createFlangeAtRing(this.elbowA.ringsOuter[0], W2A, H2A, lip, fth, true);
    this.createFlangeAtRing(this.elbowA.ringsOuter[this.params.steps], W1A, H1A, lip, fth, false);

    // Branch B flanges
    const { W1B, H1B, W2B, H2B } = this.params;
    this.createFlangeAtRing(this.elbowB.ringsOuter[0], W2B, H2B, lip, fth, true);
    this.createFlangeAtRing(this.elbowB.ringsOuter[this.params.steps], W1B, H1B, lip, fth, false);
  }

  createFlangeAtRing(ring, W, H, lip, fth, isStart) {
    const center = ring.reduce((acc, v) => acc.add(v), new THREE.Vector3()).divideScalar(4);
    
    const v1 = new THREE.Vector3().subVectors(ring[1], ring[0]).normalize();
    const v2 = new THREE.Vector3().subVectors(ring[3], ring[0]).normalize();
    
    const tangent = new THREE.Vector3().crossVectors(v1, v2).normalize();
    if(isStart) tangent.negate();

    const flange = this.createFlangeRect(BasePart.m(W), BasePart.m(H), lip, fth);
    flange.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    flange.position.copy(center.clone().add(tangent.clone().multiplyScalar(fth/2)));

    this.scene.flangeGroup.add(flange);
  }

  addEdges() {
      const addEdgesForElbow = (elbow) => {
          if (!elbow || !elbow.ringsOuter) return;
          const segments = [];
          const rings = elbow.ringsOuter;

          for (let i = 0; i < rings.length - 1; i++) {
              for (let k = 0; k < 4; k++) {
                  segments.push(rings[i][k], rings[i+1][k]);
              }
          }
          for (let k = 0; k < 4; k++) {
              segments.push(rings[0][k], rings[0][(k + 1) % 4]);
              segments.push(rings[rings.length-1][k], rings[rings.length-1][(k + 1) % 4]);
          }
          
          const geometry = new THREE.BufferGeometry().setFromPoints(segments);
          const lines = new THREE.LineSegments(geometry, this.materials.get('edge'));
          this.scene.geometryGroup.add(lines);
      };

      addEdgesForElbow(this.elbowA);
      addEdgesForElbow(this.elbowB);
  }

  drawDimensions() {
      // Dimensions for Branch A
      this.drawElbowDimensions(this.elbowA, this.params.W1A, this.params.H1A, this.params.W2A, this.params.H2A, this.params.R_inA, this.params.A1, 'A');
      
      // Dimensions for Branch B
      this.drawElbowDimensions(this.elbowB, this.params.W1B, this.params.H1B, this.params.W2B, this.params.H2B, this.params.R_inB, this.params.A2, 'B');
  }

  drawElbowDimensions(elbow, W1, H1, W2, H2, Rin, A, suffix) {
      if (!elbow) return;

      const startRing = elbow.ringsOuter[0];
      const endRing = elbow.ringsOuter[this.params.steps];

      const startCenter = startRing.reduce((acc, v) => acc.add(v), new THREE.Vector3()).divideScalar(4);
      const endCenter = endRing.reduce((acc, v) => acc.add(v), new THREE.Vector3()).divideScalar(4);

      // W2, H2
      const p0_LB = startRing[0];
      const p0_RB = startRing[1];
      const p0_LT = startRing[3];
      const n0 = new THREE.Vector3().subVectors(p0_LT, p0_LB).normalize();
      const b0 = new THREE.Vector3().subVectors(p0_RB, p0_LB).normalize();

      this.createDimensionLine(p0_LB, p0_RB, b0.clone().negate(), `W2${suffix} = ${BasePart.formatDimension(W2)} cm`, this.params.colorW2, `W2${suffix}`);
      this.createDimensionLine(p0_LB, p0_LT, n0.clone().negate(), `H2${suffix} = ${BasePart.formatDimension(H2)} cm`, this.params.colorH2, `H2${suffix}`);

      // W1, H1
      const p1_LB = endRing[0];
      const p1_RB = endRing[1];
      const p1_LT = endRing[3];
      const n1 = new THREE.Vector3().subVectors(p1_LT, p1_LB).normalize();
      const b1 = new THREE.Vector3().subVectors(p1_RB, p1_LB).normalize();

      this.createDimensionLine(p1_LB, p1_RB, b1.clone().negate(), `W1${suffix} = ${BasePart.formatDimension(W1)} cm`, this.params.colorW1, `W1${suffix}`);
      this.createDimensionLine(p1_LB, p1_LT, n1.clone().negate(), `H1${suffix} = ${BasePart.formatDimension(H1)} cm`, this.params.colorH1, `H1${suffix}`);
      
      // Radius and Angle
      const arcCenter = elbow.path.getPoint(0.5);
      this.scene.addLabel(`R${suffix} = ${Rin}`, arcCenter, this.params.colorR);
      this.scene.addLabel(`A${suffix} = ${A}`, arcCenter.clone().add(new THREE.Vector3(0,0.1,0)), this.params.colorA);
  }
  
  getDimensions() {
    return {
      W1A: this.params.W1A, H1A: this.params.H1A, W2A: this.params.W2A, H2A: this.params.H2A, R_inA: this.params.R_inA, A1: this.params.A1,
      W1B: this.params.W1B, H1B: this.params.H1B, W2B: this.params.W2B, H2B: this.params.H2B, R_inB: this.params.R_inB, A2: this.params.A2,
      t: this.params.t
    };
  }
}
