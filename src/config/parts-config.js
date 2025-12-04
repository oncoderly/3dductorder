// Part Configuration - Parça tanımları
export const PARTS_CONFIG = {
  'duz-kanal': {
    name: 'Düz Kanal',
    icon: '📦',
    description: 'Dikdörtgen kesitli düz hava kanalı',
    component: 'DuzKanal'
  },
  'reduksiyon-dirsek': {
    name: 'Redüksiyonlu Dirsek',
    icon: '🔄',
    description: 'Redüksiyonlu çeyrek dirsek',
    component: 'ReduksiyonDirsek'
  },
  'es-parcasi': {
    name: 'ES Parçası',
    icon: '⚡',
    description: 'ES bağlantı parçası',
    component: 'EsParcasi'
  },
  'plenum-box': {
    name: 'Plenum Box',
    icon: '📮',
    description: 'Plenum box 4 yüz',
    component: 'PlenumBox'
  },
  'kareden-yuvarlaga': {
    name: 'Kareden Yuvarlağa',
    icon: '🔷',
    description: 'Kareden yuvarlağa geçiş',
    component: 'KaredenYuvarlaga'
  },
  'reduksiyon': {
    name: 'Redüksiyon',
    icon: '📐',
    description: 'Taper prizma redüksiyon',
    component: 'Reduksiyon'
  }
};

export function getPartConfig(key) {
  return PARTS_CONFIG[key];
}

export function getAllParts() {
  return Object.keys(PARTS_CONFIG).map(key => ({
    key,
    ...PARTS_CONFIG[key]
  }));
}
