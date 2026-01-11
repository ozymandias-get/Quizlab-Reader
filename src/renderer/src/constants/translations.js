/**
 * Dil çevirileri yapılandırması
 * Desteklenen diller: İngilizce, Türkçe
 */

export const LANGUAGES = {
    en: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        dir: 'ltr'
    },
    tr: {
        code: 'tr',
        name: 'Turkish',
        nativeName: 'Türkçe',
        flag: '🇹🇷',
        dir: 'ltr'
    }
}

export const translations = {
    en: {
        // Genel
        app_name: 'Quizlab Reader',
        settings: 'Settings',
        language: 'Language',
        close: 'Close',

        // PDF Viewer
        select_pdf: 'Select PDF File',
        page: 'Page',
        of: 'of',
        zoom_in: 'Zoom In',
        zoom_out: 'Zoom Out',
        screenshot: 'Screenshot',
        auto_send: 'Auto Send',
        auto_send_on: 'Auto Send: ON',
        auto_send_off: 'Auto Send: OFF',
        explorer: 'Explorer',
        viewer: 'Viewer',

        // AI Panel
        send_to_ai: 'Send to AI',
        loading: 'Loading...',

        // Bottom Bar
        gemini: 'Gemini',
        chatgpt: 'ChatGPT',

        // Settings
        settings_title: 'Settings',
        language_settings: 'Language Settings',
        select_language: 'Select Language',
        appearance: 'Appearance',
        about: 'About',
        version: 'Version',

        // Messages
        no_pdf_loaded: 'No PDF loaded',
        drop_pdf_here: 'Drop PDF here or click to select',
        text_copied: 'Text copied!',
        screenshot_captured: 'Screenshot captured!',
        sending_to_ai: 'Sending to AI...',
        sent_successfully: 'Sent successfully!',

        // Updates
        updates: 'Updates',
        check_for_updates: 'Check for Updates',
        checking_updates: 'Checking for updates...',
        update_available: 'Update Available!',
        update_not_available: 'You have the latest version',
        new_version: 'New version',
        is_available: 'is available',
        later: 'Later',
        current_version: 'Current version',
        download_from_github: 'Download from GitHub',
        update_error: 'Update error',
        you_have_latest: 'You have the latest version',

        // Error messages
        error_api_unavailable: 'API unavailable',
        error_permission: 'File access permission denied',
        error_corrupt_file: 'PDF file is corrupt or invalid',
        error_pdf_load: 'Failed to load PDF. Please try again.',
        error_pdf_access: 'Cannot access file',
        error_send_failed: 'Failed to send text. Make sure AI page is loaded.',

        // Webview crash
        webview_crashed_retrying: 'AI crashed, reloading...',
        webview_crashed_max: 'Page keeps crashing. Please restart the app.',
        webview_unresponsive: 'AI is not responding...',

        // Data & Cookies
        data: 'Data',
        cookie_management: 'Session Cookies',
        cookie_info: 'Cookies used to login to AI platforms are securely stored in this app. Cookies are kept only on your local device and are never sent to any server.',
        secure_storage: 'Secure Storage:',
        secure_storage_info: 'Cookies are stored in Electrons encrypted session partition.',
        reset_cookies: 'Reset Cookies',
        resetting: 'Resetting...',
        cookies_reset_success: 'Cookies deleted!',
        reset_cookies_warning: 'This action will log you out of all AI platforms. You will need to log in again.',

        // Profiles
        google_account_management: 'Google App Management',
        accounts: 'Accounts',
        account_profiles: 'Account Profiles',
        create_profile: 'Create New Profile',
        add_account: 'Add Account'
    },

    tr: {
        // Genel
        app_name: 'Quizlab Reader',
        settings: 'Ayarlar',
        language: 'Dil',
        close: 'Kapat',

        // PDF Görüntüleyici
        select_pdf: 'PDF Dosyası Seç',
        page: 'Sayfa',
        of: '/',
        zoom_in: 'Yakınlaştır',
        zoom_out: 'Uzaklaştır',
        screenshot: 'Ekran Görüntüsü',
        auto_send: 'Otomatik Gönder',
        auto_send_on: 'Otomatik Gönder: AÇIK',
        auto_send_off: 'Otomatik Gönder: KAPALI',
        explorer: 'Gezgin',
        viewer: 'Görüntüleyici',

        // AI Paneli
        send_to_ai: "AI'ya Gönder",
        loading: 'Yükleniyor...',

        // Alt Bar
        gemini: 'Gemini',
        chatgpt: 'ChatGPT',

        // Ayarlar
        settings_title: 'Ayarlar',
        language_settings: 'Dil Ayarları',
        select_language: 'Dil Seçin',
        appearance: 'Görünüm',
        about: 'Hakkında',
        version: 'Sürüm',

        // Mesajlar
        no_pdf_loaded: 'PDF yüklenmedi',
        drop_pdf_here: "PDF'yi buraya bırakın veya seçmek için tıklayın",
        text_copied: 'Metin kopyalandı!',
        screenshot_captured: 'Ekran görüntüsü alındı!',
        sending_to_ai: "AI'ya gönderiliyor...",
        sent_successfully: 'Başarıyla gönderildi!',

        // Güncellemeler
        updates: 'Güncellemeler',
        check_for_updates: 'Güncellemeleri Kontrol Et',
        checking_updates: 'Güncellemeler kontrol ediliyor...',
        update_available: 'Güncelleme Mevcut!',
        update_not_available: 'En son sürümü kullanıyorsunuz',
        new_version: 'Yeni sürüm',
        is_available: 'indirebilirsiniz',
        later: 'Sonra',
        current_version: 'Mevcut sürüm',
        download_from_github: "GitHub'dan İndir",
        update_error: 'Güncelleme hatası',
        you_have_latest: 'En güncel sürüme sahipsiniz',

        // Hata mesajları
        error_api_unavailable: 'API kullanılamıyor',
        error_permission: 'Dosya erişim izni reddedildi',
        error_corrupt_file: 'PDF dosyası bozuk veya geçersiz',
        error_pdf_load: 'PDF yüklenemedi. Lütfen tekrar deneyin.',
        error_pdf_access: 'Dosyaya erişilemiyor',
        error_send_failed: 'Metin gönderilemedi. AI sayfasının yüklendiğinden emin olun.',

        // Webview crash
        webview_crashed_retrying: 'AI çöktü, yeniden yükleniyor...',
        webview_crashed_max: 'Sayfa sürekli çöküyor. Lütfen uygulamayı yeniden başlatın.',
        webview_unresponsive: 'AI yanıt vermiyor...',

        // Veri & Cookie'ler
        data: 'Veri',
        cookie_management: 'Oturum Cookie\'leri',
        cookie_info: 'AI platformlarına giriş yapmak için kullandığınız cookie\'ler bu uygulamada güvenli şekilde saklanır. Cookie\'ler sadece yerel cihazınızda tutulur ve hiçbir sunucuya gönderilmez.',
        secure_storage: 'Güvenli Depolama:',
        secure_storage_info: 'Cookie\'ler Electron\'un şifreli session partitionunda saklanır.',
        reset_cookies: 'Cookie\'leri Sıfırla',
        resetting: 'Sıfırlanıyor...',
        cookies_reset_success: "Cookie'ler silindi!",
        reset_cookies_warning: 'Bu işlem tüm AI platformlarındaki oturumlarınızı kapatır. Tekrar giriş yapmanız gerekecektir.',

        google_account_management: 'Google Uygulama Yönetimi',
        accounts: 'Hesaplar',
        account_profiles: 'Hesap Profilleri',
        create_profile: 'Yeni Profil Oluştur',
        add_account: 'Hesap Ekle'
    }
}

export const DEFAULT_LANGUAGE = 'tr'
export const VALID_LANGUAGES = Object.keys(LANGUAGES)
