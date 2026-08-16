import { useState } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Warehouse } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      const message =
      err?.response?.data?.message ||
      'خطأ في تسجيل الدخول. تحقق من بيانات المستخدم وحاول مرة أخرى.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[url('/login.png')] bg-cover bg-center bg-no-repeat px-4">
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-sidebar-accent/80 backdrop-blur-sm shadow-sm border border-sidebar-border">
            <Warehouse className="size-6 text-sidebar-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-white drop-shadow-sm">
            MessOps
          </h1>
          <p className="mt-1 text-sm text-gray-300 drop-shadow-sm">نظام عمليات المطاعم العسكرية</p>
        </div>

        <Card className="p-6 shadow-xl border-sidebar-border/50 bg-card/95 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required />
              
            </div>

            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required />
              
            </div>

            {error &&
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            }

            <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full">
              تسجيل الدخول
            </Button>
          </form>
        </Card>
      </div>
    </div>);

}