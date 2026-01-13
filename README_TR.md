<p align="center">
  <img src="resources/icon.png" alt="Quizlab Reader Logo" width="180" height="180">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Sürüm-2.2.1-blue?style=for-the-badge" alt="Sürüm">
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
  <a href="./README.md">🇬🇧 English</a>
</p>

---

## 🎯 Genel Bakış

**Quizlab Reader**, okuma ve çalışma deneyimini geliştirmek isteyen öğrenciler ve araştırmacılar için tasarlanmış güçlü bir masaüstü uygulamasıdır. Bir tarafta PDF belgelerini görüntüleyebileceğiniz, diğer tarafta yapay zeka asistanları (ChatGPT veya Gemini) ile etkileşime geçebileceğiniz sorunsuz bir bölünmüş ekran arayüzü sunar.

### ✨ Temel Özellikler

| Özellik | Açıklama |
|---------|----------|
| 📄 **PDF Görüntüleyici** | Yakınlaştırma, gezinme, arama ve metin seçimi özellikli tam donanımlı PDF görüntüleyici |
| 🤖 **Yapay Zeka Entegrasyonu** | ChatGPT ve Google Gemini için yerleşik destek |
| 👤 **Profil Sistemi** | Şifreli cookie depolama ile çoklu hesap profilleri |
| 🔐 **Güvenli Depolama** | Hassas veriler için işletim sistemi seviyesinde şifreleme (Windows DPAPI) |
| ✂️ **Metin Seçimi** | PDF'den metin seçin ve tek tıkla doğrudan yapay zekaya gönderin |
| 📸 **Ekran Görüntüsü Aracı** | PDF'in herhangi bir alanını yakalayın ve analiz için yapay zekaya gönderin |
| 🔄 **Otomatik Gönderme Modu** | Seçilen metni otomatik olarak yapay zekaya gönderin |
| 📐 **Yeniden Boyutlandırılabilir Paneller** | Tercihinize göre panelleri sürükleyerek yeniden boyutlandırın |
| 💾 **Kalıcı Ayarlar** | Tercihleriniz oturumlar arasında kaydedilir |
| 🎨 **Modern Arayüz** | Akıcı animasyonlarla cam efekti tasarımı |
| 🌐 **Çoklu Dil** | Türkçe ve İngilizce desteği |

---

## 🆕 v2.2.0 Sürümündeki Yenilikler

### 🔄 Kalıcı Oturum Senkronizasyonu
- **Otomatik Senkronizasyon Motoru:** Her 5 dakikada oturum cookie'lerini şifreli depolamaya senkronize eder.
- **Yarış Koşulu Koruması:** Akıllı kilitleme, profil geçişleri veya hızlı değişiklikler sırasında veri kaybını önler.
- **Güvenli Çıkış:** "Graceful Shutdown" mekanizması, uygulamayı kapatmadan önce son oturum yedeklemesini bekler.
- **Düzeltme:** Uygulama yeniden başlatıldığında Google oturumlarının süresi dolma veya çıkış yapma sorunu çözüldü.

### Platform Tespit Sistemi
- 🔍 Cookie domain'lerinden otomatik platform tespiti (Gemini/ChatGPT)
- ⚠️ Yanlış cookie import edildiğinde platform uyumsuzluğu uyarısı
- 🔀 Karışık cookie tespiti ve raporlama
- 📋 Bilinmeyen domain'ler için bilgilendirme

### Bildirim Sistemi
- 🔔 Cookie sıfırlama hatalarında toast bildirimi
- ✅ Profil oluşturma sonuçlarında platform bilgisi
- 🚫 Tarayıcı alert'leri modern toast'lara dönüştürüldü

### Hata Düzeltmeleri
- cookies-changed event'ine eksik target alanı eklendi
- Cookie sıfırlama akışındaki yanıltıcı hata mesajları düzeltildi
- AiWebview'da varsayılan gemini login state sorunu giderildi

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
- **PDF Görüntüleyici** - Sayfa gezinme, yakınlaştırma kontrolleri, arama, kayan "AI'ya Gönder" butonu ile metin seçimi
- **Yapay Zeka Paneli** - Otomatik gönderme ile ChatGPT ve Gemini arasında geçiş
- **Alt Çubuk** - Yapay zeka platformlarına ve ayarlara hızlı erişim
- **Ayarlar Modalı** - Profil yönetimi, cookie içe aktarma, dil seçimi

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

### Hazır Sürümü İndirin

