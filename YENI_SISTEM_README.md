# 🧰 3D Kanal Görüntüleyici - Yeni Modüler Sistem

## 🎯 Genel Bakış

Bu proje, hava kanalı fittings parçalarını 3D olarak görüntülemek, boyutlandırmak ve alan hesabı yapmak için geliştirilmiş **modüler** ve **mobil-uyumlu** bir sistemdir.

## ✨ Özellikler

### 🏗️ Modüler Mimari
- **Component-Based**: Her parça (Düz Kanal, Redüksiyon, vb.) ayrı bir component
- **Base Class**: Tüm parçalar `BasePart` class'ından türer
- **Kod Tekrarı Yok**: Ortak işlevler core modüllerinde
- **Kolay Genişletme**: Yeni parça eklemek sadece yeni bir class yazmak

### 📱 Mobil Uyumlu
- **Responsive Design**: Telefon, tablet ve desktop'ta mükemmel görünüm
- **Touch-Friendly**: Dokunmatik kontrollerle tam uyumluluk
- **Adaptive Layout**: Ekran boyutuna göre otomatik yerleşim
- **Landscape Support**: Yatay ve dikey ekran desteği

### 🎨 Standart Arayüz
- Tüm parçalarda aynı UX
- Modern ve temiz tasarım
- Kolay kullanım
- Anında geri bildirim

### 🔧 Teknik Özellikler
- Three.js ile 3D render
- Gerçek zamanlı parametrik modelleme
- Otomatik alan hesaplama
- İnteraktif ölçülendirme
- Export/Import desteği

## 📁 Proje Yapısı

```
3dductorder/
├── src/
│   ├── core/                    # Ortak çekirdek modüller
│   │   ├── Scene3D.js          # 3D sahne yöneticisi
│   │   └── Materials.js        # Malzeme kütüphanesi
│   │
│   ├── components/              # Parça componentleri
│   │   ├── BasePart.js         # Ana base class
│   │   ├── DuzKanal.js         # Düz kanal
│   │   ├── ReduksiyonDirsek.js # Redüksiyon dirsek (yapılacak)
│   │   └── ...                 # Diğer parçalar
│   │
│   ├── ui/                      # Kullanıcı arayüzü
│   │   ├── ParameterPanel.js   # Parametre paneli
│   │   └── ViewControls.js     # Görünüm kontrolleri
│   │
│   ├── config/                  # Konfigürasyon
│   │   └── parts-config.js     # Parça tanımları
│   │
│   ├── styles/                  # CSS dosyaları
│   │   └── viewer.css          # Ana stil dosyası
│   │
│   └── app.js                   # Ana uygulama
│
├── index.html                  # Yeni viewer sayfası
├── index.html                   # Sipariş sistemi (mevcut)
└── server.js                    # Node.js sunucu
```

## 🚀 Kullanım

### Sunucuyu Başlatma

```bash
node server.js
```

Sunucu `http://localhost:3001` adresinde çalışacaktır.

### Viewer'ı Açma

1. Tarayıcıda `http://localhost:3001/index.html` adresine gidin
2. Üst menüden parça seçin
3. Sağ panelden parametreleri ayarlayın
4. 3D görünümü inceleyin

### Mobil Kullanım

- **Dikey Mod**: Üstte 3D görünüm, altta parametreler
- **Yatay Mod**: Solda 3D görünüm, sağda parametreler
- **Touch Kontroller**:
  - 1 parmak: Döndür
  - 2 parmak: Zoom
  - 3 parmak: Pan

## 🆕 Yeni Parça Ekleme

### 1. Component Oluştur

```javascript
// src/components/YeniParca.js
import { BasePart } from './BasePart.js';

export class YeniParca extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();
    this.params = {
      ...this.params,
      // Özel parametreler
      genislik: 30,
      yukseklik: 40
    };
  }

  getParameterDefinitions() {
    return {
      dimensions: [
        { key: 'genislik', label: 'Genişlik', min: 10, max: 200, step: 0.1, unit: 'cm', default: 30 },
        { key: 'yukseklik', label: 'Yükseklik', min: 10, max: 200, step: 0.1, unit: 'cm', default: 40 }
      ]
    };
  }

  buildGeometry() {
    // Geometri oluşturma kodu
  }

  calculateArea() {
    // Alan hesaplama kodu
    return { outer: 0 };
  }

  getDimensions() {
    return {
      W: this.params.genislik,
      H: this.params.yukseklik
    };
  }
}
```

