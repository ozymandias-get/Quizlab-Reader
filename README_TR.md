<p align="center">
  <img src="resources/icon.png" alt="Quizlab Reader Logo" width="180" height="180">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-28.0.0-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Vite-5.0.10-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Lisans-MIT-green?style=for-the-badge" alt="Lisans">
</p>

<h1 align="center">Quizlab Reader</h1>

<p align="center">
  <strong>PDF okuma ve yapay zeka asistanlarını bir arada sunan modern, bölünmüş ekranlı Electron uygulaması</strong>
</p>

<p align="center">
  <a href="./README.md">🇬🇧 English</a> •
  <a href="./docs/README_ZH.md">🇨🇳 中文</a> •
  <a href="./docs/README_HI.md">🇮🇳 हिन्दी</a> •
  <a href="./docs/README_ES.md">🇪🇸 Español</a> •
  <a href="./docs/README_AR.md">🇸🇦 العربية</a>
</p>

---

## 🎯 Genel Bakış

**Quizlab Reader**, okuma ve çalışma deneyimini geliştirmek isteyen öğrenciler ve araştırmacılar için tasarlanmış güçlü bir masaüstü uygulamasıdır. Bir tarafta PDF belgelerini görüntüleyebileceğiniz, diğer tarafta yapay zeka asistanları (ChatGPT veya Gemini) ile etkileşime geçebileceğiniz sorunsuz bir bölünmüş ekran arayüzü sunar.

### ✨ Temel Özellikler

| Özellik | Açıklama |
|---------|----------|
| 📄 **PDF Görüntüleyici** | Yakınlaştırma, gezinme ve metin seçimi özellikli tam donanımlı PDF görüntüleyici |
| 🤖 **Yapay Zeka Entegrasyonu** | ChatGPT ve Google Gemini için yerleşik destek |
| ✂️ **Metin Seçimi** | PDF'den metin seçin ve tek tıkla doğrudan yapay zekaya gönderin |
| 📸 **Ekran Görüntüsü Aracı** | PDF'in herhangi bir alanını yakalayın ve analiz için yapay zekaya gönderin |
| 🔄 **Otomatik Gönderme Modu** | Seçilen metni otomatik olarak yapay zekaya gönderin |
| 📐 **Yeniden Boyutlandırılabilir Paneller** | Tercihinize göre panelleri sürükleyerek yeniden boyutlandırın |
| 💾 **Kalıcı Ayarlar** | Tercihleriniz oturumlar arasında kaydedilir |
| 🎨 **Modern Arayüz** | Akıcı animasyonlarla cam efekti tasarımı |

---

## 🖼️ Ekran Görüntüleri

<details open>
<summary>Ekran görüntülerini görmek için tıklayın</summary>

### ChatGPT ile Ana Arayüz
Uygulama, cam efekti tasarım öğeleriyle temiz ve modern bir bölünmüş ekran arayüzü sunar.
![Ana Arayüz - ChatGPT](docs/screenshots/main-interface-chatgpt.png)

### Gemini ile Ana Arayüz
Alt çubuk kontrolleriyle yapay zeka platformları arasında sorunsuz geçiş yapın.
![Ana Arayüz - Gemini](docs/screenshots/main-interface-gemini.png)

### Temel Arayüz Öğeleri
- **Dosya Gezgini** - Sürükle-bırak destekli premium cam efekti başlık
- **PDF Görüntüleyici** - Sayfa gezinme, yakınlaştırma kontrolleri, kayan "AI'ya Gönder" butonu ile metin seçimi
- **Yapay Zeka Paneli** - Otomatik gönderme ile ChatGPT ve Gemini arasında geçiş
- **Alt Çubuk** - Yapay zeka platformlarına ve ayarlara hızlı erişim

</details>

---

## 🚀 Başlarken

### Gereksinimler

- **Node.js** 18.x veya üzeri
- **npm** 9.x veya üzeri
- **Git** (depoyu klonlamak için)

### Kurulum

