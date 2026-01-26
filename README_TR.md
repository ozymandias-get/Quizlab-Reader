<p align="center">
  <img src="resources/icon.png" alt="Quizlab Reader Logo" width="180" height="180">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Versiyon-3.0.0-blue?style=for-the-badge" alt="Versiyon">
  <img src="https://img.shields.io/badge/Electron-40.0.0-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Vite-5.0.10-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Lisans-MIT-green?style=for-the-badge" alt="Lisans">
</p>

<h1 align="center">Quizlab Reader</h1>

<p align="center">
  <strong>PDF okuma ve yapay zeka destekli araştırma için premium, bölünmüş ekranlı masaüstü uygulaması.</strong>
</p>

<p align="center">
  <a href="./README.md">🇬🇧 English</a>
</p>

---

## 📸 Ekran Görüntüleri

<p align="center">
  <img src="docs/screenshots/main-chatgpt.png" alt="ChatGPT ile Ana Arayüz" width="100%">
  <br><em>PDF görüntüleyici ve ChatGPT entegrasyonu ile bölünmüş ekran arayüzü</em>
</p>

<p align="center">
  <img src="docs/screenshots/main-deepseek.png" alt="DeepSeek ile Ana Arayüz" width="100%">
  <br><em>DeepSeek AI asistanı ve AI'ya Gönder özelliği ile PDF okuma</em>
</p>

<p align="center">
  <img src="docs/screenshots/main-deepseek-2.png" alt="DeepSeek Derin Düşünme" width="100%">
  <br><em>DeepSeek ile Derin Düşünme ve Web Arama özellikleri</em>
</p>

<p align="center">
  <img src="docs/screenshots/settings-models.png" alt="Ayarlar - AI Modelleri" width="100%">
  <br><em>AI model yapılandırması ile modern ayarlar paneli</em>
</p>

---

## 🎯 Genel Bakış

**Quizlab Reader**, öğrenciler, araştırmacılar ve ileri düzey kullanıcılar için tasarlanmış son teknoloji bir masaüstü uygulamasıdır. PDF belgelerini okuyabileceğiniz ve çeşitli AI platformlarıyla aynı anda etkileşimde bulunabileceğiniz akıcı, glassmorphism tasarımlı bir arayüz sunar. Akıllı otomasyon ve derin entegrasyon ile çalışma seanslarınızı verimli, AI destekli bir deneyime dönüştürür.

---

## ✨ Temel Özellikler

| Özellik | Açıklama |
|---------|----------|
| 📄 **Gelişmiş PDF Görüntüleyici** | PDF.js ile yüksek performanslı render, akıcı kaydırma, yakınlaştırma kontrolleri, metin seçimi ve sayfa navigasyonu. |
| 🤖 **Çoklu AI Ekosistemi** | **ChatGPT, Claude, DeepSeek, Qwen** için yerel destek ve özel AI platformları ekleme imkanı. |
| ⚡ **AI'ya Gönder** | PDF'lerden metin seçin veya ekran görüntüsü alın ve tek tıklamayla aktif AI'nıza anında gönderin. |
| 🎨 **Premium Estetik** | Dinamik animasyonlu blob arka planları, bulanıklaştırma efektleri ve akıcı geçişlerle çarpıcı glassmorphism UI. |
| 📁 **Akıllı Dosya Gezgini** | Sürükle-bırak desteği ve klasör organizasyonu ile entegre PDF kütüphane yönetimi. |
| 📸 **Ekran Görüntüsü Aracı** | PDF sayfalarının belirli alanlarını yakalayın ve analiz için görsel yetenekli AI'lara doğrudan gönderin. |
| 🌐 **Çoklu Dil Desteği** | **İngilizce** ve **Türkçe** olarak tamamen yerelleştirilmiş arayüz. |
| ⚙️ **Derin Özelleştirme** | Görünüm, AI modelleri, CSS seçicileri ve arayüz tercihleri için kapsamlı ayarlar. |
| 🔄 **Otomatik Güncellemeler** | Sorunsuz güncellemeler için GitHub Releases entegrasyonu ile yerleşik otomatik güncelleyici. |
| 🔒 **Gizlilik Odaklı** | Tüm AI etkileşimleri gömülü webview'larda gerçekleşir - API anahtarlarınız AI sağlayıcılarında kalır. |