### 2. Config'e Ekle

```javascript
// src/config/parts-config.js
export const PARTS_CONFIG = {
  // ...
  'yeni-parca': {
    name: 'Yeni Parça',
    icon: '🆕',
    description: 'Yeni parça açıklaması',
    component: 'YeniParca'
  }
};
```

### 3. App.js'e Import Et

```javascript
// src/app.js
import { YeniParca } from './components/YeniParca.js';

// loadPart() fonksiyonunda:
case 'yeni-parca':
  this.currentPart = new YeniParca(this.scene, this.materials);
  break;
```

## 🎨 Arayüz Özelleştirme

### CSS Değişkenleri

Ana renkler `src/styles/viewer.css` dosyasında tanımlanmıştır:

```css
/* Ana renkler */
background: #0b0e12;
border-color: #39414f;
accent-color: #4cc3ff;
text-color: #e6edf3;
```

### Responsive Breakpoints

- Desktop: > 768px
- Tablet: 481px - 768px
- Mobile: ≤ 480px

## 📊 Alan Hesaplama

Sistem otomatik olarak:
- Dış yüzey alanını hesaplar
- K faktörü uygular
- Atık oranını ekler
- Flanş alanını (opsiyonel) dahil eder

## 🔗 Sipariş Sistemi Entegrasyonu

Yeni viewer, mevcut sipariş sistemi ile uyumludur:

```javascript
// Parent window'dan state alma
window.postMessage({ type: 'getState' }, '*');

// Response
{
  type: 'state',
  params: { /* parametreler */ },
  dimensions: { /* boyutlar */ },
  area: { /* alan bilgisi */ }
}
```

## 🐛 Hata Ayıklama

### Console'da Hata Görürseniz

1. Tarayıcı console'unu açın (F12)
2. Hata mesajını okuyun
3. İlgili dosyayı kontrol edin

### 3D Görünüm Yüklenmiyorsa

- Three.js CDN bağlantısını kontrol edin
- Canvas elementinin var olduğundan emin olun
- Tarayıcı WebGL destekliyor mu kontrol edin

## 📈 Performans

- **Lazy Loading**: Parçalar sadece seçildiğinde yüklenir
- **Geometry Pooling**: Geometriler yeniden kullanılır
- **Render Optimization**: Sadece değişiklik olduğunda render
- **Memory Management**: Kullanılmayan nesneler temizlenir

## 🔜 Gelecek Özellikler

- [ ] Redüksiyon Dirsek component'i
- [ ] ES Parçası component'i
- [ ] Plenum Box component'i
- [ ] Screenshot/Export özelliği
- [ ] Undo/Redo fonksiyonu
- [ ] Preset yönetimi
- [ ] Dark/Light theme
- [ ] Multi-language support

## 📝 Notlar

### Eski Sistem vs Yeni Sistem

**Eski Sistem:**
- Her parça için ayrı HTML dosyası
- Kod tekrarı
- Zor bakım
- Standart olmayan arayüz

**Yeni Sistem:**
- Tek HTML, dinamik yükleme
- Kod tekrarı yok
- Kolay bakım
- Standart arayüz
- Mobil uyumlu

### Geçiş Planı

1. ✅ Düz Kanal yeni sisteme taşındı
2. ⏳ Diğer parçalar sırayla taşınacak
3. ⏳ Test ve optimizasyon
4. ⏳ Eski sistem kaldırılacak

## 💡 İpuçları

### Geliştirme

- Her parça için unit test yazın
- Console.log yerine debugger kullanın
- Git commit'lerinizi küçük tutun

### Performans

- `steps` parametresini 16-32 arası tutun
- Çok fazla edge gösterimi performansı düşürür
- Mobilde daha düşük kalite ayarları kullanın

## 📞 Destek

Sorularınız için:
1. Console'daki hata mesajlarını kontrol edin
2. Bu README'yi tekrar okuyun
3. Kod örneklerine bakın
4. Issue açın (varsa GitHub repository)

## 🙏 Teşekkürler

Bu proje [Three.js](https://threejs.org/) kütüphanesini kullanmaktadır.

---

**Son Güncelleme**: 2025-01-28
**Versiyon**: 2.0.0
**Durum**: 🚧 Aktif Geliştirme