En son yükleyiciyi [Releases](https://github.com/ozymandias-get/Quizlab-Reader/releases) sayfasından indirebilirsiniz.

---

## 📁 Proje Yapısı

```
Quizlab-Reader/
├── src/
│   ├── main/                    # Electron ana süreci
│   │   ├── index.js             # Ana giriş noktası
│   │   ├── windowManager.js     # Pencere yaşam döngüsü yönetimi
│   │   ├── profileManager.js    # Profil CRUD & cookie yönetimi
│   │   ├── cookieEncryption.js  # İşletim sistemi seviyesi şifreleme (DPAPI)
│   │   ├── cookieImport.js      # Cookie doğrulama & içe aktarma
│   │   ├── googleAuth.js        # Google kimlik doğrulama popup'ı
│   │   ├── pdfProtocol.js       # Özel PDF protokol işleyicisi
│   │   ├── browserConfig.js     # Tarayıcı/UA yapılandırması
│   │   ├── ipcHandlers.js       # IPC mesaj işleyicileri
│   │   └── updater.js           # Otomatik güncelleme işlevi
│   │
│   ├── preload/                 # Ön yükleme betikleri
│   │   └── index.js             # Güvenli IPC köprüsü
│   │
│   ├── renderer/                # React uygulaması
│   │   ├── index.html           # HTML giriş noktası
│   │   └── src/
│   │       ├── App.jsx          # Ana uygulama bileşeni
│   │       ├── main.jsx         # React giriş noktası
│   │       │
│   │       ├── components/      # React bileşenleri
│   │       │   ├── AiWebview.jsx        # Yapay zeka platformu webview'ı
│   │       │   ├── BottomBar.jsx        # Alt kontrol çubuğu
│   │       │   ├── FloatingButton.jsx   # "AI'ya Gönder" kayan butonu
│   │       │   ├── ScreenshotTool.jsx   # Ekran görüntüsü yakalama aracı
│   │       │   ├── SettingsModal.jsx    # Ayarlar modal bileşeni
│   │       │   ├── CookieImportModal.jsx # Cookie içe aktarma dialogu
│   │       │   ├── PdfViewer.jsx        # PDF görüntüleyici toplu dışa aktarımı
│   │       │   │
│   │       │   ├── pdf/                 # 📄 Modüler PDF Görüntüleyici
│   │       │   │   ├── index.js               # Toplu dışa aktarım
│   │       │   │   ├── PdfViewer.jsx          # Ana PDF bileşeni
│   │       │   │   ├── PdfToolbar.jsx         # Araç çubuğu kontrolleri
│   │       │   │   ├── PdfSearchBar.jsx       # Arama işlevi
│   │       │   │   ├── PdfPlaceholder.jsx     # Boş durum
│   │       │   │   └── hooks/                 # PDF'ye özel hook'lar
│   │       │   │       ├── index.js
│   │       │   │       ├── usePdfPlugins.js
│   │       │   │       ├── usePdfNavigation.js
│   │       │   │       ├── usePdfScreenshot.js
│   │       │   │       ├── usePdfTextSelection.js
│   │       │   │       └── usePdfContextMenu.js
│   │       │   │
│   │       │   ├── settings/            # ⚙️ Ayarlar Bileşenleri
│   │       │   │   ├── index.js               # Toplu dışa aktarım
│   │       │   │   ├── DataTab.jsx            # Cookie & profil yönetimi
│   │       │   │   ├── CookieSection.jsx      # Cookie sıfırlama kontrolleri
│   │       │   │   ├── ProfileSection.jsx     # Çoklu hesap profilleri
│   │       │   │   ├── LanguageTab.jsx        # Dil seçimi
│   │       │   │   └── AboutTab.jsx           # Uygulama bilgisi & güncellemeler
│   │       │   │
│   │       │   └── FileExplorer/        # 📁 Modüler Dosya Gezgini
│   │       │       ├── index.jsx              # Ana bileşen
│   │       │       ├── TreeItem.jsx           # Sürükle-bırak ağaç öğesi
│   │       │       ├── FileExplorerHeader.jsx # Başlık bileşeni
│   │       │       ├── FileExplorerFooter.jsx # Altbilgi bileşeni
│   │       │       ├── EmptyState.jsx         # Boş durum görünümü
│   │       │       ├── DropOverlay.jsx        # Sürükle-bırak kaplaması
│   │       │       ├── NewFolderInput.jsx     # Yeni klasör girişi
│   │       │       ├── DeleteConfirmModal.jsx # Silme onayı
│   │       │       ├── icons/                 # SVG ikonları
│   │       │       └── hooks/                 # Gezgin hook'ları
│   │       │
│   │       ├── context/         # React context sağlayıcıları
│   │       │   ├── index.js             # Toplu dışa aktarım
│   │       │   ├── AppContext.jsx       # Global uygulama durumu
│   │       │   ├── FileContext.jsx      # Dosya sistemi yönetimi
│   │       │   ├── ToastContext.jsx     # Toast bildirimleri
│   │       │   └── LanguageContext.jsx  # i18n desteği
│   │       │
│   │       ├── hooks/           # Özel React hook'ları
│   │       │   ├── index.js             # Toplu dışa aktarım
│   │       │   ├── useSettings.js       # Ayarlar modal mantığı
│   │       │   ├── useScreenshot.js     # Ekran görüntüsü işlevi
│   │       │   ├── useLocalStorage.js   # Kalıcılık
│   │       │   └── usePanelResize.js    # Panel yeniden boyutlandırma
│   │       │
│   │       ├── constants/       # Yapılandırma sabitleri
│   │       │   ├── aiSites.js           # Yapay zeka platformları yapılandırması
│   │       │   ├── storageKeys.js       # LocalStorage anahtarları
│   │       │   └── translations.js      # i18n çevirileri
│   │       │
│   │       └── styles/          # CSS stilleri
│   │           ├── index.css            # Ana CSS girişi
│   │           └── modules/             # CSS modülleri
│   │
│   └── test/                    # Test dosyaları
│       └── ...                  # Birim testleri
│
├── docs/                        # Dokümantasyon
│   └── screenshots/             # Uygulama ekran görüntüleri
│
├── resources/                   # Uygulama kaynakları
│   ├── icon.ico                 # Windows ikonu
│   └── icon.png                 # macOS/Linux ikonu
│
└── package.json                 # Proje yapılandırması
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

### Güvenlik Özellikleri

| Özellik | Teknoloji |
|---------|-----------|
| **Cookie Şifreleme** | Electron safeStorage ile Windows DPAPI |
| **Güvenli IPC** | Ön yükleme köprüsü ile context izolasyonu |
| **Oturum İzolasyonu** | Profil başına partition sistemi |
| **Domain İzin Listesi** | Katı gezinme kontrolü |

---

## 📖 Kullanım Kılavuzu

### Profil Yönetimi

1. **Ayarlar**'ı açın (alt çubuktaki dişli simgesi)
2. **Veri** sekmesine gidin
3. Yeni bir profil oluşturmak için **Hesap Ekle**'ye tıklayın
4. EditThisCookie eklentisini kullanarak tarayıcınızdan cookie'leri içe aktarın
5. Platform (Gemini/ChatGPT) cookie domain'lerinden otomatik olarak tespit edilir

### Cookie İçe Aktarma (Önerilen Yöntem)

1. [EditThisCookie](https://chromewebstore.google.com/detail/editthiscookie-v3/ojfebgpkimhlhcblbalbfjblapadhbol) eklentisini yükleyin
2. Chrome'da gemini.google.com veya chatgpt.com'a giriş yapın (tek hesapla Gizli mod kullanın)
3. EditThisCookie simgesine tıklayın → Export → JSON'u kopyalayın
4. Quizlab Reader'da: Ayarlar → Veri → Hesap Ekle → JSON'u yapıştırın

### PDF Açma

1. **"PDF Seç"** butonuna tıklayın veya dosya gezginini kullanın
2. PDF dosyalarını doğrudan uygulamaya sürükleyip bırakın
3. PDF'ler hızlı erişim için yerel kütüphanenizde saklanır

### Yapay Zekaya Metin Gönderme

1. PDF görüntüleyicide tıklayıp sürükleyerek **metin seçin**
2. Kayan **"AI'ya Gönder"** butonu görünecektir
3. Seçili metni mevcut yapay zekaya göndermek için butona tıklayın

### Ekran Görüntüsü Alma

1. PDF araç çubuğundaki **📸 kamera simgesine** tıklayın
2. Yakalamak istediğiniz alanın etrafına bir dikdörtgen çizin
3. Ekran görüntüsü analiz için yapay zekaya gönderilecektir

### Yapay Zeka Platformları Arasında Geçiş

1. Kontrol panelini ortaya çıkarmak için alt çubuğun üzerine gelin
2. Platformlar arasında geçiş yapmak için **ChatGPT** veya **Gemini**'ye tıklayın
3. Her platform kendi oturumunu ve sohbet geçmişini korur

---

## ⌨️ Klavye Kısayolları

| Kısayol | Eylem |
|---------|-------|
| `Ctrl + O` | PDF dosyası aç |
| `Ctrl + F` | PDF'de ara |
| `Ctrl + +` | Yakınlaştır |
| `Ctrl + -` | Uzaklaştır |
| `Ctrl + 0` | Yakınlaştırmayı sıfırla |
| `Escape` | Ekran görüntüsü modunu iptal et |

---

## 🔧 Yapılandırma

### Desteklenen Yapay Zeka Platformları

Şu anda desteklenen yapay zeka platformları (`src/renderer/src/constants/aiSites.js` dosyasında yapılandırılmış):

| Platform | URL | Cookie Domain'leri |
|----------|-----|-------------------|
| ChatGPT | https://chatgpt.com | chatgpt.com, openai.com |
| Gemini | https://gemini.google.com | google.com, gemini.google.com |

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
