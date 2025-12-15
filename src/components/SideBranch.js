// SideBranch - Dirsek + Taper Prizma Kombinasyonu
import * as THREE from 'three';
import { BasePart } from './BasePart.js';
import { ReduksiyonDirsek } from './ReduksiyonDirsek.js';
import { Reduksiyon } from './Reduksiyon.js';

export class SideBranch extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.name = 'Side Branch';

    // Alt component'leri oluştur
    this.elbowPart = new ReduksiyonDirsek(scene, materials);
    this.taperPart = new Reduksiyon(scene, materials);
  }

  initDefaultParams() {
    super.initDefaultParams();

    // Dirsek parametrelerini elbow_ prefix ile ekle
    const elbowDefaults = {
      elbow_W1: 40,
      elbow_H1: 25,
      elbow_W2: 30,
      elbow_H2: 20,
      elbow_t: 0.12,
      elbow_R_in: 20,
      elbow_A: 90,
      elbow_steps: 100,
      elbow_colorW1: '#007bff',
      elbow_colorH1: '#ffd400',
      elbow_colorW2: '#00c853',
      elbow_colorH2: '#ff8c00',
      elbow_colorR: '#ff1744',
      elbow_colorA: '#7e57c2'
    };

    // Taper parametrelerini taper_ prefix ile ekle
    const taperDefaults = {
      taper_W1: 100,
      taper_H1: 80,
      taper_W2: 60,
      taper_H2: 40,
      taper_L: 120,
      taper_t: 0.12,
      taper_steps: 120,
      taper_edgeSegs: 6,
      taper_modeW: 'central',
      taper_modeH: 'central',
      taper_offWcm: 0,
      taper_offHcm: 0,
      taper_showSideLabels: true,
      taper_colorW1: '#007bff',
      taper_colorH1: '#ffd400',
      taper_colorW2: '#00c853',
      taper_colorH2: '#ff8c00',
      taper_colorL: '#00bcd4'
    };

    this.defaultParams = {
      ...this.defaultParams,
      ...elbowDefaults,
      ...taperDefaults
    };

    this.params = { ...this.defaultParams };
  }

  getParameterDefinitions() {
    const common = this.getCommonParameterDefinitions();

    // Dirsek ve Taper'ın kendi parametrelerini al
    const elbowDefs = this.elbowPart.getParameterDefinitions();
    const taperDefs = this.taperPart.getParameterDefinitions();

    // Dirsek parametrelerini gruplayalım
    const elbowGroups = [];
    if (elbowDefs.dimensions) {
      elbowGroups.push({
        name: '🔄 Dirsek Ölçüleri',
        params: elbowDefs.dimensions.map(p => ({
          ...p,
          key: 'elbow_' + p.key,
          type: 'number' // ParameterPanel için type ekle
        }))
      });
    }
    if (elbowDefs.colors) {
      elbowGroups.push({
        name: '🔄 Dirsek Renkleri',
        params: elbowDefs.colors.map(p => ({
          ...p,
          key: 'elbow_' + p.key,
          type: 'color'
        }))
      });
    }

    // Taper parametrelerini gruplayalım
    const taperGroups = [];
    if (taperDefs.groups) {
      taperDefs.groups.forEach(group => {
        if (group.name === 'Ölçüler') {
          taperGroups.push({
            name: '📐 Taper Ölçüleri',
            params: group.params.map(p => ({
              ...p,
              key: 'taper_' + p.key
            }))
          });
        } else if (group.name === 'Renkler') {
          taperGroups.push({
            name: '📐 Taper Renkleri',
            params: group.params.map(p => ({
              ...p,
              key: 'taper_' + p.key
            }))
          });
        }
      });
    }

    return {
      groups: [
        ...elbowGroups,
        ...taperGroups,
        {
          name: 'Görünüm',
          params: common.view
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
    // Dirsek parametrelerini aktar (elbow_ prefix'ini kaldır)
    Object.keys(this.params).forEach(key => {
      if (key.startsWith('elbow_')) {
        const elbowKey = key.replace('elbow_', '');
        this.elbowPart.params[elbowKey] = this.params[key];
      }
    });

    // Taper parametrelerini aktar (taper_ prefix'ini kaldır)
    Object.keys(this.params).forEach(key => {
      if (key.startsWith('taper_')) {
        const taperKey = key.replace('taper_', '');
        this.taperPart.params[taperKey] = this.params[key];
      }
    });

    // Dirsek ve Taper'ın kendi görünüm parametrelerini ayarla
    this.elbowPart.params.showEdges = this.params.showEdges;
    this.elbowPart.params.showDims = this.params.showDims;
    this.elbowPart.params.showFlange = this.params.showFlange;
    this.elbowPart.params.keepViewOnEdit = this.params.keepViewOnEdit;

    // Ortak parametreleri de aktar (flanş, malzeme, ölçülendirme, alan)
    this.elbowPart.params.flangeLip = this.params.flangeLip;
    this.elbowPart.params.flangeThick = this.params.flangeThick;
    this.elbowPart.params.metalRough = this.params.metalRough;
    this.elbowPart.params.metalness = this.params.metalness;
    this.elbowPart.params.dimAlwaysOnTop = this.params.dimAlwaysOnTop;
    this.elbowPart.params.dimFixedOffset = this.params.dimFixedOffset;
    this.elbowPart.params.dimOffsetCm = this.params.dimOffsetCm;
    this.elbowPart.params.arrowHeadCm = this.params.arrowHeadCm;
    this.elbowPart.params.arrowRadiusCm = this.params.arrowRadiusCm;
    this.elbowPart.params.extLenCm = this.params.extLenCm;
    this.elbowPart.params.extGapCm = this.params.extGapCm;
    this.elbowPart.params.dimPlaneOffsetCm = this.params.dimPlaneOffsetCm;
    this.elbowPart.params.labelOffsetCm = this.params.labelOffsetCm;
    this.elbowPart.params.areaIncludeFlange = this.params.areaIncludeFlange;
    this.elbowPart.params.wastePercent = this.params.wastePercent;
    this.elbowPart.params.kFactor = this.params.kFactor;

    this.taperPart.params.showEdges = this.params.showEdges;
    this.taperPart.params.showDims = this.params.showDims;
    this.taperPart.params.showFlange = this.params.showFlange;
    this.taperPart.params.keepViewOnEdit = this.params.keepViewOnEdit;

    // Ortak parametreleri de aktar (flanş, malzeme, ölçülendirme, alan)
    this.taperPart.params.flangeLip = this.params.flangeLip;
    this.taperPart.params.flangeThick = this.params.flangeThick;
    this.taperPart.params.metalRough = this.params.metalRough;
    this.taperPart.params.metalness = this.params.metalness;
    this.taperPart.params.dimAlwaysOnTop = this.params.dimAlwaysOnTop;
    this.taperPart.params.dimFixedOffset = this.params.dimFixedOffset;
    this.taperPart.params.dimOffsetCm = this.params.dimOffsetCm;
    this.taperPart.params.arrowHeadCm = this.params.arrowHeadCm;
    this.taperPart.params.arrowRadiusCm = this.params.arrowRadiusCm;
    this.taperPart.params.extLenCm = this.params.extLenCm;
    this.taperPart.params.extGapCm = this.params.extGapCm;
    this.taperPart.params.dimPlaneOffsetCm = this.params.dimPlaneOffsetCm;
    this.taperPart.params.labelOffsetCm = this.params.labelOffsetCm;
    this.taperPart.params.areaIncludeFlange = this.params.areaIncludeFlange;
    this.taperPart.params.wastePercent = this.params.wastePercent;
    this.taperPart.params.kFactor = this.params.kFactor;

    // Geçici gruplar oluştur
    const tempElbowGeometry = new THREE.Group();
    const tempElbowFlange = new THREE.Group();
    const tempElbowDimension = new THREE.Group();

    const tempTaperGeometry = new THREE.Group();
    const tempTaperFlange = new THREE.Group();
    const tempTaperDimension = new THREE.Group();

    // Geçici sahne wrapper'lar
    const elbowSceneWrapper = {
      geometryGroup: tempElbowGeometry,
      flangeGroup: tempElbowFlange,
      dimensionGroup: tempElbowDimension,
      labelGroup: new THREE.Group(),
      clearLabels: () => {},
      clearGroup: () => {},
      addLabel: (label, position, color, paramData) => {
        // paramData'nın key'ine elbow_ prefix'i ekle
        if (paramData && paramData.key) {
          paramData = { ...paramData, key: 'elbow_' + paramData.key };
        }
        return this.scene.addLabel(label, position, color, paramData);
      },
      camera: this.scene.camera,
      controls: this.scene.controls
    };

    const taperSceneWrapper = {
      geometryGroup: tempTaperGeometry,
      flangeGroup: tempTaperFlange,
      dimensionGroup: tempTaperDimension,
      labelGroup: new THREE.Group(),
      clearLabels: () => {},
      clearGroup: () => {},
      addLabel: (label, position, color, paramData) => {
        // paramData'nın key'ine taper_ prefix'i ekle
        if (paramData && paramData.key) {
          paramData = { ...paramData, key: 'taper_' + paramData.key };
        }
        return this.scene.addLabel(label, position, color, paramData);
      },
      camera: this.scene.camera,
      controls: this.scene.controls
    };

    // Orijinal scene'leri sakla
    const originalElbowScene = this.elbowPart.scene;
    const originalTaperScene = this.taperPart.scene;

    // Geçici scene'leri ata
    this.elbowPart.scene = elbowSceneWrapper;
    this.taperPart.scene = taperSceneWrapper;

    // Her iki parçayı oluştur
    this.elbowPart.buildGeometry();

    if (this.params.showFlange && this.elbowPart.buildFlange) {
      this.elbowPart.buildFlange();
    }

    // Dirsek'i 180 derece döndür (X ekseni etrafında) + 90° Y ekseni
    tempElbowGeometry.rotation.x = Math.PI; // 180° = π radyan
    tempElbowGeometry.rotation.y = Math.PI / 2; // +90° = π/2 radyan (saat yönünün tersi)
    tempElbowFlange.rotation.x = Math.PI;
    tempElbowFlange.rotation.y = Math.PI / 2;
    tempElbowDimension.rotation.x = Math.PI;
    tempElbowDimension.rotation.y = Math.PI / 2;

    // Dirsek'i taper'a hizala - SOL tarafa hizala
    // Matrix'leri güncelle (rotation uygulandıktan sonra)
    tempElbowGeometry.updateMatrixWorld(true);

    // Bounding box hesapla
    const elbowBox = new THREE.Box3().setFromObject(tempElbowGeometry);

    // Taper'ın hedef pozisyonları (SOL TARAF)
    const taperW1 = BasePart.cm(this.params.taper_W1);
    const taperL = BasePart.cm(this.params.taper_L);
    const taperCX1 = this.calculateTaperCX(1, taperW1);
    const taperLeftEdgeX = taperCX1 - taperW1 / 2; // Taper'ın SOL kenarı
    const taperFrontEdgeZ = taperL / 2; // Taper'ın ön kenarı

    // Dirsek'in SOL kenarı ve ön kenarı (bounding box'tan)
    const elbowLeftEdgeX = elbowBox.min.x; // MIN = sol kenar
    const elbowFrontEdgeZ = elbowBox.max.z;

    // Offset: Dirsek'in sol-ön köşesini taper'ın sol-ön köşesine hizala
    const elbowOffsetX = taperLeftEdgeX - elbowLeftEdgeX;
    const elbowOffsetZ = taperFrontEdgeZ - elbowFrontEdgeZ;

    // Debug
    console.log('=== LEFT SIDE Alignment ===');
    console.log('Elbow BBox:', {
      min: { x: elbowBox.min.x, y: elbowBox.min.y, z: elbowBox.min.z },
      max: { x: elbowBox.max.x, y: elbowBox.max.y, z: elbowBox.max.z }
    });
    console.log('Taper target:', { leftX: taperLeftEdgeX, frontZ: taperFrontEdgeZ });
    console.log('Elbow edges:', { leftX: elbowLeftEdgeX, frontZ: elbowFrontEdgeZ });
    console.log('Offset:', { x: elbowOffsetX, z: elbowOffsetZ });

    tempElbowGeometry.position.set(elbowOffsetX, 0, elbowOffsetZ);
    tempElbowFlange.position.set(elbowOffsetX, 0, elbowOffsetZ);
    tempElbowDimension.position.set(elbowOffsetX, 0, elbowOffsetZ);

    this.taperPart.buildGeometry();

    if (this.params.showFlange && this.taperPart.buildFlange) {
      this.taperPart.buildFlange();
    }

    // Ölçülendirme çizgilerini çiz
    if (this.params.showDims) {
      if (this.elbowPart.drawDimensions) {
        this.elbowPart.drawDimensions();
      }
      if (this.taperPart.drawDimensions) {
        this.taperPart.drawDimensions();
      }
    }

    // Scene'leri geri yükle
    this.elbowPart.scene = originalElbowScene;
    this.taperPart.scene = originalTaperScene;

    // Tüm grupları ana sahneye ekle
    this.scene.geometryGroup.add(tempElbowGeometry);
    this.scene.geometryGroup.add(tempTaperGeometry);

    this.scene.flangeGroup.add(tempElbowFlange);
    this.scene.flangeGroup.add(tempTaperFlange);

    this.scene.dimensionGroup.add(tempElbowDimension);
    this.scene.dimensionGroup.add(tempTaperDimension);

    // Referansları sakla
    this.elbowMeshes = tempElbowGeometry;
    this.taperMeshes = tempTaperGeometry;
  }

  buildFlange() {
    // Flanş oluşturma buildGeometry içinde yapılıyor
  }

  drawDimensions() {
    // Ölçülendirme buildGeometry içinde yapılıyor
  }

  calculateArea() {
    // Her iki component'in alanlarını hesapla
    const elbowArea = this.elbowPart.calculateArea ? this.elbowPart.calculateArea() : { outer: 0 };
    const taperArea = this.taperPart.calculateArea ? this.taperPart.calculateArea() : { outer: 0 };

    return {
      outer: (elbowArea.outer || 0) + (taperArea.outer || 0),
      inner: 0
    };
  }

  addEdges() {
    // Kenar çizgileri buildGeometry içinde ekleniyor
  }

  getDimensions() {
    const elbowDims = this.elbowPart.getDimensions ? this.elbowPart.getDimensions() : {};
    const taperDims = this.taperPart.getDimensions ? this.taperPart.getDimensions() : {};

    return {
      ...Object.keys(elbowDims).reduce((acc, key) => {
        acc['elbow_' + key] = elbowDims[key];
        return acc;
      }, {}),
      ...Object.keys(taperDims).reduce((acc, key) => {
        acc['taper_' + key] = taperDims[key];
        return acc;
      }, {})
    };
  }

  // Taper'ın CX hesaplama metodu (Reduksiyon.js'den)
  calculateTaperCX(u, W) {
    const W1 = BasePart.cm(this.params.taper_W1);
    const W2 = BasePart.cm(this.params.taper_W2);
    const modeW = this.params.taper_modeW;
    const offWcm = BasePart.cm(this.params.taper_offWcm);

    if (modeW === 'flatLeft') {
      return -W / 2;
    } else if (modeW === 'flatRight') {
      return W / 2;
    } else if (modeW === 'value') {
      return offWcm;
    } else { // central
      const dW = W1 - W2;
      return -dW * u / 2;
    }
  }
}
