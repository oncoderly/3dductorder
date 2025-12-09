# SİPARİŞ SİSTEMİ - Uygulama Planı

## 📋 GENEL BAKIŞ

Kullanıcı 3D görüntüleyicide bir parça tasarladığında, **"Siparişe Ekle"** butonuna basarak:
1. Parçanın 4 yönden (ön, sağ, üst, izometrik) ekran görüntüsü otomatik alınır
2. Parça parametreleri, boyutlar ve alan bilgisi kaydedilir
3. Sipariş sepetine eklenir
4. Kullanıcı sipariş sayfasında tüm parçaları görebilir, düzenleyebilir ve siparişi tamamlayabilir

---

## 🎯 ÖZELLİK GEREKSİNİMLERİ

### 1. "Siparişe Ekle" Butonu
- **Konum**: ViewCube'ün yanında (sağ alt köşe) veya üst başlıkta
- **Görünüm**: Büyük, belirgin, mobil uyumlu buton
- **İkon**: 🛒 (sepet ikonu) + "Siparişe Ekle" metni
- **Durum**: Sipariş sepetinde kaç parça olduğunu gösterir (badge sayı)

### 2. 4 Yönden Ekran Görüntüsü
Otomatik çekim yapılacak açılar:
- **Ön görünüm** (Front): 0, 0, 3
- **Sağ görünüm** (Right): 3, 0, 0
- **Üst görünüm** (Top): 0, 3, 0
- **İzometrik görünüm** (Isometric): 2, 2, 2

Her görüntü için:
- Kamera pozisyonunu ayarla
- Grid/eksen/ölçüleri geçici gizle (temiz görüntü)
- Canvas'ı render et
- PNG/JPEG olarak base64 string'e çevir
- Orijinal görünüme geri dön

### 3. Sipariş Verisi
Her sipariş kalemi şunları içerecek:
```javascript
{
  id: "unique-id-123",
  timestamp: 1234567890,
  partType: "duz-kanal",
  partName: "Düz Kanal",
  params: { w1: 120, h: 80, l: 100, ... },
  dimensions: { "Genişlik": 120, "Yükseklik": 80, ... },
  area: 2.45,
  quantity: 1,
  screenshots: {
    front: "data:image/png;base64,...",
    right: "data:image/png;base64,...",
    top: "data:image/png;base64,...",
    iso: "data:image/png;base64,..."
  }
}
```

### 4. Sipariş Sepeti
**LocalStorage Kullanımı**:
- Key: `"ductcalc-orders"`
- Değer: JSON array of order items
- Max boyut: ~5MB (yaklaşık 20-30 parça)

**Sepet İşlemleri**:
- Ekleme (addToCart)
- Silme (removeFromCart)
- Düzenleme (updateQuantity)
- Temizleme (clearCart)
- Export (JSON/Excel)

### 5. Sipariş Sayfası (`orders.html`)
Yeni bir sayfa oluşturulacak:

**Layout**:
```
┌─────────────────────────────────────┐
│  Header: Logo + "Sipariş Sepeti"   │
├─────────────────────────────────────┤
│  Özet: X parça, Y m² toplam alan   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Parça 1: Düz Kanal              │ │
│ │ [4 görüntü gallery]             │ │
│ │ Boyutlar: 120x80x100 cm         │ │
│ │ Alan: 2.45 m²                   │ │
│ │ Adet: [1] [↑↓]  [Sil] [Düzenle]│ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Parça 2: ...                    │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Sepeti Temizle]  [Excel İndir]    │
│               [Sipariş Tamamla] 🚀 │
└─────────────────────────────────────┘
```

