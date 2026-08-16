import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Input';
import { Eye, EyeOff, User, Lock, Star, ShieldCheck, LineChart, Utensils, ArrowLeft } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="relative flex h-[100dvh] w-full flex-col bg-[url('/login-bg.png')] bg-cover bg-center bg-no-repeat px-4 font-['Cairo'] overflow-hidden">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70"></div>
      
      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center w-full py-2 sm:py-6">
        
        <div className="flex flex-col lg:flex-row-reverse items-center justify-center gap-4 sm:gap-8 lg:gap-16 w-full max-w-[1100px] mb-4 sm:mb-12">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center shrink-0">
            <img src="/logo-full.png" alt="MessOps Logo" className="w-[180px] sm:w-[260px] md:w-[320px] lg:w-[380px] object-contain drop-shadow-2xl mix-blend-lighten" />
          </div>

          {/* Form Section */}
          <div className="w-full max-w-[320px]">
            <div className="p-4 sm:p-6 border border-[#1a261c] bg-[#0c130f]/95 rounded-xl shadow-2xl">
              
              <div className="text-center mb-4 sm:mb-6">
                <div className="flex justify-center mb-1.5 sm:mb-3">
                  <img src="/logo-text.png" alt="MessOps Text" className="h-3 sm:h-3.5 object-contain mix-blend-lighten drop-shadow-sm opacity-90" />
                </div>
                <p className="text-[#c5a059] text-[10px] sm:text-[11px] font-semibold mb-0.5 sm:mb-1">مرحباً بك في</p>
                <h1 className="text-sm sm:text-lg font-bold text-white mb-1 leading-relaxed">نظام إدارة عمليات الإطعام العسكري</h1>
                <p className="text-[#8e9992] text-[7px] sm:text-[9px] tracking-[0.25em] font-sans">MILITARY MESS OPERATIONS</p>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 opacity-70">
                   <div className="h-[1px] bg-gradient-to-r from-transparent to-[#c5a059] w-8 sm:w-12"></div>
                   <Star className="size-2 text-[#c5a059] fill-[#c5a059]" />
                   <div className="h-[1px] bg-gradient-to-l from-transparent to-[#c5a059] w-8 sm:w-12"></div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:gap-3">
                <div>
                  <Label htmlFor="username" className="!text-[#a3b0a8] mb-1 block text-[9px] sm:text-[11px]">اسم المستخدم</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-3 flex items-center justify-center text-[#5c6b62]">
                      <User className="size-3 sm:size-3.5" />
                    </div>
                    <Input
                      id="username"
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="!bg-[#070b09] !border-[#151f18] !text-white focus-visible:!border-[#213526] focus-visible:ring-0 !h-8 sm:!h-10 !pr-8 sm:!pr-9 !pl-3 !rounded-md text-[11px] sm:text-xs"
                      placeholder="admin"
                      required />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="!text-[#a3b0a8] mb-1 block text-[9px] sm:text-[11px]">كلمة المرور</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-3 flex items-center justify-center text-[#5c6b62]">
                      <Lock className="size-3 sm:size-3.5" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="!bg-[#070b09] !border-[#151f18] !text-white focus-visible:!border-[#213526] focus-visible:ring-0 !h-8 sm:!h-10 !pr-8 sm:!pr-9 !pl-8 sm:!pl-9 !rounded-md text-[11px] sm:text-xs tracking-widest"
                      placeholder="••••••••"
                      required />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-2.5 flex items-center justify-center text-[#5c6b62] hover:text-white transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="size-3 sm:size-3.5" /> : <Eye className="size-3 sm:size-3.5" />}
                    </button>
                  </div>
                </div>

                {error &&
                <p className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-[9px] sm:text-[11px] text-red-400 font-medium text-center">
                    {error}
                  </p>
                }

                <Button type="submit" isLoading={isSubmitting} className="relative mt-1 w-full !bg-[#1c3323] hover:!bg-[#23422d] !text-white font-bold !rounded-md !h-8 sm:!h-10 text-[11px] sm:text-xs transition-all duration-300">
                  <span>تسجيل الدخول</span>
                  {!isSubmitting && <ArrowLeft className="absolute left-3 size-3 sm:size-3.5 opacity-80" />}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Features */}
        <div className="w-full max-w-[900px] grid grid-cols-3 gap-2 sm:gap-6 px-1 sm:px-4">
          
          {/* Feature 1: Utensils */}
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-4 bg-[#0a0f0d]/80 border border-[#1a261c] p-3 sm:p-5 rounded-xl shadow-lg">
            <div className="text-center sm:text-right flex-1">
              <h3 className="text-[#c5a059] font-bold text-[10px] sm:text-sm mb-1 sm:mb-2">تشغيل ممتاز</h3>
              <p className="text-[#6d7a72] text-[8px] sm:text-[11px] leading-relaxed hidden sm:block">كفاءة عالية في<br/>عمليات الإطعام</p>
            </div>
            <div className="flex size-10 sm:size-14 shrink-0 items-center justify-center rounded-full bg-black/40 border border-[#c5a059]/10 text-[#c5a059] shadow-inner">
              <Utensils className="size-5 sm:size-7 stroke-[1.5]" />
            </div>
          </div>
          
          {/* Feature 2: Chart */}
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-4 bg-[#0a0f0d]/80 border border-[#1a261c] p-3 sm:p-5 rounded-xl shadow-lg">
            <div className="text-center sm:text-right flex-1">
              <h3 className="text-[#c5a059] font-bold text-[10px] sm:text-sm mb-1 sm:mb-2">إدارة ذكية</h3>
              <p className="text-[#6d7a72] text-[8px] sm:text-[11px] leading-relaxed hidden sm:block">تقارير وتحليلات دقيقة<br/>لإدارة فعالة</p>
            </div>
            <div className="flex size-10 sm:size-14 shrink-0 items-center justify-center rounded-full bg-black/40 border border-[#c5a059]/10 text-[#c5a059] shadow-inner">
              <LineChart className="size-5 sm:size-7 stroke-[1.5]" />
            </div>
          </div>

          {/* Feature 3: Shield */}
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-4 bg-[#0a0f0d]/80 border border-[#1a261c] p-3 sm:p-5 rounded-xl shadow-lg">
            <div className="text-center sm:text-right flex-1">
              <h3 className="text-[#c5a059] font-bold text-[10px] sm:text-sm mb-1 sm:mb-2">موثوق وآمن</h3>
              <p className="text-[#6d7a72] text-[8px] sm:text-[11px] leading-relaxed hidden sm:block">حماية بياناتك<br/>بأعلى معايير الأمان</p>
            </div>
            <div className="flex size-10 sm:size-14 shrink-0 items-center justify-center rounded-full bg-black/40 border border-[#c5a059]/10 text-[#c5a059] shadow-inner">
              <ShieldCheck className="size-5 sm:size-7 stroke-[1.5]" />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}