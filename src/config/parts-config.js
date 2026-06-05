// Part Configuration - Parça tanımları
export const PARTS_CONFIG = {
  'duz-kanal': {
    name: 'Düz Kanal',
    icon: '📦',
    iconPath: '/ico/duzkanal.ico',
    description: 'Dikdörtgen kesitli düz hava kanalı',
    component: 'DuzKanal'
  },
  'kortapa': {
    name: 'Kortapa',
    icon: '[]',
    iconPath: '/ico/kortapa.ico',
    description: 'Tek ucu kapali duz kanal',
    component: 'Kortapa'
  },
  'reduksiyon-dirsek': {
    name: 'Redüksiyonlu Dirsek',
    icon: '🔄',
    iconPath: '/ico/reduksiyonludirsek.ico',
    description: 'Redüksiyonlu çeyrek dirsek',
    component: 'ReduksiyonDirsek'
  },
  'reduksiyon-dirsek-boyunlu': {
    name: 'Reduksiyonlu Dirsek Boyunlu',
    icon: 'ğŸ”„',
    iconPath: '/ico/reduksiyonludirsek.ico',
    description: 'Cikis boynu B olculu reduksiyonlu dirsek',
    component: 'ReduksiyonDirsekBoyunlu'
  },
  'dirsek': {
    name: 'Dirsek',
    icon: '🔄',
    iconPath: '/ico/dirsek.ico',
    description: 'Eş kesitli çeyrek dirsek',
    component: 'Dirsek'
  },
  'es-parcasi': {
    name: 'Es-Parcasi',
    icon: '⚡',
    iconPath: '/ico/es_parcas%C4%B1.ico',
    description: 'ES ofset parçası (eşit kesit)',
    component: 'EsParcasi'
  },
  'es-reduksiyonlu': {
    name: 'Es-Reduksiyonlu',
    icon: '⚡',
    iconPath: '/ico/es_parcas%C4%B1.ico',
    description: 'ES redüksiyonlu geçiş parçası',
    component: 'EsReduksiyonlu'
  },
  'plenum-box': {
    name: 'Plenum Box',
    icon: '📮',
    iconPath: '/ico/plenum_box.ico',
    description: 'Plenum box 4 yüz',
    component: 'PlenumBox'
  },
  'kareden-yuvarlaga': {
    name: 'Kareden Yuvarlağa',
    icon: '🔷',
    iconPath: '/ico/kareden_yuvarlaga.ico',
    description: 'Kareden yuvarlağa geçiş',
    component: 'KaredenYuvarlaga'
  },
  'reduksiyon': {
    name: 'Redüksiyon',
    icon: '📐',
    iconPath: '/ico/reduksiyon.ico',
    description: 'Taper prizma redüksiyon',
    component: 'Reduksiyon'
  },
  'yaka': {
    name: 'Yaka',
    icon: '📐',
    iconPath: '/ico/yaka.ico',
    description: 'Tek yükseklik ölçülü redüksiyon',
    component: 'Yaka'
  },
  'side-branch-2': {
    name: 'Side Branch 2',
    icon: '🔷',
    iconPath: '/ico/side_branch2.ico',
    description: 'Redüksiyonlu Dirsek (Side Branch 2)',
    component: 'SideBranch2'
  },
  'y-branch-2': {
    name: 'Y-Branch 2',
    icon: '🔱',
    iconPath: '/ico/y_branch_2.ico',
    description: 'Y-Branch (ReduksiyonDirsek tabanlı)',
    component: 'YBranch2'
  },
  'manson': {
    name: 'Manşon',
    icon: 'O',
    iconPath: '/ico/manson.ico',
    description: 'Silindirik manson parcasi',
    component: 'Manson'
  },
  'spiro-dirsek': {
    name: 'Spiro Dirsek',
    icon: 'O',
    iconPath: '/ico/manson.ico',
    description: 'Yuvarlak kesitli spiro dirsek',
    component: 'SpiroDirsek'
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
