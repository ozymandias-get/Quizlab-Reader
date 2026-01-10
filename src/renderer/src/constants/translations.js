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
        explorer: '资源管理器',
        viewer: '查看器',

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
        is_available: '可用',
        later: '稍后',
        current_version: '当前版本',
        download_from_github: '从 GitHub 下载',
        update_error: '更新错误',
        you_have_latest: '您已是最新版本',

        // 错误消息
        error_api_unavailable: 'API 不可用',
        error_permission: '文件访问权限被拒绝',
        error_corrupt_file: 'PDF 文件损坏或无效',
        error_pdf_load: '无法加载 PDF。请重试。',
        error_pdf_access: '无法访问文件',
        error_send_failed: '发送失败。请确保 AI 页面已加载。',

        // Webview 崩溃
        webview_crashed_retrying: 'AI 崩溃，重新加载中...',
        webview_crashed_max: '页面持续崩溃。请重启应用。',
        webview_unresponsive: 'AI 没有响应...',

        google_account_management: 'Google 应用管理',
        accounts: '账户',
        account_profiles: '账户配置文件',
        create_profile: '创建新配置文件',
        add_account: '添加账户'
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
        explorer: 'एक्सप्लोरर',
        viewer: 'व्यूअर',

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
        is_available: 'उपलब्ध है',
        later: 'बाद में',
        current_version: 'वर्तमान संस्करण',
        download_from_github: 'GitHub से डाउनलोड करें',
        update_error: 'अपडेट त्रुटि',
        you_have_latest: 'आपके पास नवीनतम संस्करण है',

        // त्रुटि संदेश
        error_api_unavailable: 'API उपलब्ध नहीं है',
        error_permission: 'फाइल ऐक्सेस अनुमति अस्वीकृत',
        error_corrupt_file: 'PDF फाइल दूषित या अमान्य है',
        error_pdf_load: 'PDF लोड नहीं हो सकी। कृपया पुनः प्रयास करें।',
        error_pdf_access: 'फाइल एक्सेस नहीं हो सकी',
        error_send_failed: 'भेजने में विफल। सुनिश्चित करें कि AI पेज लोड हो गया है।',

        // Webview क्रैश
        webview_crashed_retrying: 'AI क्रैश हो गया, पुनः लोड हो रहा है...',
        webview_crashed_max: 'पेज बार-बार क्रैश हो रहा है। कृपया एप को पुनः आरंभ करें।',
        webview_unresponsive: 'AI प्रतिक्रिया नहीं दे रहा...',

        google_account_management: 'Google ऐप प्रबंधन',
        accounts: 'खाते',
        account_profiles: 'खाता प्रोफ़ाइल',
        create_profile: 'नई प्रोफ़ाइल बनाएं',
        add_account: 'खाता जोड़ें'
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
        explorer: 'Explorador',
        viewer: 'Visor',

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
        is_available: 'está disponible',
        later: 'Más tarde',
        current_version: 'Versión actual',
        download_from_github: 'Descargar desde GitHub',
        update_error: 'Error de actualización',
        you_have_latest: 'Tienes la última versión',

        // Mensajes de error
        error_api_unavailable: 'API no disponible',
        error_permission: 'Permiso de acceso a archivo denegado',
        error_corrupt_file: 'El archivo PDF está corrupto o es inválido',
        error_pdf_load: 'Error al cargar PDF. Inténtalo de nuevo.',
        error_pdf_access: 'No se puede acceder al archivo',
        error_send_failed: 'Error al enviar. Asegúrate de que la página de AI esté cargada.',

        // Webview crash
        webview_crashed_retrying: 'AI falló, recargando...',
        webview_crashed_max: 'La página sigue fallando. Por favor reinicia la app.',
        webview_unresponsive: 'AI no responde...',

        google_account_management: 'Gestión de aplicaciones de Google',
        accounts: 'Cuentas',
        account_profiles: 'Perfiles de cuenta',
        create_profile: 'Crear nuevo perfil',
        add_account: 'Añadir cuenta'
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
        explorer: 'المستكشف',
        viewer: 'العارض',

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
        is_available: 'متاح',
        later: 'لاحقاً',
        current_version: 'الإصدار الحالي',
        download_from_github: 'تحميل من GitHub',
        update_error: 'خطأ في التحديث',
        you_have_latest: 'لديك أحدث إصدار',

        // رسائل الخطأ
        error_api_unavailable: 'API غير متاح',
        error_permission: 'تم رفض إذن الوصول إلى الملف',
        error_corrupt_file: 'ملف PDF تالف أو غير صالح',
        error_pdf_load: 'فشل في تحميل PDF. حاول مرة أخرى.',
        error_pdf_access: 'لا يمكن الوصول إلى الملف',
        error_send_failed: 'فشل الإرسال. تأكد من تحميل صفحة AI.',

        // Webview crash
        webview_crashed_retrying: 'AI تعطل، جار إعادة التحميل...',
        webview_crashed_max: 'الصفحة تستمر في التعطل. أعد تشغيل التطبيق.',
        webview_unresponsive: 'AI لا يستجيب...',

        google_account_management: 'إدارة تطبيقات جوجل',
        accounts: 'حسابات',
        account_profiles: 'ملفات تعريف الحساب',
        create_profile: 'إنشاء ملف تعريف جديد',
        add_account: 'إضافة حساب'
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
