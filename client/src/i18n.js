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
        purchaseRequests: 'طلبات الشراء',
        purchaseOrders: 'أوامر الشراء',
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
      },
      purchaseRequests: {
        title: 'طلبات الشراء',
        create: 'إنشاء طلب شراء',
        edit: 'تعديل طلب شراء',
        details: 'تفاصيل طلب الشراء',
        fields: {
          requestNumber: 'رقم الطلب',
          warehouse: 'المستودع',
          requestedBy: 'مقدم الطلب',
          createdAt: 'تاريخ الإنشاء',
          items: 'الأصناف',
          product: 'المنتج',
          quantity: 'الكمية',
          unit: 'الوحدة',
          notes: 'الملاحظات',
          status: 'الحالة',
          createdBy: 'أنشئ بواسطة',
          approvedBy: 'اعتمد بواسطة',
          approvedAt: 'تاريخ الاعتماد',
          rejectedBy: 'رفض بواسطة',
          rejectedAt: 'تاريخ الرفض',
          rejectionReason: 'سبب الرفض'
        },
        status: {
          draft: 'مسودة',
          submitted: 'قيد المراجعة',
          approved: 'معتمد',
          rejected: 'مرفوض',
          cancelled: 'ملغي'
        },
        actions: {
          submit: 'إرسال للمراجعة',
          approve: 'اعتماد',
          reject: 'رفض',
          rejectRequest: 'رفض الطلب',
          cancel: 'إلغاء الطلب',
          delete: 'حذف',
          edit: 'تعديل',
          addItem: 'إضافة صنف',
          remove: 'إزالة',
          confirm: 'تأكيد',
          cancelAction: 'إلغاء'
        },
        messages: {
          empty: 'لا توجد طلبات شراء',
          loading: 'جاري التحميل',
          error: 'حدث خطأ',
          createSuccess: 'تم إنشاء الطلب بنجاح',
          updateSuccess: 'تم تحديث الطلب بنجاح',
          submitSuccess: 'تم إرسال الطلب للمراجعة',
          approveSuccess: 'تم اعتماد الطلب',
          rejectSuccess: 'تم رفض الطلب',
          cancelSuccess: 'تم إلغاء الطلب',
          deleteSuccess: 'تم حذف الطلب'
        }
      },
      purchaseOrders: {
        title: 'أوامر الشراء',
        create: 'إنشاء أمر شراء',
        edit: 'تعديل أمر شراء',
        details: 'تفاصيل أمر الشراء',
        fields: {
          orderNumber: 'رقم الأمر',
          purchaseRequest: 'طلب الشراء',
          supplier: 'المورد',
          warehouse: 'المستودع',
          orderDate: 'تاريخ الأمر',
          createdAt: 'تاريخ الإنشاء',
          items: 'الأصناف',
          product: 'المنتج',
          quantity: 'الكمية المطلوبة',
          unit: 'الوحدة',
          unitPrice: 'سعر الوحدة',
          subtotal: 'المجموع الفرعي',
          totalPrice: 'الإجمالي',
          receivedQuantity: 'الكمية المستلمة',
          remainingQuantity: 'الكمية المتبقية',
          notes: 'الملاحظات',
          status: 'الحالة',
          createdBy: 'أنشئ بواسطة',
          approvedBy: 'اعتمد بواسطة',
          approvedAt: 'تاريخ الاعتماد',
          rejectedBy: 'رفض بواسطة',
          rejectedAt: 'تاريخ الرفض',
          rejectionReason: 'سبب الرفض'
        },
        status: {
          draft: 'مسودة',
          submitted: 'قيد المراجعة',
          approved: 'معتمد',
          rejected: 'مرفوض',
          partially_received: 'مستلم جزئياً',
          fully_received: 'مستلم بالكامل',
          cancelled: 'ملغي'
        },
        actions: {
          submit: 'إرسال للمراجعة',
          approve: 'اعتماد',
          reject: 'رفض',
          rejectRequest: 'رفض الأمر',
          cancel: 'إلغاء الأمر',
          delete: 'حذف',
          edit: 'تعديل',
          addItem: 'إضافة صنف',
          remove: 'إزالة',
          confirm: 'تأكيد',
          cancelAction: 'إلغاء',
          receive: 'استلام',
          viewDetails: 'عرض التفاصيل'
        },
        messages: {
          empty: 'لا توجد أوامر شراء',
          loading: 'جاري التحميل',
          error: 'حدث خطأ',
          createSuccess: 'تم إنشاء أمر الشراء بنجاح',
          updateSuccess: 'تم تحديث أمر الشراء بنجاح',
          submitSuccess: 'تم إرسال الأمر للمراجعة',
          approveSuccess: 'تم اعتماد الأمر',
          rejectSuccess: 'تم رفض الأمر',
          cancelSuccess: 'تم إلغاء الأمر',
          deleteSuccess: 'تم حذف أمر الشراء بنجاح'
        }
      },
      receiving: {
        title: 'سندات الاستلام',
        details: 'تفاصيل سند الاستلام',
        create: 'إنشاء سند استلام',
        fields: {
          receivingNumber: 'رقم سند الاستلام',
          purchaseOrder: 'أمر الشراء',
          supplier: 'المورد',
          warehouse: 'المستودع',
          receivingDate: 'تاريخ الاستلام',
          status: 'الحالة',
          items: 'الأصناف',
          product: 'المنتج',
          unit: 'الوحدة',
          orderedQuantity: 'الكمية المطلوبة',
          previouslyReceived: 'الكمية المستلمة سابقاً',
          remainingQuantity: 'الكمية المتبقية',
          receivingQuantity: 'الكمية المستلمة الآن',
          batchNumber: 'رقم التشغيلة',
          manufacturingDate: 'تاريخ التصنيع',
          expiryDate: 'تاريخ الانتهاء',
          unitCost: 'تكلفة الوحدة',
          notes: 'الملاحظات',
          createdBy: 'بواسطة',
          cancelReason: 'سبب الإلغاء'
        },
        status: {
          draft: 'مسودة',
          completed: 'مكتمل',
          cancelled: 'ملغي'
        },
        actions: {
          create: 'إتمام الاستلام',
          cancelReceiving: 'إلغاء الاستلام',
          confirmCancel: 'تأكيد الإلغاء',
          save: 'حفظ',
          viewDetails: 'عرض التفاصيل',
          cancelAction: 'إلغاء'
        },
        messages: {
          empty: 'لا توجد سندات استلام',
          loading: 'جاري التحميل',
          error: 'حدث خطأ',
          success: 'نجاح'
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
