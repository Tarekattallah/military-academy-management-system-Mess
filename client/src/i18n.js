import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ar: {
    translation: {
      sidebar: {
        inventory: 'المخزون',
        transactions: 'المعاملات',
        meals: 'الوجبات',
        admin: 'الإدارة',
        products: 'المنتجات',
        categories: 'التصنيفات',
        units: 'الوحدات',
        suppliers: 'الموردين',
        warehouses: 'المستودعات',
        receiving: 'استلام البضائع',
        transfers: 'التحويلات',
        returns: 'المرتجعات',
        waste: 'الهالك',
        stockCounts: 'جرد المخزون',
        batches: 'الدفعات',
        menus: 'قوائم الطعام',
        recipes: 'الوصفات',
        attendance: 'الحضور',
        mealRequests: 'طلبات الوجبات',
        reservations: 'الحجوزات',
        dashboard: 'لوحة التحكم',
        notifications: 'الإشعارات',
        users: 'المستخدمين',
        roles: 'الصلاحيات',
        reports: 'التقارير',
        settings: 'الإعدادات',
        auditLog: 'سجل النشاطات',
        systemName: 'MessOps',
        systemDesc: 'نظام عمليات المطاعم العسكرية'
      },
      userRoles: {
        'Super Administrator': 'مدير عام النظام',
        'Admin': 'مدير النظام',
        'Administrator': 'مدير',
        'Inventory Manager': 'مدير المستودع'
      },
      header: {
        darkMode: 'الوضع المظلم',
        lightMode: 'الوضع المضيء',
        logout: 'تسجيل الخروج',
        noRole: 'بدون دور',
        language: 'English'
      },
      dashboard: {
        title: 'لوحة التحكم',
        welcome: 'مرحباً بعودتك،',
        smartAnalysis: 'لوحة التحليل الذكية',
        systemSummary: 'ملخص النظام',
        inventoryOverview: 'نظرة عامة على المخزون',
        todayOps: 'عمليات اليوم',
        consumption: 'الاستهلاك',
        waste: 'الهالك',
        reservations: 'الحجوزات',
        distributions: 'التوزيعات',
        warehouseStats: 'إحصائيات المستودعات',
        stockHealth: 'مؤشر صحة المخزون',
        healthDesc: 'نسبة الدفعات الصالحة للاستخدام',
        efficiency: 'كفاءة الاستهلاك',
        efficiencyIdeal: 'مثالية',
        efficiencyAvg: 'متوسطة',
        efficiencyDesc: 'بناءً على معدلات السحب الشهري',
        wasteRatio: 'معدل الهالك للشهر',
        wasteDesc: 'نسبة الهالك إلى إجمالي الاستهلاك'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