---

## 🆕 v3.0.0'daki Yenilikler

### 💎 Premium UI Yenileme
- **Animasyonlu Arka Planlar:** Organik hareketli yüksek performanslı canvas tabanlı animasyonlu blob'lar
- **Glassmorphism Tasarım:** Bulanıklaştırma efektleri ve şık kenarlıklarla her bileşen yeniden tasarlandı
- **Dikey Ayarlar Navigasyonu:** Ayrı sekmelerle (Modeller, Seçiciler, Görünüm, Dil, Hakkında) düzenli ayarlar menüsü

### 🤖 Geliştirilmiş AI Entegrasyonu
- **Genişletilmiş Platformlar:** Özel AI ekleme ile **ChatGPT, Claude, DeepSeek, Qwen** desteği
- **Akıllı Otomasyon:** "AI'ya Gönder" işlevselliği için sağlam script enjeksiyon motoru
- **Oturum Kalıcılığı:** Yeniden başlatmalarda oturumunuzu korumak için güvenilir çerez yönetimi

### 🛠️ Temel İyileştirmeler
- **Modüler Mimari:** Backend (Electron) ve frontend (React) arasında temiz ayrım
- **Performans Optimizasyonu:** Animasyonlar ve webview yaşam döngüsü için azaltılmış CPU kullanımı
- **Reklam Engelleyici:** Daha temiz AI sohbet deneyimleri için yerleşik reklam engelleme

---

## 📁 Proje Yapısı

