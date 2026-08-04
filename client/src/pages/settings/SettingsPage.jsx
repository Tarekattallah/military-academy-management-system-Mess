import { useState, useEffect } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Settings, ShieldAlert, User, Cpu, Database, RefreshCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { getSystemSettings, updateSystemSettings } from '../../lib/api/entities';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings
  });

  const [appName, setAppName] = useState('نظام عمليات المطاعم العسكرية (MessOps)');
  const [unitCode, setUnitCode] = useState('SEC-MIL-HQ-01');
  const [language, setLanguage] = useState('ar');

  useEffect(() => {
    if (settings) {
      setAppName(settings.appName);
      setUnitCode(settings.unitCode);
      setLanguage(settings.language);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      localStorage.setItem('messops_app_name', data.appName);
      localStorage.setItem('messops_unit_code', data.unitCode);
      localStorage.setItem('messops_language', data.language);
      toast.success('تم حفظ إعدادات النظام العامة بنجاح');
    },
    onError: (err) => {
      toast.error(err.message || 'فشل حفظ الإعدادات');
    }
  });

  function handleSaveGeneral(e) {
    e.preventDefault();
    updateMutation.mutate({ appName, unitCode, language: language });
  }

  function handleClearCache() {
    queryClient.clear();
    toast.success('تمت إعادة تهيئة وتنظيف الذاكرة المؤقتة للنظام');
  }

  return (
    <AppLayout title="إعدادات النظام">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* General System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="size-4 text-primary" />
              الإعدادات العامة للنظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <FormField label="اسم النظام / التطبيق">
                <Input value={appName} onChange={(e) => setAppName(e.target.value)} disabled={isLoading || updateMutation.isPending} />
              </FormField>

              <FormField label="رمز الجهة العسكرية / الوحدة الرئيسية">
                <Input value={unitCode} onChange={(e) => setUnitCode(e.target.value)} disabled={isLoading || updateMutation.isPending} />
              </FormField>

              <FormField label="لغة واجهة المستخدم">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={isLoading || updateMutation.isPending}
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  
                  <option value="ar">العربية (الأصلية)</option>
                  <option value="en">English (الانجليزية)</option>
                </select>
              </FormField>

              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={updateMutation.isPending} disabled={isLoading}>حفظ الإعدادات</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* User Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4 text-primary" />
              معلومات الحساب النشط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b border-border pb-4 text-sm">
              <div>
                <span className="block text-xs text-muted-foreground mb-0.5">اسم المستخدم الكامل</span>
                <span className="font-semibold text-foreground">{user?.displayName || '—'}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground mb-0.5">اسم المستخدم (الحساب)</span>
                <span className="font-mono font-semibold text-foreground">{user?.username || '—'}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground mb-0.5">البريد الإلكتروني</span>
                <span className="font-mono text-foreground">{user?.email || '—'}</span>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground mb-0.5">الدور الوظيفي الرئيسي</span>
                <span className="font-semibold text-primary">{user?.roles?.join(', ') || '—'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 text-destructive">
                <ShieldAlert className="size-3.5" />
                الصلاحيات المتاحة لحسابك
              </h4>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto border border-border/80 rounded-md p-2 bg-secondary/15">
                {user?.permissions?.map((p, idx) =>
                <span key={idx} className="bg-secondary/60 text-secondary-foreground text-[10px] px-2 py-0.5 rounded font-mono">
                    {p}
                  </span>
                ) || <span className="text-xs text-muted-foreground">لا توجد صلاحيات مسجلة</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Diagnostics & Utilities */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="size-4 text-primary" />
              بيئة التشغيل والتشخيص
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-secondary/10">
                <Database className="size-5 text-success" />
                <div>
                  <h5 className="text-xs font-bold text-foreground">قاعدة البيانات الرئيسية</h5>
                  <p className="text-[10px] text-success font-medium">متصلة وتعمل بصورة صحيحة</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-secondary/10">
                <Cpu className="size-5 text-primary" />
                <div>
                  <h5 className="text-xs font-bold text-foreground">خادم الواجهة الخلفية (API)</h5>
                  <p className="text-[10px] text-success font-medium">مستقر: 200 OK (v1.0.0)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border border-border rounded-md bg-secondary/10">
                <RefreshCcw className="size-5 text-warning" />
                <div>
                  <h5 className="text-xs font-bold text-foreground">مخزن الذاكرة المؤقتة (Query Cache)</h5>
                  <button
                    onClick={handleClearCache}
                    className="text-[10px] text-primary hover:underline font-semibold block text-right mt-0.5">
                    
                    تهيئة وتحديث الكاش
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>);

}