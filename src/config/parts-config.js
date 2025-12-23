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
  'dirsek': {
    name: 'Dirsek',
    icon: '🔄',
    description: 'Eş kesitli çeyrek dirsek',
    component: 'Dirsek'
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
  },
  'yaka': {
    name: 'Yaka',
    icon: '📐',
    description: 'Tek yükseklik ölçülü redüksiyon',
    component: 'Yaka'
  },
  'duz-pantolon': {
    name: 'Düz Pantolon',
    icon: '🔀',
    description: 'Düz pantolon side branch (taper prizma)',
    component: 'DuzPantolon'
  },
  'side-branch': {
    name: 'Side Branch',
    icon: '🔱',
    description: 'Dirsek + Taper Prizma birleşik parça (pozisyon ayarlanabilir)',
    component: 'SideBranch'
  },
  'side-branch-2': {
    name: 'Side Branch 2',
    icon: '🔷',
    description: 'Redüksiyonlu Dirsek (Side Branch 2)',
    component: 'SideBranch2'
  },
  'y-branch': {
    name: 'Y-Branch',
    icon: '🔱',
    description: 'İki kollu simetrik Y dallanma (çift dirsek)',
    component: 'YBranch'
  },
  'y-branch-2': {
    name: 'Y-Branch 2',
    icon: '🔱',
    description: 'Y-Branch (ReduksiyonDirsek tabanlı)',
    component: 'YBranch2'
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
