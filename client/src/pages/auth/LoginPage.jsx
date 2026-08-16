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
      
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-black/40 backdrop-blur-md shadow-lg border border-white/10">
            <Warehouse className="size-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide drop-shadow-md">
            MessOps
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-300 tracking-wide drop-shadow-md">نظام عمليات المطاعم العسكرية</p>
        </div>

        <Card className="p-8 shadow-2xl !border-white/10 !bg-black/40 backdrop-blur-md rounded-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <Label htmlFor="username" className="!text-gray-300 !font-bold">اسم المستخدم</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="!bg-black/50 !border-white/20 !text-white !ring-primary/50 focus-visible:!border-primary !py-5"
                required />
              
            </div>

            <div>
              <Label htmlFor="password" className="!text-gray-300 !font-bold">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="!bg-black/50 !border-white/20 !text-white !ring-primary/50 focus-visible:!border-primary !py-5"
                required />
              
            </div>

            {error &&
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-medium text-center">
                {error}
              </p>
            }

            <Button type="submit" isLoading={isSubmitting} className="mt-4 w-full !bg-primary hover:!bg-primary/90 !text-primary-foreground !font-bold !rounded-xl !py-6 text-lg transition-all duration-300 shadow-lg hover:shadow-primary/20">
              تسجيل الدخول
            </Button>
          </form>
        </Card>
      </div>
    </div>);

}