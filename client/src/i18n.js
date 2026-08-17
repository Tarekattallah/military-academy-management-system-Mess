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
        wasteDesc: 'نسبة الهالك إلى إجمالي الاستهلاك',
        dailyClosingStatus: 'حالة اليومية'
      },
      dailyClosing: {
        title: 'الإغلاق اليومي',
        openDayTitle: 'فتح الإغلاق اليومي',
        status: {
          OPEN: 'مفتوح',
          RECONCILING: 'قيد التسوية',
          PENDING_APPROVAL: 'في انتظار الاعتماد',
          CLOSED: 'مغلق'
        },
        actions: {
          open: 'فتح اليومية',
          reconcile: 'بدء التسوية',
          continueReconcile: 'متابعة التسوية',
          submit: 'إرسال للاعتماد',
          approve: 'اعتماد وإغلاق اليومية'
        },
        sections: {
          openingStock: 'رصيد الافتتاح',
          closingStock: 'الرصيد الختامي',
          inventorySummary: 'ملخص المخزون',
          mealSummary: 'ملخص الوجبات',
          costSummary: 'ملخص التكاليف',
          reconciliation: 'التسويات'
        },
        fields: {
          date: 'تاريخ اليومية',
          warehouse: 'المستودع',
          currentStatus: 'الحالة الحالية',
          product: 'المنتج',
          batch: 'الدفعة',
          unit: 'الوحدة',
          quantity: 'الكمية',
          value: 'القيمة الإجمالية',
          plannedMeals: 'الوجبات المخططة',
          actualMeals: 'الوجبات المنفذة',
          executionRate: 'نسبة التنفيذ',
          totalStandardCost: 'التكلفة المعيارية',
          totalActualCost: 'التكلفة الفعلية',
          totalWasteCost: 'تكلفة الهدر',
          operationalCost: 'التكلفة التشغيلية',
          varianceAmount: 'قيمة الانحراف',
          totalReceiving: 'الوارد',
          totalIssue: 'المنصرف',
          totalWaste: 'الهالك',
          totalReturn: 'المرتجع',
          totalTransferIn: 'تحويل وارد',
          totalTransferOut: 'تحويل صادر',
          totalAdjustment: 'التسويات',
          expectedStock: 'الرصيد المتوقع',
          physicalStock: 'الرصيد الفعلي',
          discrepancy: 'الفرق'
        },
        messages: {
          frozenError: 'اليومية مغلقة ولا يمكن تعديل عملياتها.',
          approveConfirm: 'هل أنت متأكد من اعتماد وإغلاق اليومية؟ بعد الإغلاق لن يمكن تعديل العمليات الخاصة بهذا اليوم.',
          closedInfo: 'اليومية مغلقة ولا يمكن تعديل عمليات هذا اليوم بعد الاعتماد.',
          noDayOpened: 'اليومية غير مفتوحة بعد',
          openDayConfirm: 'هل أنت متأكد من فتح يومية جديدة لهذا المستودع؟',
          submitConfirm: 'هل أنت متأكد من إرسال اليومية للاعتماد؟ ستتوقف العمليات ولن يمكن إجراء حركات مخزنية لهذا اليوم.'
        }
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
