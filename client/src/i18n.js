import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      sidebar: {
        inventory: 'Inventory',
        transactions: 'Transactions',
        meals: 'Meals',
        admin: 'Administration',
        products: 'Products',
        categories: 'Categories',
        units: 'Units',
        suppliers: 'Suppliers',
        warehouses: 'Warehouses',
        receiving: 'Receiving',
        transfers: 'Transfers',
        returns: 'Returns',
        waste: 'Waste',
        stockCounts: 'Stock Counts',
        batches: 'Batches',
        menus: 'Menus',
        recipes: 'Recipes',
        attendance: 'Attendance',
        mealRequests: 'Meal Requests',
        reservations: 'Reservations',
        dashboard: 'Dashboard',
        notifications: 'Notifications',
        users: 'Users',
        roles: 'Roles',
        reports: 'Reports',
        settings: 'Settings',
        auditLog: 'Audit Log',
        systemName: 'MessOps',
        systemDesc: 'Military Mess Operations System'
      },
      userRoles: {
        'Super Administrator': 'Super Administrator'
      },
      header: {
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        logout: 'Logout',
        noRole: 'No Role',
        language: 'عربي'
      },
      dashboard: {
        title: 'Dashboard',
        welcome: 'Welcome back,',
        smartAnalysis: 'Smart Analysis Board',
        systemSummary: 'System Summary',
        inventoryOverview: 'Inventory Overview',
        todayOps: 'Today\'s Operations',
        consumption: 'Consumption',
        waste: 'Waste',
        reservations: 'Reservations',
        distributions: 'Distributions',
        warehouseStats: 'Warehouse Statistics',
        stockHealth: 'Stock Health Index',
        healthDesc: 'Usable batches ratio',
        efficiency: 'Consumption Efficiency',
        efficiencyIdeal: 'Ideal',
        efficiencyAvg: 'Average',
        efficiencyDesc: 'Based on monthly withdrawal rates',
        wasteRatio: 'Monthly Waste Ratio',
        wasteDesc: 'Waste to total consumption ratio'
      }
    }
  },
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
        'Super Administrator': 'مدير عام النظام'
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
    lng: localStorage.getItem('language') || 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