```
quizlab-reader/
├── backend/                         # Electron Backend
│   ├── main/                        # Ana İşlem
│   │   ├── index.js                 # Uygulama girişi ve yaşam döngüsü yönetimi
│   │   ├── windowManager.js         # Pencere ve webview koordinasyonu
│   │   ├── ipcHandlers.js           # Main/Renderer IPC iletişimi
│   │   ├── pdfProtocol.js           # Yerel PDF yükleme için özel protokol
│   │   ├── adblocker.js             # Gömülü tarayıcılar için reklam engelleme
│   │   ├── updater.js               # Otomatik güncelleme işlevselliği
│   │   └── constants.js             # Backend sabitleri
│   │
│   ├── preload/                     # Güvenli Köprü
│   │   └── index.js                 # Renderer işlemi için açık API'ler
│   │
│   └── modules/                     # Backend Modülleri
│       ├── ai/                      # AI Entegrasyonu
│       │   ├── aiManager.js         # AI platform orkestrasyonu
│       │   └── platforms/           # Platforma özel yapılandırmalar
│       │       ├── chatgpt.js       # ChatGPT seçicileri ve scriptleri
│       │       ├── claude.js        # Claude seçicileri ve scriptleri
│       │       ├── deepseek.js      # DeepSeek seçicileri ve scriptleri
│       │       └── qwen.js          # Qwen seçicileri ve scriptleri
│       │
│       └── automation/              # Otomasyon Motoru
│           ├── automationScripts.js # Metin/görsel enjeksiyon scriptleri
│           ├── userElementPicker.js # Özel element seçici aracı
│           └── picker/              # Element seçici yardımcıları
│
├── frontend/                        # React Frontend
│   ├── App.jsx                      # Ana uygulama bileşeni
│   ├── main.jsx                     # React giriş noktası
│   ├── index.html                   # HTML şablonu
│   │
│   ├── components/                  # UI Bileşenleri
│   │   ├── AiWebview.jsx            # Yönetilen AI tarayıcı webview'ı
│   │   ├── AppBackground.jsx        # Animasyonlu blob arka planı
│   │   ├── LeftPanel.jsx            # Sol kenar çubuğu kapsayıcısı
│   │   ├── ScreenshotTool.jsx       # PDF ekran görüntüsü yakalama
│   │   ├── SettingsModal.jsx        # Ana ayarlar modal'ı
│   │   ├── FloatingButton.jsx       # Yüzen eylem düğmesi
│   │   ├── UpdateBanner.jsx         # Güncelleme bildirim banner'ı
│   │   ├── UsageAssistant.jsx       # Başlangıç asistanı
│   │   ├── ErrorBoundary.jsx        # Hata yakalama sarmalayıcısı
│   │   ├── AestheticLoader.jsx      # Yükleme animasyonları
│   │   ├── Icons.jsx                # SVG ikon bileşenleri
│   │   │
│   │   ├── pdf/                     # PDF Görüntüleyici Bileşenleri
│   │   │   ├── PdfViewer.jsx        # Ana PDF görüntüleyici
│   │   │   ├── PdfToolbar.jsx       # PDF araç çubuğu kontrolleri
│   │   │   ├── PdfSearchBar.jsx     # PDF metin araması
│   │   │   ├── PdfPlaceholder.jsx   # Boş durum yer tutucusu
│   │   │   └── hooks/               # PDF'e özel hook'lar
│   │   │
│   │   ├── settings/                # Ayar Sekmeleri
│   │   │   ├── ModelsTab.jsx        # AI modelleri yapılandırması
│   │   │   ├── SelectorsTab.jsx     # CSS seçici özelleştirmesi
│   │   │   ├── AppearanceTab.jsx    # Tema ve görsel ayarlar
│   │   │   ├── LanguageTab.jsx      # Dil seçimi
│   │   │   ├── AboutTab.jsx         # Uygulama bilgisi ve krediler
│   │   │   └── ColorPicker.jsx      # Renk seçimi yardımcısı
│   │   │
│   │   ├── BottomBar/               # Alt Araç Çubuğu
│   │   ├── FileExplorer/            # Dosya gezgini kenar çubuğu
│   │   ├── SplashScreen/            # Uygulama yükleme ekranı
│   │   ├── Toast/                   # Toast bildirimleri
│   │   └── tutorial/                # Öğretici bileşenler
│   │
│   ├── context/                     # React Context Sağlayıcıları
│   │   ├── AiContext.jsx            # AI durum yönetimi
│   │   ├── FileContext.jsx          # Dosya/PDF durum yönetimi
│   │   ├── AppearanceContext.jsx    # Tema ve görünüm durumu
│   │   ├── LanguageContext.jsx      # i18n durum yönetimi
│   │   ├── ToastContext.jsx         # Toast bildirim durumu
│   │   ├── UpdateContext.jsx        # Otomatik güncelleme durumu
│   │   ├── NavigationContext.jsx    # Navigasyon durumu
│   │   └── AppToolContext.jsx       # Uygulama araçları durumu
│   │
│   ├── hooks/                       # Özel React Hook'ları
│   │   ├── useAiSender.js           # AI mesaj gönderme mantığı
│   │   ├── useElementPicker.js      # Element seçici işlevselliği
│   │   ├── useLocalStorage.js       # Kalıcı depolama hook'u
│   │   ├── usePanelResize.js        # Yeniden boyutlandırılabilir panel mantığı
│   │   ├── useScreenshot.js         # Ekran görüntüsü yakalama hook'u
│   │   ├── useSettings.js           # Ayarlar yönetimi hook'u
│   │   └── webview/                 # Webview'a özel hook'lar
│   │
│   ├── locales/                     # Çeviriler
│   │   ├── en.json                  # İngilizce çeviriler
│   │   └── tr.json                  # Türkçe çeviriler
│   │
│   ├── constants/                   # Frontend Sabitleri
│   │   ├── appConstants.js          # Uygulama geneli sabitler
│   │   ├── appearance.js            # Görünüm seçenekleri
│   │   ├── storageKeys.js           # LocalStorage anahtarları
│   │   └── translations.js          # Çeviri yardımcıları
│   │
│   ├── styles/                      # CSS Stilleri
│   │   └── [14 CSS dosyası]         # Bileşen ve global stiller
│   │
│   └── utils/                       # Yardımcı Fonksiyonlar
│       └── [4 yardımcı dosya]       # Yardımcı fonksiyonlar
│
├── resources/                       # Uygulama Kaynakları
│   └── icon.png                     # Uygulama ikonu
│
├── installer/                       # Yükleyici Yapılandırması
│   └── installer.nsh                # NSIS yükleyici scripti
│
├── docs/                            # Dokümantasyon
│   └── screenshots/                 # Uygulama ekran görüntüleri
│
├── package.json                     # Bağımlılıklar ve scriptler
├── vite.config.js                   # Vite build yapılandırması
├── tailwind.config.js               # Tailwind CSS yapılandırması
├── postcss.config.js                # PostCSS yapılandırması
└── vitest.config.js                 # Test yapılandırması
```

