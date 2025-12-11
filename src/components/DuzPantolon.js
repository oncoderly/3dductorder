// DuzPantolon - Düz Pantolon Side Branch (Dirsek + Taper Prizma Kombinasyonu)
import * as THREE from 'three';
import { BasePart } from './BasePart.js';
import { ReduksiyonDirsek } from './ReduksiyonDirsek.js';
import { Reduksiyon } from './Reduksiyon.js';

export class DuzPantolon extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.name = 'Düz Pantolon';

    // Alt component'leri oluştur (geometri için kullanılacak)
    this.elbowPart = new ReduksiyonDirsek(scene, materials);
    this.taperPart = new Reduksiyon(scene, materials);

    // Ortak yükseklik parametresi
    this.sharedH = 80;
  }

  initDefaultParams() {
    super.initDefaultParams();

    // Düz Pantolon'a özel parametreler
    this.defaultParams = {
      ...this.defaultParams,

      // Ortak
      H: 80, // Ortak yükseklik (W1 ve H1 olarak kullanılacak)

      // Dirsek parametreleri
      elbowH1: 25,
      elbowW2: 30,
      elbowH2: 20,
      elbowR_in: 20,
      elbowA: 90,
      elbowT: 0.12,
      elbowSteps: 100,

      // Taper parametreleri
      taperW1: 100,
      taperW2: 60,
      taperH2: 40,
      taperL: 120,
      taperT: 0.12,
      taperSteps: 120,

      // Geometri
      edgeSegs: 6,

      // Görünüm
      showSideLabels: true,

      // Renkler
      colorW1: '#007bff',
      colorH1: '#ffd400',
      colorW2: '#00c853',
      colorH2: '#ff8c00',
      colorR: '#ff1744',
      colorA: '#7e57c2',
      colorL: '#00bcd4'
    };

    this.params = { ...this.defaultParams };
  }

  getParameterDefinitions() {
    const common = this.getCommonParameterDefinitions();

    return {
      groups: [
        {
          name: '🔗 Ortak Parametreler',
          params: [
            { key: 'H', label: 'H (Ortak Yükseklik)', type: 'number', min: 1, max: 400, step: 1, unit: 'cm' }
          ]
        },
        {
          name: '🔄 Dirsek Parametreleri',
          params: [
            { key: 'elbowH1', label: 'Dirsek H1', type: 'number', min: 1, max: 200, step: 1, unit: 'cm' },
            { key: 'elbowW2', label: 'Dirsek W2', type: 'number', min: 1, max: 200, step: 1, unit: 'cm' },
            { key: 'elbowH2', label: 'Dirsek H2', type: 'number', min: 1, max: 200, step: 1, unit: 'cm' },
            { key: 'elbowR_in', label: 'İç Yarıçap (R)', type: 'number', min: 1, max: 300, step: 1, unit: 'cm' },
            { key: 'elbowA', label: 'Açı (A)', type: 'number', min: 10, max: 180, step: 1, unit: '°' },
            { key: 'elbowT', label: 'Sac Kalınlığı', type: 'number', min: 0.02, max: 1, step: 0.01, unit: 'cm' },
            { key: 'elbowSteps', label: 'Segment Sayısı', type: 'number', min: 16, max: 400, step: 1 }
          ]
        },
        {
          name: '📐 Taper Parametreleri',
          params: [
            { key: 'taperW1', label: 'Taper W1', type: 'number', min: 1, max: 400, step: 1, unit: 'cm' },
            { key: 'taperW2', label: 'Taper W2', type: 'number', min: 1, max: 400, step: 1, unit: 'cm' },
            { key: 'taperH2', label: 'Taper H2', type: 'number', min: 1, max: 400, step: 1, unit: 'cm' },
            { key: 'taperL', label: 'Uzunluk (L)', type: 'number', min: 1, max: 1000, step: 1, unit: 'cm' },
            { key: 'taperT', label: 'Sac Kalınlığı', type: 'number', min: 0.02, max: 1, step: 0.01, unit: 'cm' },
            { key: 'taperSteps', label: 'Segment Sayısı', type: 'number', min: 8, max: 400, step: 1 }
          ]
        },
        {
          name: 'Geometri',
          params: [
            { key: 'edgeSegs', label: 'Kesit Kenar Segmenti', type: 'number', min: 2, max: 16, step: 1 }
          ]
        },
        {
          name: 'Görünüm',
          params: [
            ...common.view,
            { key: 'showSideLabels', label: 'Yüz Etiketleri', type: 'checkbox' }
          ]
        },
        {
          name: 'Renkler',
          params: [
            { key: 'colorW1', label: 'W1 Rengi', type: 'color' },
            { key: 'colorH1', label: 'H1 Rengi', type: 'color' },
            { key: 'colorW2', label: 'W2 Rengi', type: 'color' },
            { key: 'colorH2', label: 'H2 Rengi', type: 'color' },
            { key: 'colorR', label: 'R Rengi', type: 'color' },
            { key: 'colorA', label: 'Açı Rengi', type: 'color' },
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

  buildGeometry() {
    // Ortak parametreyi her iki component'e aktar
    this.sharedH = this.params.H;

    // Dirsek parametrelerini ayarla
    this.elbowPart.params = {
      ...this.elbowPart.params,
      W1: this.sharedH,
      H1: this.params.elbowH1,
      W2: this.params.elbowW2,
      H2: this.params.elbowH2,
      R_in: this.params.elbowR_in,
      A: this.params.elbowA,
      t: this.params.elbowT,
      steps: this.params.elbowSteps,
      edgeSegs: this.params.edgeSegs,
      showEdges: false, // Ana component kontrol edecek
      showDims: false,
      showFlange: false
    };

    // Taper parametrelerini ayarla
    this.taperPart.params = {
      ...this.taperPart.params,
      W1: this.params.taperW1,
      H1: this.sharedH,
      W2: this.params.taperW2,
      H2: this.params.taperH2,
      L: this.params.taperL,
      t: this.params.taperT,
      steps: this.params.taperSteps,
      edgeSegs: this.params.edgeSegs,
      showEdges: false,
      showDims: false,
      showFlange: false
    };

    // Geçici gruplar oluştur
    const tempElbowGroup = new THREE.Group();
    const tempTaperGroup = new THREE.Group();

    // Geçici sahne referanslarını ayarla
    const originalElbowScene = this.elbowPart.scene;
    const originalTaperScene = this.taperPart.scene;

    // Geçici scene wrapper'lar
    const elbowSceneWrapper = {
      geometryGroup: tempElbowGroup,
      flangeGroup: new THREE.Group(),
      dimensionGroup: new THREE.Group(),
      labelGroup: new THREE.Group(),
      clearLabels: () => {},
      clearGroup: () => {}
    };

    const taperSceneWrapper = {
      geometryGroup: tempTaperGroup,
      flangeGroup: new THREE.Group(),
      dimensionGroup: new THREE.Group(),
      labelGroup: new THREE.Group(),
      clearLabels: () => {},
      clearGroup: () => {}
    };

    this.elbowPart.scene = elbowSceneWrapper;
    this.taperPart.scene = taperSceneWrapper;

    // Geometrileri oluştur
    this.elbowPart.buildGeometry();
    this.taperPart.buildGeometry();

    // Scene'leri geri yükle
    this.elbowPart.scene = originalElbowScene;
    this.taperPart.scene = originalTaperScene;

    // Dirsek'i ana sahneye ekle (orijin noktasında)
    this.scene.geometryGroup.add(tempElbowGroup);

    // Taper'ı dirseğin bitiş noktasına yerleştir
    // Dirsek sonu pozisyonunu hesapla
    const elbowAngle = THREE.MathUtils.degToRad(this.params.elbowA);
    const elbowRin = BasePart.cm(this.params.elbowR_in);
    const elbowW1 = BasePart.cm(this.sharedH);
    const elbowRcenter = elbowRin + elbowW1 / 2;

    // Dirsek bitiş pozisyonu
    const elbowEndX = -elbowRcenter * Math.cos(elbowAngle);
    const elbowEndZ = elbowRcenter * Math.sin(elbowAngle);

    // Taper'ı döndür ve pozisyonlandır
    tempTaperGroup.rotation.y = -elbowAngle; // Z ekseni dirsek bitiş yönüne baksın
    tempTaperGroup.position.set(elbowEndX, 0, elbowEndZ);

    this.scene.geometryGroup.add(tempTaperGroup);

    // Alan hesabı için referansları sakla
    this.elbowMeshes = tempElbowGroup;
    this.taperMeshes = tempTaperGroup;
  }

  buildFlange() {
    if (!this.params.showFlange) return;

    const lip = BasePart.cm(this.params.flangeLip);
    const fth = BasePart.cm(this.params.flangeThick);

    // Dirsek başlangıç flanşı
    const elbowW2 = BasePart.cm(this.params.elbowW2);
    const elbowH2 = BasePart.cm(this.params.elbowH2);
    const elbowRin = BasePart.cm(this.params.elbowR_in);
    const elbowW1 = BasePart.cm(this.sharedH);
    const elbowRcenter = elbowRin + elbowW1 / 2;

    const flElbowStart = this.createFlangeRect(elbowW2, elbowH2, lip, fth);

    // Dirsek başlangıç pozisyonu
    const elbowStartX = -elbowRcenter;
    const elbowStartZ = 0;
    flElbowStart.position.set(elbowStartX, 0, elbowStartZ - fth * 0.5);

    this.scene.flangeGroup.add(flElbowStart);

    // Taper bitiş flanşı
    const taperW1 = BasePart.cm(this.params.taperW1);
    const taperH1 = BasePart.cm(this.sharedH);
    const taperL = BasePart.cm(this.params.taperL);

    const flTaperEnd = this.createFlangeRect(taperW1, taperH1, lip, fth);

    // Taper bitiş pozisyonu (dirsek sonundan sonra)
    const elbowAngle = THREE.MathUtils.degToRad(this.params.elbowA);
    const elbowEndX = -elbowRcenter * Math.cos(elbowAngle);
    const elbowEndZ = elbowRcenter * Math.sin(elbowAngle);

    const taperEndOffset = new THREE.Vector3(0, 0, taperL);
    taperEndOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -elbowAngle);

    flTaperEnd.position.set(
      elbowEndX + taperEndOffset.x,
      0,
      elbowEndZ + taperEndOffset.z + fth * 0.5
    );
    flTaperEnd.rotation.y = -elbowAngle;

    this.scene.flangeGroup.add(flTaperEnd);
  }

  drawDimensions() {
    // Basit ölçülendirme - sadece temel boyutları göster
    if (!this.params.showDims) return;

    const elbowW2 = BasePart.cm(this.params.elbowW2);
    const elbowH2 = BasePart.cm(this.params.elbowH2);
    const elbowRin = BasePart.cm(this.params.elbowR_in);
    const elbowW1 = BasePart.cm(this.sharedH);
    const elbowRcenter = elbowRin + elbowW1 / 2;

    // Dirsek başlangıç ölçüleri
    const elbowStartX = -elbowRcenter;
    const p0 = new THREE.Vector3(elbowStartX, 0, 0);

    this.createDimensionLine(
      p0.clone().add(new THREE.Vector3(-elbowW2/2, elbowH2/2, 0)),
      p0.clone().add(new THREE.Vector3(elbowW2/2, elbowH2/2, 0)),
      new THREE.Vector3(0, 1, 0),
      `W2 = ${BasePart.formatDimension(this.params.elbowW2)} cm`,
      this.params.colorW2,
      'elbowW2'
    );

    this.createDimensionLine(
      p0.clone().add(new THREE.Vector3(elbowW2/2, -elbowH2/2, 0)),
      p0.clone().add(new THREE.Vector3(elbowW2/2, elbowH2/2, 0)),
      new THREE.Vector3(1, 0, 0),
      `H2 = ${BasePart.formatDimension(this.params.elbowH2)} cm`,
      this.params.colorH2,
      'elbowH2'
    );

    // Ortak H ölçüsü
    const elbowAngle = THREE.MathUtils.degToRad(this.params.elbowA);
    const elbowEndX = -elbowRcenter * Math.cos(elbowAngle);
    const elbowEndZ = elbowRcenter * Math.sin(elbowAngle);
    const p1 = new THREE.Vector3(elbowEndX, 0, elbowEndZ);

    this.createDimensionLine(
      p1.clone().add(new THREE.Vector3(0, -this.params.elbowH1/200, 0)),
      p1.clone().add(new THREE.Vector3(0, this.sharedH/200, 0)),
      new THREE.Vector3(Math.cos(-elbowAngle), 0, Math.sin(-elbowAngle)),
      `H = ${BasePart.formatDimension(this.sharedH)} cm`,
      this.params.colorH1,
      'H'
    );
  }

  calculateArea() {
    // Her iki component'in alanlarını topla
    let totalArea = 0;

    if (this.elbowMeshes) {
      this.elbowMeshes.traverse(child => {
        if (child.isMesh && child.geometry) {
          const pos = child.geometry.attributes.position;
          const idx = child.geometry.index;

          if (idx) {
            for (let i = 0; i < idx.count; i += 3) {
              const a = new THREE.Vector3().fromBufferAttribute(pos, idx.array[i]);
              const b = new THREE.Vector3().fromBufferAttribute(pos, idx.array[i + 1]);
              const c = new THREE.Vector3().fromBufferAttribute(pos, idx.array[i + 2]);
              totalArea += this.triangleArea(a, b, c);
            }
          }
        }
      });
    }

    if (this.taperMeshes) {
      this.taperMeshes.traverse(child => {
        if (child.isMesh && child.geometry) {
          const pos = child.geometry.attributes.position;
          const idx = child.geometry.index;

          if (idx) {
            for (let i = 0; i < idx.count; i += 3) {
              const a = new THREE.Vector3().fromBufferAttribute(pos, idx.array[i]);
              const b = new THREE.Vector3().fromBufferAttribute(pos, idx.array[i + 1]);
              const c = new THREE.Vector3().fromBufferAttribute(pos, idx.array[i + 2]);
              totalArea += this.triangleArea(a, b, c);
            }
          }
        }
      });
    }

    return {
      outer: totalArea,
      inner: 0
    };
  }

  addEdges() {
    if (!this.params.showEdges) return;

    // Her iki mesh grubuna kenar çizgileri ekle
    [this.elbowMeshes, this.taperMeshes].forEach(group => {
      if (group) {
        group.traverse(child => {
          if (child.isMesh && child.geometry) {
            const edges = new THREE.LineSegments(
              new THREE.EdgesGeometry(child.geometry, 1),
              this.materials.get('edge')
            );
            group.add(edges);
          }
        });
      }
    });
  }

  getDimensions() {
    return {
      H: this.params.H,
      elbowW2: this.params.elbowW2,
      elbowH2: this.params.elbowH2,
      elbowH1: this.params.elbowH1,
      elbowR_in: this.params.elbowR_in,
      elbowA: this.params.elbowA,
      taperW1: this.params.taperW1,
      taperW2: this.params.taperW2,
      taperH2: this.params.taperH2,
      taperL: this.params.taperL
    };
  }
}
