# 🚀 Hızlı Başlangıç Rehberi

## 1️⃣ Sunucuyu Başlat

```bash
node server.js
```

Sunucu `http://localhost:3001` adresinde çalışacak.

## 2️⃣ Ana Sayfayı Aç

Tarayıcıda şu adresi aç:
```
http://localhost:3001/index-new.html
```

Üç seçenek göreceksin:
- **🚀 Modüler Viewer** - Yeni sistem
- **📋 Sipariş Sistemi** - Sipariş yönetimi
- **📦 Tekil Parçalar** - Eski sistem

## 3️⃣ Yeni Viewer'ı Kullan

### Adım 1: Parça Seç
Üst menüden parça tipini seç (örn: Düz Kanal)

### Adım 2: Parametreleri Ayarla
Sağ panelden (mobilde alt panel):
- **📏 Boyutlar**: W, H, L değerlerini ayarla
- **👁️ Görünüm**: Kenar çizgileri, ölçülendirme
- **🔧 Flanş**: Flanş ayarları
- **✨ Malzeme**: Pürüzlülük, metallik
- **🎨 Renkler**: Ölçü çizgisi renkleri
- **📊 Alan**: Atık oranı, K faktörü

### Adım 3: 3D Görünümü İncele
- **Sol tık + sürükle**: Döndür
- **Sağ tık + sürükle**: Pan (kaydır)
- **Mouse tekerlek**: Zoom
- **Alt'taki butonlar**: Hazır görünümler (Top, Front, Right, vb.)

### Adım 4: Alan Bilgisini Kontrol Et
Alt panelde otomatik hesaplanan:
- Dış alan
- K faktörü uygulanmış alan
- Atık dahil toplam alan

## 4️⃣ Mobil Kullanım

### Dikey Ekran 📱
- Üst yarı: 3D görünüm
- Alt yarı: Parametreler

### Yatay Ekran 📱
- Sol: 3D görünüm (60%)
- Sağ: Parametreler (40%)

### Touch Kontroller
- **1 parmak**: Döndür
- **2 parmak pinch**: Zoom
- **2 parmak sürükle**: Pan

## 5️⃣ Yeni Parça Ekle

### Şablon Kopyala

```javascript
// src/components/YeniParcam.js
import { BasePart } from './BasePart.js';

export class YeniParcam extends BasePart {
  constructor(scene, materials) {
    super(scene, materials);
    this.initParams();
  }

  initParams() {
    super.initDefaultParams();
    this.params = {
      ...this.params,
      boyut1: 50,
      boyut2: 30
    };
  }

  getParameterDefinitions() {
    return {
      dimensions: [
        {
          key: 'boyut1',
          label: 'Boyut 1',
          min: 10,
          max: 200,
          step: 0.1,
          unit: 'cm',
          default: 50
        }
      ]
    };
  }

  buildGeometry() {
    // Three.js ile geometri oluştur
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geo, this.materials.get('metal'));
    this.scene.geometryGroup.add(mesh);
  }

  calculateArea() {
    return { outer: 1.0 }; // m² cinsinden
  }

  getDimensions() {
    return {
      B1: this.params.boyut1,
      B2: this.params.boyut2
    };
  }
}
```

### Config'e Ekle

```javascript
// src/config/parts-config.js
'yeni-parcam': {
  name: 'Yeni Parçam',
  icon: '🆕',
  description: 'Parça açıklaması',
  component: 'YeniParcam'
}
```

### App'e Ekle

```javascript
// src/app.js
import { YeniParcam } from './components/YeniParcam.js';

// loadPart() içinde:
case 'yeni-parcam':
  this.currentPart = new YeniParcam(this.scene, this.materials);
  break;
```

## 6️⃣ Sorun Giderme

### Viewer Açılmıyor
✅ Sunucu çalışıyor mu? → `node server.js`
✅ Doğru port'ta mı? → `http://localhost:3001`
✅ Console'da hata var mı? → F12 basıp kontrol et

### 3D Görünüm Yok
✅ Tarayıcı WebGL destekliyor mu?
✅ Three.js CDN yüklendi mi?
✅ Canvas elementi var mı?

### Parametreler Çalışmıyor
✅ `getParameterDefinitions()` doğru mu?
✅ `this.params` set edildi mi?
✅ `rebuild()` çağrılıyor mu?

## 7️⃣ Yararlı Komutlar

### Console'da State Göster
```javascript
window.app.exportCurrentState()
```

### Mevcut Parçayı Göster
```javascript
window.app.currentPart
```

### Sahne Nesnesini İncele
```javascript
window.app.scene
```

## 8️⃣ Klavye Kısayolları

| Tuş | Fonksiyon |
|-----|-----------|
| F11 | Tam ekran |
| F12 | Developer tools |
| Ctrl + | Zoom in |
| Ctrl - | Zoom out |

## 9️⃣ En İyi Pratikler

### Performans
- `steps` parametresini 16-32 arası tut
- Gereksiz edge gösterme
- Mobilde daha düşük kalite

### Kod Kalitesi
- Her parça için ayrı dosya
- Anlamlı değişken isimleri
- Console.log'ları production'da kaldır

### Mobil
- Touch-friendly buton boyutları (min 44px)
- Viewport meta tag kullan
- Landscape modunu test et

## 🔟 Ek Kaynaklar

- **Three.js Docs**: https://threejs.org/docs/
- **MDN Web Docs**: https://developer.mozilla.org/
- **YENI_SISTEM_README.md**: Detaylı dokümantasyon

## 💡 İpuçları

1. **Her zaman console'u aç** - Hatalar orada görünür
2. **Küçük değişiklikler yap** - Test et, commit et
3. **Mobilde test et** - Developer tools'da device emulation
4. **README'yi oku** - Detaylı bilgi orada
5. **Kod örneklerine bak** - DuzKanal.js iyi bir örnek

## 🎉 Hazırsın!

Artık sistemi kullanmaya ve geliştirmeye hazırsın. İyi çalışmalar! 🚀

---

**Kısa Özet:**
```bash
# 1. Sunucuyu başlat
node server.js

# 2. Tarayıcıda aç
http://localhost:3001/index-new.html

# 3. Viewer'a git ve kullan!
```
