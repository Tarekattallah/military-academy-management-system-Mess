import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'sonner';

export function AppLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header title={title} />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
      <Toaster position="top-left" richColors />
    </div>
  );
}
