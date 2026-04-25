import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// الترجمات
const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Header
    'header.services': 'خدماتنا',
    'header.about': 'من نحن',
    'header.home': 'الرئيسية',
    'header.profile': 'الملف الشخصي',
    'header.myProjects': 'مشاريعي',
    'header.logout': 'تسجيل الخروج',
    'header.user': 'المستخدم',
    
    // Main Dashboard
    'dashboard.welcome': 'مرحباً بك في',
    'dashboard.platform': 'منصة مُقدِّم',
    'dashboard.subtitle': 'منصة ذكاء اصطناعي لإنشاء دراسات الجدوى ومساعد الإجراءات الحكومية',
    'dashboard.startStudy': 'ابدأ دراسة جديدة',
    'dashboard.viewProjects': 'عرض المشاريع',
    'dashboard.govProcedures': 'الإجراءات الحكومية',
    'dashboard.aiConsultant': 'المستشار الذكي',
    'dashboard.servicesTitle': 'خدماتنا المتميزة',
    'dashboard.servicesSubtitle': 'حلول متكاملة لمساعدتك في بناء مشروعك الناجح',
    'dashboard.feasibilityStudy': 'دراسة الجدوى',
    'dashboard.feasibilityDesc': 'إنشاء دراسات جدوى شاملة ومفصلة باستخدام الذكاء الاصطناعي',
    'dashboard.governmentGuide': 'دليل الإجراءات الحكومية',
    'dashboard.governmentDesc': 'مساعدة ذكية في إنجاز الإجراءات الحكومية والتراخيص',
    'dashboard.consultantTitle': 'مستشار ذكي',
    'dashboard.consultantDesc': 'استشارات فورية حول مشروعك من خبير ذكاء اصطناعي',
    'dashboard.faqTitle': 'الأسئلة الشائعة',
    'dashboard.faqSubtitle': 'إجابات على أهم الأسئلة حول المنصة',
    
    // Feasibility Study Page
    'feasibility.title': 'إنشاء دراسة جدوى جديدة',
    'feasibility.subtitle': 'املأ النموذج أدناه لإنشاء دراسة جدوى شاملة لمشروعك',
    'feasibility.projectName': 'اسم المشروع',
    'feasibility.projectNamePlaceholder': 'مثال: مقهى النخبة',
    'feasibility.projectType': 'نوع المشروع',
    'feasibility.restaurantsType': 'مطاعم وكافيهات',
    'feasibility.budget': 'الميزانية المتوقعة',
    'feasibility.budgetPlaceholder': 'مثال: 300,000',
    'feasibility.description': 'وصف المشروع',
    'feasibility.descriptionPlaceholder': 'مثال: مقهى عصري يقدم القهوة المختصة والمعجنات الطازجة مع أجواء مريحة للعمل والدراسة...',
    'feasibility.targetMarket': 'السوق المستهدف',
    'feasibility.targetMarketPlaceholder': 'مثال: العائلات والشباب في الأحياء الراقية',
    'feasibility.timeline': 'الجدول الزمني المتوقع',
    'feasibility.timelinePlaceholder': 'مثال: 4-6 أشهر',
    'feasibility.team': 'الفريق المطلوب',
    'feasibility.teamPlaceholder': 'مثال: 8-12 موظف (طهاة، باريستا، خدمة)',
    'feasibility.competitors': 'المنافسون المحتملون',
    'feasibility.competitorsPlaceholder': 'مثال: ستاربكس، كوستا كافيه، مقاهي محلية',
    'feasibility.generateButton': 'إنشاء دراسة الجدوى',
    'feasibility.viewProjectsButton': 'عرض المشاريع السابقة',
    'feasibility.required': 'مطلوب',
    'feasibility.optional': 'اختياري',
    'feasibility.autoSaveNote': 'سيتم حفظ مشروعك تلقائياً ويمكنك الوصول إليه من صفحة "مشاريعي"',
    
    // My Projects Page
    'projects.title': 'مشاريعي',
    'projects.subtitle': 'جميع دراسات الجدوى التي قمت بإنشائها',
    'projects.welcome': 'مرحباً',
    'projects.welcomeDesc': 'هنا يمكنك الوصول إلى جميع مشاريعك ودراسات الجدوى',
    'projects.totalProjects': 'إجمالي المشاريع',
    'projects.completed': 'مكتمل',
    'projects.inProgress': 'قيد التنفيذ',
    'projects.viewDetails': 'عرض التفاصيل',
    'projects.viewStudy': 'عرض الدراسة',
    'projects.chatWithConsultant': 'الدردشة مع المستشار',
    'projects.budget': 'الميزانية',
    'projects.timeline': 'الجدول الزمني',
    'projects.team': 'الفريق',
    'projects.status': 'الحالة',
    'projects.createdAt': 'تاريخ الإنشاء',
    'projects.youHave': 'لديك',
    'projects.project': 'مشروع',
    'projects.projects': 'مشاريع',
    'projects.createNew': 'إنشاء مشروع جديد',
    'projects.noProjects': 'لا توجد مشاريع بعد',
    'projects.noProjectsDesc': 'ابدأ بإنشاء مشروعك الأول وأعد دراسة جدوى احترافية بسهولة',
    'projects.downloadFeasibility': 'دراسة الجدوى',
    'projects.downloadPitchDeck': 'عرض تقديمي',
    'projects.targetMarket': 'السوق المستهدف',
    'projects.preparing': 'جاري التحضير',
    'projects.generatingFeasibility': 'سيقوم الذكاء الاصطناعي بتوليد دراستك وتحميلها',
    'projects.generatingPitchDeck': 'سيقوم الذكاء الاصطناعي بإنشاء عرضك التقديمي وتحميله',
    'projects.pleaseWait': 'الرجاء الانتظار...',
    'projects.deleteConfirm': 'هل أنت متأكد من حذف هذا المشروع؟',
    'projects.downloadSuccess': 'تم تحميل دراسة الجدوى لمشروع',
    'projects.pitchDeckSuccess': 'تم تحميل العرض التقديمي لمشروع',
    
    // Government Procedures Page
    'government.title': 'مساعد الإجراءات الحكومية',
    'government.subtitle': 'دليلك الذكي لإنجاز جميع الإجراءات الحكومية',
    'government.typePlaceholder': 'اكتب سؤالك هنا...',
    'government.sendButton': 'إرسال',
    
    // Consultant Page
    'consultant.title': 'المستشار الذكي',
    'consultant.subtitle': 'احصل على استشارات فورية حول مشروعك',
    'consultant.selectProject': 'اختر مشروعاً للاستشارة',
    'consultant.noProjects': 'لا توجد مشاريع متاحة',
    'consultant.createFirst': 'قم بإنشاء دراسة جدوى أولاً',
    
    // Consultant Chat Page
    'consultantChat.title': 'استشارة المشروع',
    'consultantChat.backToProjects': 'العودة للمشاريع',
    'consultantChat.projectDetails': 'تفاصيل المشروع',
    'consultantChat.loading': 'جاري تحميل بيانات المشروع...',
    'consultantChat.typePlaceholder': 'اكتب سؤالك هنا...',
    'consultantChat.sendButton': 'إرسال',
    
    // Common
    'common.back': 'رجوع',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.sar': 'ر.س',
  },
  en: {
    // Header
    'header.services': 'Our Services',
    'header.about': 'About Us',
    'header.home': 'Home',
    'header.profile': 'Profile',
    'header.myProjects': 'My Projects',
    'header.logout': 'Logout',
    'header.user': 'User',
    
    // Main Dashboard
    'dashboard.welcome': 'Welcome to',
    'dashboard.platform': 'MOQDDIM Platform',
    'dashboard.subtitle': 'AI-powered platform for creating feasibility studies and government procedures assistant',
    'dashboard.startStudy': 'Start New Study',
    'dashboard.viewProjects': 'View Projects',
    'dashboard.govProcedures': 'Government Procedures',
    'dashboard.aiConsultant': 'AI Consultant',
    'dashboard.servicesTitle': 'Our Premium Services',
    'dashboard.servicesSubtitle': 'Integrated solutions to help you build your successful project',
    'dashboard.feasibilityStudy': 'Feasibility Study',
    'dashboard.feasibilityDesc': 'Create comprehensive and detailed feasibility studies using AI',
    'dashboard.governmentGuide': 'Government Procedures Guide',
    'dashboard.governmentDesc': 'Smart assistance in completing government procedures and licenses',
    'dashboard.consultantTitle': 'Smart Consultant',
    'dashboard.consultantDesc': 'Instant consultations about your project from an AI expert',
    'dashboard.faqTitle': 'Frequently Asked Questions',
    'dashboard.faqSubtitle': 'Answers to the most important questions about the platform',
    
    // Feasibility Study Page
    'feasibility.title': 'Create New Feasibility Study',
    'feasibility.subtitle': 'Fill out the form below to create a comprehensive feasibility study for your project',
    'feasibility.projectName': 'Project Name',
    'feasibility.projectNamePlaceholder': 'Example: Elite Café',
    'feasibility.projectType': 'Project Type',
    'feasibility.restaurantsType': 'Restaurants & Cafés',
    'feasibility.budget': 'Expected Budget',
    'feasibility.budgetPlaceholder': 'Example: 300,000',
    'feasibility.description': 'Project Description',
    'feasibility.descriptionPlaceholder': 'Example: A modern café serving specialty coffee and fresh pastries with a comfortable atmosphere for work and study...',
    'feasibility.targetMarket': 'Target Market',
    'feasibility.targetMarketPlaceholder': 'Example: Families and youth in upscale neighborhoods',
    'feasibility.timeline': 'Expected Timeline',
    'feasibility.timelinePlaceholder': 'Example: 4-6 months',
    'feasibility.team': 'Required Team',
    'feasibility.teamPlaceholder': 'Example: 8-12 employees (chefs, baristas, service)',
    'feasibility.competitors': 'Potential Competitors',
    'feasibility.competitorsPlaceholder': 'Example: Starbucks, Costa Coffee, local cafés',
    'feasibility.generateButton': 'Generate Feasibility Study',
    'feasibility.viewProjectsButton': 'View Previous Projects',
    'feasibility.required': 'Required',
    'feasibility.optional': 'Optional',
    'feasibility.autoSaveNote': 'Your project will be saved automatically and you can access it from the "My Projects" page',
    
    // My Projects Page
    'projects.title': 'My Projects',
    'projects.subtitle': 'All feasibility studies you have created',
    'projects.welcome': 'Welcome',
    'projects.welcomeDesc': 'Here you can access all your projects and feasibility studies',
    'projects.totalProjects': 'Total Projects',
    'projects.completed': 'Completed',
    'projects.inProgress': 'In Progress',
    'projects.viewDetails': 'View Details',
    'projects.viewStudy': 'View Study',
    'projects.chatWithConsultant': 'Chat with Consultant',
    'projects.budget': 'Budget',
    'projects.timeline': 'Timeline',
    'projects.team': 'Team',
    'projects.status': 'Status',
    'projects.createdAt': 'Created At',
    'projects.youHave': 'You have',
    'projects.project': 'project',
    'projects.projects': 'projects',
    'projects.createNew': 'Create New Project',
    'projects.noProjects': 'No projects yet',
    'projects.noProjectsDesc': 'Start by creating your first project and easily prepare a professional feasibility study',
    'projects.downloadFeasibility': 'Feasibility Study',
    'projects.downloadPitchDeck': 'Pitch Deck',
    'projects.targetMarket': 'Target Market',
    'projects.preparing': 'Preparing',
    'projects.generatingFeasibility': 'AI will generate your study and download it',
    'projects.generatingPitchDeck': 'AI will create your pitch deck and download it',
    'projects.pleaseWait': 'Please wait...',
    'projects.deleteConfirm': 'Are you sure you want to delete this project?',
    'projects.downloadSuccess': 'Feasibility study downloaded for project',
    'projects.pitchDeckSuccess': 'Pitch deck downloaded for project',
    
    // Government Procedures Page
    'government.title': 'Government Procedures Assistant',
    'government.subtitle': 'Your smart guide to complete all government procedures',
    'government.typePlaceholder': 'Type your question here...',
    'government.sendButton': 'Send',
    
    // Consultant Page
    'consultant.title': 'AI Consultant',
    'consultant.subtitle': 'Get instant consultations about your project',
    'consultant.selectProject': 'Select a project for consultation',
    'consultant.noProjects': 'No projects available',
    'consultant.createFirst': 'Create a feasibility study first',
    
    // Consultant Chat Page
    'consultantChat.title': 'Project Consultation',
    'consultantChat.backToProjects': 'Back to Projects',
    'consultantChat.projectDetails': 'Project Details',
    'consultantChat.loading': 'Loading project data...',
    'consultantChat.typePlaceholder': 'Type your question here...',
    'consultantChat.sendButton': 'Send',
    
    // Common
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sar': 'SAR',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage || 'ar';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // تغيير اتجاه الصفحة
    if (language === 'ar') {
      root.setAttribute('dir', 'rtl');
      root.setAttribute('lang', 'ar');
    } else {
      root.setAttribute('dir', 'ltr');
      root.setAttribute('lang', 'en');
    }
    
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}