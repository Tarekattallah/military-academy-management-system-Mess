
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'sonner';

export function AppLayout({ title, children }) {
  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 w-full">
        <Header title={title} />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
      <Toaster position="top-left" richColors />
    </div>
  );
}