---

## 🚀 Başlarken

### Gereksinimler
- **Node.js** 18.x veya üstü
- **npm** 9.x veya üstü

### Geliştirme

1. **Klonlama ve Kurulum**
   ```bash
   git clone https://github.com/ozymandias-get/Quizlab-Reader.git
   cd Quizlab-Reader
   npm install
   ```

2. **Geliştirme Sunucusunu Başlatma**
   ```bash
   npm run dev
   ```
   Bu, hem Vite geliştirme sunucusunu hem de Electron'u geliştirme modunda başlatır.

3. **Yükleyici Oluşturma**
   ```bash
   npm run build:win    # Windows (NSIS yükleyici)
   npm run build:mac    # macOS (DMG)
   npm run build:linux  # Linux (AppImage, deb)
   ```

---

## 🛠️ Teknoloji Yığını

| Kategori | Teknolojiler |
|----------|--------------|
| **Framework** | Electron 40.0.0 |
| **Frontend** | React 18.2 ile Vite 5.0 |
| **Stilleme** | Tailwind CSS, Styled Components, Vanilla CSS |
| **Animasyonlar** | Framer Motion |
| **PDF Motoru** | PDF.js 3.11 ile React-PDF-Viewer |
| **Build Aracı** | Electron Builder 24.13 |
| **Reklam Engelleme** | @ghostery/adblocker-electron |

---

## 🤖 Desteklenen AI Platformları

| Platform | Özellikler |
|----------|------------|
| **ChatGPT** | Metin ve görsel gönderme ile tam destek |
| **Claude** | Metin ve görsel gönderme ile tam destek |
| **DeepSeek** | Derin Düşünme, Web Arama, metin ve görsel |
| **Qwen** | Metin ve görsel gönderme ile tam destek |
| **Özel** | Özel CSS seçicileri ile herhangi bir AI platformu ekleyin |

---

## ⌨️ Klavye Kısayolları

| Kısayol | Eylem |
|---------|-------|
| `Ctrl + O` | PDF dosyası aç |
| `Ctrl + F` | PDF'te ara |
| `Ctrl + +` | Yakınlaştır |
| `Ctrl + -` | Uzaklaştır |
| `Ctrl + 0` | Yakınlaştırmayı sıfırla |
| `Esc` | Modal/katmanları kapat |

---

## 📝 Kullanılabilir Scriptler

| Script | Açıklama |
|--------|----------|
| `npm run dev` | Hot reload ile geliştirme sunucusunu başlat |
| `npm run build` | Production bundle'ı oluştur |
| `npm run build:win` | Windows yükleyicisi oluştur (NSIS) |
| `npm run build:mac` | macOS yükleyicisi oluştur (DMG) |
| `npm run build:linux` | Linux paketleri oluştur (AppImage, deb) |
| `npm run preview` | Production build'i önizle |

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Pull Request göndermekten çekinmeyin.

1. Repository'yi fork edin
2. Feature branch'inizi oluşturun (`git checkout -b feature/HarikaOzellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Harika bir özellik ekle'`)
4. Branch'e push edin (`git push origin feature/HarikaOzellik`)
5. Pull Request açın

---

## 📝 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

## 💖 Teşekkürler

- [Electron](https://www.electronjs.org/) - Çapraz platform masaüstü uygulamaları
- [React](https://react.dev/) - Kullanıcı arayüzü kütüphanesi
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF render motoru
- [Framer Motion](https://www.framer.com/motion/) - Animasyon kütüphanesi

---

<p align="center">
  ❤️ ile yapıldı, <a href="https://github.com/ozymandias-get">ozymandias-get</a>
</p>
