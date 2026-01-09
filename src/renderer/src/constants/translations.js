/**
 * Dil çevirileri yapılandırması
 * Desteklenen diller: İngilizce, Çince, Hintçe, İspanyolca, Arapça, Türkçe
 */

export const LANGUAGES = {
    en: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇬🇧',
        dir: 'ltr'
    },
    zh: {
        code: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        flag: '🇨🇳',
        dir: 'ltr'
    },
    hi: {
        code: 'hi',
        name: 'Hindi',
        nativeName: 'हिन्दी',
        flag: '🇮🇳',
        dir: 'ltr'
    },
    es: {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
        dir: 'ltr'
    },
    ar: {
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        flag: '🇸🇦',
        dir: 'rtl'
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
        current_version: 'Current version',
        download_update: 'Download Update',
        downloading: 'Downloading...',
        install_restart: 'Install & Restart',
        update_ready: 'Update ready to install',
        update_error: 'Update error',

        // Error messages
        error_api_unavailable: 'API unavailable',
        error_permission: 'File access permission denied',
        error_corrupt_file: 'PDF file is corrupt or invalid',
        error_pdf_load: 'Failed to load PDF. Please try again.',
        error_send_failed: 'Failed to send text. Make sure AI page is loaded.',

        // Webview crash
        webview_crashed_retrying: 'AI crashed, reloading...',
        webview_crashed_max: 'Page keeps crashing. Please restart the app.',
        webview_unresponsive: 'AI is not responding...'
    },

    zh: {
        // 通用
        app_name: 'Quizlab 阅读器',
        settings: '设置',
        language: '语言',
        close: '关闭',

        // PDF 查看器
        select_pdf: '选择 PDF 文件',
        page: '页',
        of: '/',
        zoom_in: '放大',
        zoom_out: '缩小',
        screenshot: '截图',
        auto_send: '自动发送',
        auto_send_on: '自动发送：开',
        auto_send_off: '自动发送：关',

        // AI 面板
        send_to_ai: '发送到 AI',
        loading: '加载中...',

        // 底部栏
        gemini: 'Gemini',
        chatgpt: 'ChatGPT',

        // 设置
        settings_title: '设置',
        language_settings: '语言设置',
        select_language: '选择语言',
        appearance: '外观',
        about: '关于',
        version: '版本',

        // 消息
        no_pdf_loaded: '未加载 PDF',
        drop_pdf_here: '将 PDF 拖放到此处或点击选择',
        text_copied: '文本已复制！',
        screenshot_captured: '截图已捕获！',
        sending_to_ai: '正在发送到 AI...',
        sent_successfully: '发送成功！',

        // 更新
        updates: '更新',
        check_for_updates: '检查更新',
        checking_updates: '正在检查更新...',
        update_available: '有可用更新！',
        update_not_available: '您已是最新版本',
        new_version: '新版本',
        current_version: '当前版本',
        download_update: '下载更新',
        downloading: '下载中...',
        install_restart: '安装并重启',
        update_ready: '更新已准备好安装',
        update_error: '更新错误'
    },

    hi: {
        // सामान्य
        app_name: 'क्विज़लैब रीडर',
        settings: 'सेटिंग्स',
        language: 'भाषा',
        close: 'बंद करें',

        // PDF व्यूअर
        select_pdf: 'PDF फ़ाइल चुनें',
        page: 'पृष्ठ',
        of: 'का',
        zoom_in: 'ज़ूम इन',
        zoom_out: 'ज़ूम आउट',
        screenshot: 'स्क्रीनशॉट',
        auto_send: 'ऑटो भेजें',
        auto_send_on: 'ऑटो भेजें: चालू',
        auto_send_off: 'ऑटो भेजें: बंद',

        // AI पैनल
        send_to_ai: 'AI को भेजें',
        loading: 'लोड हो रहा है...',

        // बॉटम बार
        gemini: 'जेमिनी',
        chatgpt: 'चैटजीपीटी',

        // सेटिंग्स
        settings_title: 'सेटिंग्स',
        language_settings: 'भाषा सेटिंग्स',
        select_language: 'भाषा चुनें',
        appearance: 'दिखावट',
        about: 'के बारे में',
        version: 'संस्करण',

        // संदेश
        no_pdf_loaded: 'कोई PDF लोड नहीं हुई',
        drop_pdf_here: 'PDF यहाँ छोड़ें या चुनने के लिए क्लिक करें',
        text_copied: 'टेक्स्ट कॉपी हो गया!',
        screenshot_captured: 'स्क्रीनशॉट कैप्चर हो गया!',
        sending_to_ai: 'AI को भेजा जा रहा है...',
        sent_successfully: 'सफलतापूर्वक भेजा गया!',

        // अपडेट
        updates: 'अपडेट',
        check_for_updates: 'अपडेट की जांच करें',
        checking_updates: 'अपडेट की जांच की जा रही है...',
        update_available: 'अपडेट उपलब्ध है!',
        update_not_available: 'आपके पास नवीनतम संस्करण है',
        new_version: 'नया संस्करण',
        current_version: 'वर्तमान संस्करण',
        download_update: 'अपडेट डाउनलोड करें',
        downloading: 'डाउनलोड हो रहा है...',
        install_restart: 'इंस्टॉल करें और पुनः आरंभ करें',
        update_ready: 'अपडेट इंस्टॉल के लिए तैयार है',
        update_error: 'अपडेट त्रुटि'
    },

    es: {
        // General
        app_name: 'Quizlab Reader',
        settings: 'Configuración',
        language: 'Idioma',
        close: 'Cerrar',

        // Visor PDF
        select_pdf: 'Seleccionar archivo PDF',
        page: 'Página',
        of: 'de',
        zoom_in: 'Acercar',
        zoom_out: 'Alejar',
        screenshot: 'Captura de pantalla',
        auto_send: 'Envío automático',
        auto_send_on: 'Envío automático: ON',
        auto_send_off: 'Envío automático: OFF',

        // Panel AI
        send_to_ai: 'Enviar a AI',
        loading: 'Cargando...',

        // Barra inferior
        gemini: 'Gemini',
        chatgpt: 'ChatGPT',

        // Configuración
        settings_title: 'Configuración',
        language_settings: 'Configuración de idioma',
        select_language: 'Seleccionar idioma',
        appearance: 'Apariencia',
        about: 'Acerca de',
        version: 'Versión',

        // Mensajes
        no_pdf_loaded: 'No hay PDF cargado',
        drop_pdf_here: 'Suelta el PDF aquí o haz clic para seleccionar',
        text_copied: '¡Texto copiado!',
        screenshot_captured: '¡Captura de pantalla tomada!',
        sending_to_ai: 'Enviando a AI...',
        sent_successfully: '¡Enviado con éxito!',

        // Actualizaciones
        updates: 'Actualizaciones',
        check_for_updates: 'Buscar Actualizaciones',
        checking_updates: 'Buscando actualizaciones...',
        update_available: '¡Actualización Disponible!',
        update_not_available: 'Tienes la última versión',
        new_version: 'Nueva versión',
        current_version: 'Versión actual',
        download_update: 'Descargar Actualización',
        downloading: 'Descargando...',
        install_restart: 'Instalar y Reiniciar',
        update_ready: 'Actualización lista para instalar',
        update_error: 'Error de actualización'
    },

    ar: {
        // عام
        app_name: 'قارئ كويزلاب',
        settings: 'الإعدادات',
        language: 'اللغة',
        close: 'إغلاق',

        // عارض PDF
        select_pdf: 'اختر ملف PDF',
        page: 'صفحة',
        of: 'من',
        zoom_in: 'تكبير',
        zoom_out: 'تصغير',
        screenshot: 'لقطة شاشة',
        auto_send: 'إرسال تلقائي',
        auto_send_on: 'الإرسال التلقائي: تشغيل',
        auto_send_off: 'الإرسال التلقائي: إيقاف',

        // لوحة AI
        send_to_ai: 'إرسال إلى AI',
        loading: 'جار التحميل...',

        // الشريط السفلي
        gemini: 'جيميني',
        chatgpt: 'شات جي بي تي',

        // الإعدادات
        settings_title: 'الإعدادات',
        language_settings: 'إعدادات اللغة',
        select_language: 'اختر اللغة',
        appearance: 'المظهر',
        about: 'حول',
        version: 'الإصدار',

        // الرسائل
        no_pdf_loaded: 'لا يوجد PDF محمل',
        drop_pdf_here: 'أسقط PDF هنا أو انقر للاختيار',
        text_copied: 'تم نسخ النص!',
        screenshot_captured: 'تم التقاط لقطة الشاشة!',
        sending_to_ai: 'جار الإرسال إلى AI...',
        sent_successfully: 'تم الإرسال بنجاح!',

        // التحديثات
        updates: 'التحديثات',
        check_for_updates: 'التحقق من التحديثات',
        checking_updates: 'جار التحقق من التحديثات...',
        update_available: 'يتوفر تحديث!',
        update_not_available: 'لديك أحدث إصدار',
        new_version: 'إصدار جديد',
        current_version: 'الإصدار الحالي',
        download_update: 'تحميل التحديث',
        downloading: 'جار التحميل...',
        install_restart: 'تثبيت وإعادة التشغيل',
        update_ready: 'التحديث جاهز للتثبيت',
        update_error: 'خطأ في التحديث'
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
        current_version: 'Mevcut sürüm',
        download_update: 'Güncellemeyi İndir',
        downloading: 'İndiriliyor...',
        install_restart: 'Kur ve Yeniden Başlat',
        update_ready: 'Güncelleme yüklenmeye hazır',
        update_error: 'Güncelleme hatası',

        // Hata mesajları
        error_api_unavailable: 'API kullanılamıyor',
        error_permission: 'Dosya erişim izni reddedildi',
        error_corrupt_file: 'PDF dosyası bozuk veya geçersiz',
        error_pdf_load: 'PDF yüklenemedi. Lütfen tekrar deneyin.',
        error_send_failed: 'Metin gönderilemedi. AI sayfasının yüklendiğinden emin olun.',

        // Webview crash
        webview_crashed_retrying: 'AI çöktü, yeniden yükleniyor...',
        webview_crashed_max: 'Sayfa sürekli çöküyor. Lütfen uygulamayı yeniden başlatın.',
        webview_unresponsive: 'AI yanıt vermiyor...'
    }
}

export const DEFAULT_LANGUAGE = 'tr'
export const VALID_LANGUAGES = Object.keys(LANGUAGES)