**Özellikler**:
- Her parçanın 4 görüntüsü küçük galeri şeklinde
- Adet artırma/azaltma
- Parçayı düzenleme (viewer'a geri gönder)
- Parçayı silme
- Excel export (tüm parametreler + özet)
- Sipariş özeti (toplam parça, alan, tahmini süre)
- Mobil responsive tasarım

---

## 🏗️ TEKNİK MİMARİ

### Yeni Dosyalar

#### 1. `src/core/ScreenshotCapture.js`
```javascript
export class ScreenshotCapture {
  constructor(scene, camera, renderer)

  async captureView(viewName, hideUI = true)
  // viewName: 'front', 'right', 'top', 'iso'
  // hideUI: Grid, axes, dimensions'ları gizle
  // return: base64 PNG string

  async captureAllViews()
  // Tüm 4 görünümü sırayla çek
  // return: { front, right, top, iso }
}
```

**Implementasyon Detayları**:
- `renderer.render()` ile manuel render
- `canvas.toDataURL('image/png', 0.8)` ile base64'e çevir
- Promise kullan (her render sonrası bekleme)
- UI elementlerini geçici gizle/göster
- Kamera pozisyonunu sakla ve geri yükle

#### 2. `src/core/OrderManager.js`
```javascript
export class OrderManager {
  constructor()

  addToCart(orderItem)
  removeFromCart(itemId)
  updateQuantity(itemId, quantity)
  getCart()
  clearCart()
  getCartSummary() // { totalItems, totalArea, totalQuantity }
  exportToExcel()
}
```

**LocalStorage İşlemleri**:
- `localStorage.getItem('ductcalc-orders')`
- `localStorage.setItem('ductcalc-orders', JSON.stringify(cart))`
- Error handling (quota exceeded)

#### 3. `src/ui/OrderButton.js`
```javascript
export class OrderButton {
  constructor(container, onAddToCart)

  render() // Butonu oluştur
  updateBadge(count) // Sepet sayısını güncelle
  showLoading() // Screenshot alınırken loading
  showSuccess() // Başarılı ekleme animasyonu
}
```

**Tasarım**:
- Floating action button (FAB) stili
- Sağ alt, ViewCube'ün üstünde
- Badge: küçük kırmızı daire (sepet sayısı)
- Loading: spinner animasyonu
- Success: yeşil tick + scale animasyonu

#### 4. `orders.html` + `src/orders.js` + `src/styles/orders.css`
Yeni sipariş sayfası için tam stack.

### Mevcut Dosya Değişiklikleri

#### `src/app.js`
```javascript
import { ScreenshotCapture } from './core/ScreenshotCapture.js';
import { OrderManager } from './core/OrderManager.js';
import { OrderButton } from './ui/OrderButton.js';

class App {
  constructor() {
    // ...
    this.screenshotCapture = null;
    this.orderManager = null;
    this.orderButton = null;
  }

  init() {
    // ...
    this.setupOrderSystem();
  }

  setupOrderSystem() {
    this.screenshotCapture = new ScreenshotCapture(
      this.scene,
      this.scene.camera,
      this.scene.renderer
    );

    this.orderManager = new OrderManager();

    const buttonContainer = document.querySelector('.canvas-wrapper');
    this.orderButton = new OrderButton(buttonContainer, () => {
      this.handleAddToCart();
    });

    // Badge'i güncelle
    const cart = this.orderManager.getCart();
    this.orderButton.updateBadge(cart.length);
  }

  async handleAddToCart() {
    try {
      this.orderButton.showLoading();

      // 4 görüntüyü çek
      const screenshots = await this.screenshotCapture.captureAllViews();

      // Sipariş kalemi oluştur
      const orderItem = {
        id: `order-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        partType: this.getCurrentPartKey(),
        partName: this.currentPart.constructor.name,
        params: this.currentPart.exportParams(),
        dimensions: this.currentPart.getDimensions(),
        area: this.currentPart.calculateArea(),
        quantity: 1,
        screenshots: screenshots
      };

      // Sepete ekle
      this.orderManager.addToCart(orderItem);

      // Badge güncelle
      const cart = this.orderManager.getCart();
      this.orderButton.updateBadge(cart.length);

      this.orderButton.showSuccess();

    } catch (error) {
      this.errorHandler.error('Siparişe eklenemedi', error.message);
    }
  }
}
```

#### `viewer.html`
Header'a sipariş sayfası linki ekle:
```html
<div class="header-right">
  <a href="/orders.html" class="orders-link">
    🛒 Siparişlerim <span class="orders-badge">0</span>
  </a>
</div>
```

---

## 🎨 UI/UX TASARIMI

### OrderButton Tasarımı
```css
.order-fab {
  position: absolute;
  bottom: 220px; /* ViewCube'ün üstünde */
  right: 20px;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
  border: none;
  cursor: pointer;
  z-index: 999;
}

.order-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.6);
}

.order-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
}
```

### Mobil Responsive
- Tablet (768px): bottom: 160px, width: 56px
- Mobil (480px): bottom: 140px, width: 48px, icon-only (text gizli)

---

## 📊 SİPARİŞ SAYFASI ÖZELLİKLERİ

### 1. Parça Kartı
```html
<div class="order-item-card">
  <div class="order-item-header">
    <h3>Düz Kanal</h3>
    <button class="delete-btn">🗑️</button>
  </div>

  <div class="order-screenshots">
    <img src="..." alt="Ön görünüm">
    <img src="..." alt="Sağ görünüm">
    <img src="..." alt="Üst görünüm">
    <img src="..." alt="İzometrik">
  </div>

  <div class="order-dimensions">
    <span>Genişlik: 120 cm</span>
    <span>Yükseklik: 80 cm</span>
    <span>Uzunluk: 100 cm</span>
  </div>

  <div class="order-area">
    Alan: <strong>2.45 m²</strong>
  </div>

  <div class="order-quantity">
    <label>Adet:</label>
    <button class="qty-btn">−</button>
    <input type="number" value="1" min="1">
    <button class="qty-btn">+</button>
  </div>

  <button class="edit-btn">Düzenle ✏️</button>
</div>
```

### 2. Özet Panel
```html
<div class="order-summary">
  <h2>Sipariş Özeti</h2>
  <div class="summary-row">
    <span>Toplam Parça Çeşidi:</span>
    <strong>5</strong>
  </div>
  <div class="summary-row">
    <span>Toplam Adet:</span>
    <strong>12</strong>
  </div>
  <div class="summary-row">
    <span>Toplam Alan:</span>
    <strong>24.5 m²</strong>
  </div>
  <div class="summary-row highlight">
    <span>Tahmini Üretim:</span>
    <strong>2-3 gün</strong>
  </div>