1. **Depoyu klonlayın**
   ```bash
   git clone https://github.com/ozymandias-get/Quizlab-Reader.git
   cd Quizlab-Reader
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Geliştirme modunda çalıştırın**
   ```bash
   npm run dev
   ```

4. **Üretim için derleyin** (isteğe bağlı)
   ```bash
   npm run build
   ```

---

## 📁 Proje Yapısı

```
Quizlab-Reader/
├── src/
│   ├── main/                    # Electron ana süreci
│   │   └── index.js             # Ana giriş noktası, pencere yönetimi
│   │
│   ├── preload/                 # Ön yükleme betikleri
│   │   └── index.js             # Güvenli IPC köprüsü
│   │
│   └── renderer/                # React uygulaması
│       ├── index.html           # HTML giriş noktası
│       └── src/
│           ├── App.jsx          # Ana uygulama bileşeni
│           │
│           ├── components/      # React bileşenleri
│           │   ├── AiWebview.jsx        # Yapay zeka platformu webview'ı
│           │   ├── BottomBar.jsx        # Alt kontrol çubuğu
│           │   ├── FloatingButton.jsx   # "AI'ya Gönder" kayan butonu
│           │   ├── PdfViewer.jsx        # PDF görüntüleyici bileşeni
│           │   ├── ScreenshotTool.jsx   # Ekran görüntüsü yakalama aracı
│           │   ├── SettingsModal.jsx    # Ayarlar modal bileşeni
│           │   │
│           │   └── FileExplorer/        # 📁 Modüler Dosya Gezgini
│           │       ├── index.jsx              # Ana FileExplorer bileşeni
│           │       ├── TreeItem.jsx           # Sürükle-bırak destekli ağaç öğesi
│           │       ├── FileExplorerHeader.jsx # Cam efekti başlık
│           │       ├── FileExplorerFooter.jsx # İstatistik alt bilgi
│           │       ├── DeleteConfirmModal.jsx # Özel silme dialogu
│           │       ├── DropOverlay.jsx        # Sürükle-bırak overlay'ı
│           │       ├── EmptyState.jsx         # Boş kütüphane durumu
│           │       ├── NewFolderInput.jsx     # Yeni klasör girişi
│           │       ├── icons/                 # SVG ikon bileşenleri
│           │       │   └── FileExplorerIcons.jsx
│           │       └── hooks/                 # Özel hook'lar
│           │           └── useExternalDragDrop.js
│           │
│           ├── context/         # React context sağlayıcıları
│           │   └── FileContext.jsx      # Dosya sistemi durum yönetimi
│           │
│           ├── hooks/           # Özel React hook'ları
│           │   ├── index.js             # Hook'ların toplu dışa aktarımı
│           │   ├── useAISender.js       # Yapay zekaya mesaj gönderme mantığı
│           │   ├── useLocalStorage.js   # Yerel depolama kalıcılığı
│           │   ├── usePanelResize.js    # Panel yeniden boyutlandırma mantığı
│           │   └── useScreenshot.js     # Ekran görüntüsü yakalama mantığı
│           │
│           ├── constants/       # Yapılandırma sabitleri
│           │   └── aiSites.js           # Yapay zeka platformları yapılandırması
│           │
│           └── styles/          # CSS stilleri
│               ├── index.css            # Ana stil dosyası girişi
│               └── modules/             # Modüler CSS dosyaları
│                   ├── _animations.css
│                   ├── _base.css
│                   ├── _buttons.css
│                   ├── _floating-bar.css
│                   ├── _glass-panel.css
│                   ├── _pdf-viewer.css
│                   ├── _resizer.css
│                   ├── _screenshot.css
│                   └── _utilities.css
│
├── docs/                        # Dokümantasyon
│   ├── screenshots/             # Uygulama ekran görüntüleri
│   │   ├── main-interface-chatgpt.png
│   │   └── main-interface-gemini.png
│   └── README_*.md              # Çeviriler
│
├── package.json                 # Proje bağımlılıkları ve betikler
├── vite.config.js               # Vite yapılandırması
├── tailwind.config.js           # Tailwind CSS yapılandırması
└── postcss.config.js            # PostCSS yapılandırması
```

---

## 🛠️ Teknoloji Yığını

### Temel Teknolojiler

| Teknoloji | Sürüm | Amaç |
|-----------|-------|------|
| **Electron** | 28.0.0 | Masaüstü uygulama çatısı |
| **React** | 18.2.0 | Kullanıcı arayüzü bileşen kütüphanesi |
| **Vite** | 5.0.10 | Derleme aracı ve geliştirme sunucusu |
| **PDF.js** | 3.11.174 | PDF işleme motoru |

### Geliştirme Araçları

| Araç | Amaç |
|------|------|
| **Tailwind CSS** | Yardımcı öncelikli CSS çatısı |
| **Concurrently** | Birden fazla komutu çalıştırma |
| **Wait-on** | Devam etmeden önce kaynak bekleme |
| **html2canvas** | Ekran görüntüsü yakalama |

---

## 📖 Kullanım Kılavuzu

### PDF Açma

1. PDF görüntüleyici araç çubuğundaki **"PDF Dosyası Seç"** düğmesine tıklayın
2. Bilgisayarınızdan bir PDF dosyası seçin
3. PDF sol panelde görüntülenecektir

### Yapay Zekaya Metin Gönderme

1. PDF görüntüleyicide tıklayıp sürükleyerek **metin seçin**
2. Kayan **"AI'ya Gönder"** butonu görünecektir
3. Seçili metni mevcut yapay zekaya göndermek için butona tıklayın

### Otomatik Göndermeyi Kullanma

1. PDF araç çubuğundaki **otomatik gönder** düğmesini açın (aktifken yeşil)
2. Etkinleştirildiğinde, seçilen metin otomatik olarak yapay zekaya gönderilir

### Ekran Görüntüsü Alma

1. PDF araç çubuğundaki **📸 kamera simgesine** tıklayın
2. Yakalamak istediğiniz alanın etrafına bir dikdörtgen çizin
3. Ekran görüntüsü analiz için yapay zekaya gönderilecektir

### Yapay Zeka Platformları Arasında Geçiş

1. Kontrol panelini ortaya çıkarmak için alt çubuğun üzerine gelin
2. Platformlar arasında geçiş yapmak için **ChatGPT** veya **Gemini**'ye tıklayın
3. Seçiminiz gelecek oturumlar için kaydedilir

### Panelleri Yeniden Boyutlandırma

1. PDF ve yapay zeka panelleri arasındaki ayırıcının üzerine gelin
2. Yeniden boyutlandırmak için tıklayıp sürükleyin
3. Panel boyutlarınız otomatik olarak kaydedilir

---

## ⌨️ Klavye Kısayolları

| Kısayol | Eylem |
|---------|-------|
| `Ctrl + O` | PDF dosyası aç |
| `Ctrl + +` | Yakınlaştır |
| `Ctrl + -` | Uzaklaştır |
| `Ctrl + 0` | Yakınlaştırmayı sıfırla |
| `Escape` | Ekran görüntüsü modunu iptal et |

---

## 🔧 Yapılandırma

### Desteklenen Yapay Zeka Platformları

Şu anda desteklenen yapay zeka platformları (`src/renderer/src/constants/aiSites.js` dosyasında yapılandırılmış):

| Platform | URL |
|----------|-----|
| ChatGPT | https://chatgpt.com |
| Gemini | https://gemini.google.com |

### Yeni Yapay Zeka Platformu Ekleme

Yeni bir yapay zeka platformu eklemek için `aiSites.js` dosyasını düzenleyin:

```javascript
export const AI_SITES = {
    // ... mevcut platformlar
    yeniPlatform: {
        url: 'https://ornek.com',
        name: 'ornek.com',
        displayName: 'Yeni Platform',
        icon: 'yeniplatform'
    }
}
```

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen bir Pull Request göndermekten çekinmeyin.

1. Depoyu fork'layın
2. Özellik dalınızı oluşturun (`git checkout -b ozellik/HarikaOzellik`)
3. Değişikliklerinizi commit'leyin (`git commit -m 'Harika bir özellik eklendi'`)
4. Dalı push'layın (`git push origin ozellik/HarikaOzellik`)
5. Bir Pull Request açın

---

## 📝 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 🙏 Teşekkürler

- [PDF.js](https://mozilla.github.io/pdf.js/) - Mozilla tarafından PDF işleme
- [Electron](https://www.electronjs.org/) - Çapraz platform masaüstü uygulamaları
- [React](https://reactjs.org/) - Kullanıcı arayüzü bileşen kütüphanesi
- [Vite](https://vitejs.dev/) - Yeni nesil derleme aracı

---

## 📧 İletişim

**Proje Linki:** [https://github.com/ozymandias-get/Quizlab-Reader](https://github.com/ozymandias-get/Quizlab-Reader)

---

<p align="center">
  Öğrenciler ve araştırmacılar için ❤️ ile yapıldı
</p>
