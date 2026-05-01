const translations = {
    en: {
        // ===== General =====
        title: "AI Vision System",
        selectAction: "Select what you want to do",
        openCamera: "Open Camera",
        viewDetections: "View Detections",
        logout: "Logout",
        back: "Back",

        // ===== Camera =====
        liveCamera: "Live AI Camera",
        capture: "Capture",
        resume: "Resume",
        askPlaceholder: "Ask the AI about this object...",

        // ===== Login =====
        loginTitle: "Login",
        loginDesc: "Authorized users only",
        username: "Username",
        password: "Password",
        loginBtn: "Login",

        // ===== Detections =====
        detectionsTitle: "Saved Detections",
        detectionsDesc: "Objects detected and explained by AI"
    },

    ar: {
        // ===== General =====
        title: "نظام الرؤية بالذكاء الاصطناعي",
        selectAction: "اختر ما تريد فعله",
        openCamera: "فتح الكاميرا",
        viewDetections: "عرض النتائج",
        logout: "تسجيل الخروج",
        back: "رجوع",

        // ===== Camera =====
        liveCamera: "كاميرا الذكاء الاصطناعي",
        capture: "التقاط",
        resume: "استئناف",
        askPlaceholder: "اسأل الذكاء الاصطناعي عن هذا الشيء...",

        // ===== Login =====
        loginTitle: "تسجيل الدخول",
        loginDesc: "للمستخدمين المصرح لهم فقط",
        username: "اسم المستخدم",
        password: "كلمة المرور",
        loginBtn: "دخول",

        // ===== Detections =====
        detectionsTitle: "النتائج المحفوظة",
        detectionsDesc: "الأشياء التي تم التعرف عليها وشرحها بالذكاء الاصطناعي"
    },

    ms: {
        // ===== General =====
        title: "Sistem Penglihatan AI",
        selectAction: "Pilih tindakan",
        openCamera: "Buka Kamera",
        viewDetections: "Lihat Pengesanan",
        logout: "Log Keluar",
        back: "Kembali",

        // ===== Camera =====
        liveCamera: "Kamera AI Langsung",
        capture: "Tangkap",
        resume: "Sambung",
        askPlaceholder: "Tanya AI tentang objek ini...",

        // ===== Login =====
        loginTitle: "Log Masuk",
        loginDesc: "Pengguna yang dibenarkan sahaja",
        username: "Nama Pengguna",
        password: "Kata Laluan",
        loginBtn: "Log Masuk",

        // ===== Detections =====
        detectionsTitle: "Pengesanan Disimpan",
        detectionsDesc: "Objek yang dikesan dan diterangkan oleh AI"
    }
};

let currentLang = localStorage.getItem("lang") || "en";

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("lang", lang);
    applyTranslations();
}

function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[currentLang][key]) {
            el.innerText = translations[currentLang][key];
        }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (translations[currentLang][key]) {
            el.placeholder = translations[currentLang][key];
        }
    });

    // RTL للعربي فقط
    document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
}

document.addEventListener("DOMContentLoaded", applyTranslations);