</div>
```

### 3. Excel Export Format
```
Sipariş No: ORD-20250109-001
Tarih: 09.01.2025 14:30

| Sıra | Parça Tipi     | W1  | H   | L   | Alan  | Adet | Toplam Alan |
|------|----------------|-----|-----|-----|-------|------|-------------|
| 1    | Düz Kanal      | 120 | 80  | 100 | 2.45  | 2    | 4.90        |
| 2    | Redüksiyon     | 120 | 80  | 60  | 1.80  | 1    | 1.80        |
...

Toplam: 5 çeşit, 12 adet, 24.5 m²
```

---

## ⚠️ KARAR NOKTALARI

### 1. Buton Konumu
**Seçenekler**:
- A) Sağ alt, ViewCube'ün üstünde (floating FAB)
- B) Header'da, parça seçicinin yanında
- C) ViewControls içinde (grid/axes yanında)

**Önerim**: **A** - En erişilebilir, mobilde de kullanışlı

### 2. Screenshot Çözünürlüğü
**Seçenekler**:
- A) Canvas'ın native çözünürlüğü (değişken)
- B) Sabit 1024x768
- C) Sabit 512x512 (daha küçük dosya)

**Önerim**: **C** - localStorage limiti için, yeterli kalite

### 3. Screenshot Format
**Seçenekler**:
- A) PNG (yüksek kalite, büyük boyut)
- B) JPEG 0.8 quality (makul kalite, küçük boyut)
- C) WebP (en iyi compression, bazı tarayıcılarda sorun)

**Önerim**: **B** - En iyi denge

### 4. LocalStorage Limitine Ulaşılırsa
**Seçenekler**:
- A) Hata göster, eski siparişleri sil
- B) Otomatik en eski 5 siparişi sil
- C) Sunucuya gönder (backend gerektirir)

**Önerim**: **A** - Kullanıcı kontrolü, data kaybı yok

### 5. Sipariş Düzenleme
**Seçenekler**:
- A) Viewer'a geri git, parametreleri yükle
- B) Inline editing (orders.html içinde)
- C) Modal popup ile düzenle

**Önerim**: **A** - En kolay implementasyon

---

## 🚀 UYGULAMA ADIMLARI

### Aşama 1: Screenshot Sistemi
1. ScreenshotCapture.js oluştur
2. 4 görünüm çekme fonksiyonu
3. UI gizleme/gösterme
4. Test: Manual buton ile screenshot

### Aşama 2: Order Butonu
1. OrderButton.js oluştur
2. FAB stili CSS
3. Badge sistemi
4. Loading/success animasyonları
5. App.js'e entegre et

### Aşama 3: OrderManager
1. OrderManager.js oluştur
2. LocalStorage CRUD işlemleri
3. Cart summary hesaplamaları
4. Error handling

### Aşama 4: Sipariş Sayfası
1. orders.html layout
2. orders.css styling
3. orders.js logic (cart render, delete, edit)
4. Excel export fonksiyonu

### Aşama 5: Entegrasyon & Test
1. Viewer → Orders link
2. Orders → Viewer edit flow
3. Mobil responsive test
4. LocalStorage limit test

---

## 📱 MOBİL UYUMLULUK

### Buton Pozisyonları
- Desktop: bottom: 220px, right: 20px
- Tablet: bottom: 160px, right: 10px
- Mobil: bottom: 140px, right: 8px

### Screenshot Boyutu
- Desktop: 512x512
- Mobil: 512x512 (aynı, localStorage için optimize)

### Sipariş Sayfası
- Desktop: 3 sütun grid
- Tablet: 2 sütun grid
- Mobil: 1 sütun stack

---

## 🎯 BAŞARI KRİTERLERİ

✅ Kullanıcı tek tıkla siparişe ekleyebilir
✅ 4 görüntü otomatik çekilir (<2 saniye)
✅ Sepette en az 20-30 parça saklanabilir
✅ Sipariş sayfası mobilde kusursuz çalışır
✅ Excel export doğru formatta çalışır
✅ UI gizleme/gösterme smooth ve bug-free
✅ LocalStorage limiti yönetilir

---

## ⏱️ TAHMİNİ SÜRE

- Aşama 1-2: ~2 saat (Screenshot + Buton)
- Aşama 3: ~1 saat (OrderManager)
- Aşama 4: ~3 saat (Orders sayfası)
- Aşama 5: ~1 saat (Test & Polish)

**Toplam**: ~7 saat

---

## 🤔 SORULAR & ONAY

1. **Buton konumu**: Sağ alt FAB uygun mu?
2. **Screenshot format**: JPEG 0.8 quality yeterli mi?
3. **LocalStorage limit**: 5MB (~20-30 parça) kabul edilebilir mi?
4. **Düzenleme akışı**: Viewer'a geri gönderme mantıklı mı?
5. **Excel format**: Yukarıdaki tablo formatı uygun mu?

Onayınız sonrası implementasyona başlayacağım! 🚀
