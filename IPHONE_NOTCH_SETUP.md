# iPhone Çentiği (Notch) Ayarları - iOS Kurulum Rehberi

## 🎯 Sorun
iPhone çentiği ile header bar çakışması ve yazıların okunamaması sorunu.

## ✅ Yapılan Değişiklikler

### 1. Web Tarafı (Tamamlandı)
- **TopHeaderBar.tsx**: `ios-header-safe-area` CSS class'ı eklendi
- **index.css**: iPhone çentiği için maksimum padding kuralları eklendi
- **Capacitor Config**: iOS safe area ayarları eklendi

### 2. iOS Native Tarafı (Xcode'da Yapılması Gereken)

#### A. Xcode'da Proje Açıldıktan Sonra:

1. **Sol panelde "App" projesini seçin**
2. **"TARGETS" altında "App" seçin**
3. **"General" sekmesine gidin**

#### B. Deployment Info Ayarları:
- **iOS Deployment Target**: 14.0 (minimum)
- **Devices**: iPhone seçili olmalı
- **Orientation**: Portrait seçili olmalı

#### C. Status Bar Ayarları:
- **Status Bar Style**: Dark Content
- **Hide status bar**: ❌ (işaretli olmamalı)
- **Status Bar Overlays Web View**: ❌ (işaretli olmamalı)

#### D. Safe Area Ayarları:
- **Safe Area Layout Guides**: ✅ (işaretli olmalı)
- **Use Safe Area Layout Guides**: ✅ (işaretli olmalı)

#### E. Build Settings:
1. **"Build Settings" sekmesine gidin**
2. **"Architectures" bölümünde:**
   - **Architectures**: `arm64` (iPhone için)
   - **Valid Architectures**: `arm64`

3. **"Linking" bölümünde:**
   - **Other Linker Flags**: `-ObjC` ekleyin

#### F. Info.plist Kontrolü:
Aşağıdaki ayarların mevcut olduğundan emin olun:
```xml
<key>UIViewControllerBasedStatusBarAppearance</key>
<true/>
<key>UIStatusBarStyle</key>
<string>UIStatusBarStyleDarkContent</string>
<key>UIStatusBarHidden</key>
<false/>
<key>UIStatusBarOverridesContent</key>
<false/>
```

#### G. Main.storyboard Kontrolü:
1. **Main.storyboard dosyasını açın**
2. **View Controller'ı seçin**
3. **Attributes Inspector'da:**
   - **Extend Edges**: ✅ "Under Top Bars" işaretli olmalı
   - **Safe Area**: ✅ "Safe Area Layout Guides" işaretli olmalı

#### H. AppDelegate.swift Kontrolü:
Aşağıdaki metodların mevcut olduğundan emin olun:
```swift
override var preferredStatusBarStyle: UIStatusBarStyle {
    return .lightContent
}

override var prefersStatusBarHidden: Bool {
    return false
}

override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation {
    return .fade
}
```

## 🚀 Test Etme

### 1. Simulator'da Test:
1. **Xcode'da "Product" > "Run" seçin**
2. **iPhone 14 Pro, 15 Pro gibi çentikli cihaz seçin**
3. **Header bar'ın çentik ile çakışmadığını kontrol edin**

### 2. Gerçek Cihazda Test:
1. **iPhone'u Mac'e bağlayın**
2. **Xcode'da cihazı seçin**
3. **"Product" > "Run" ile cihazda test edin**

## 🔧 Sorun Giderme

### Eğer Hala Çakışma Varsa:
1. **CSS padding değerlerini artırın** (`src/index.css`)
2. **iOS build settings'de safe area ayarlarını kontrol edin**
3. **Xcode'da "Product" > "Clean Build Folder" yapın**
4. **Projeyi yeniden build edin**

### CSS Padding Değerlerini Artırma:
```css
.ios-header-safe-area {
  padding-top: 250px !important;  /* Daha fazla padding */
  min-height: 330px !important;
}
```

## 📱 Desteklenen Cihazlar
- iPhone X (10)
- iPhone XS / XS Max
- iPhone 11 / 11 Pro / 11 Pro Max
- iPhone 12 / 12 mini / 12 Pro / 12 Pro Max
- iPhone 13 / 13 mini / 13 Pro / 13 Pro Max
- iPhone 14 / 14 Plus / 14 Pro / 14 Pro Max
- iPhone 15 / 15 Plus / 15 Pro / 15 Pro Max

## ✅ Başarı Kriterleri
- [ ] Header bar çentik ile çakışmıyor
- [ ] Saat (22:06) tamamen görünür
- [ ] Uygulama adı (Movilo) tamamen görünür
- [ ] Tüm iPhone modellerinde çalışıyor
- [ ] Safe area doğru şekilde kullanılıyor

## 🆘 Yardım
Eğer sorun devam ederse:
1. Xcode console'da hata mesajlarını kontrol edin
2. CSS padding değerlerini artırın
3. iOS build settings'de safe area ayarlarını kontrol edin
4. Projeyi temizleyip yeniden build edin
