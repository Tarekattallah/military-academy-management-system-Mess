import { AppLayout } from '../components/layout/AppLayout';
import { Card } from '../components/ui/Card';
import { Inbox } from 'lucide-react';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <AppLayout title={title}>
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 rounded-full bg-secondary p-4">
            <Inbox className="size-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">الوحدة قيد التطوير</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm text-center">
            سيتم ربط وحدة {title} هنا بعد اكتمال نقاط النهاية الخلفية.
          </p>
        </div>
      </Card>
    </AppLayout>
  );
}
