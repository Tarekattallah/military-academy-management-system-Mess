import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'No data',
  description = 'There are no items to display.'



}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-4 rounded-full bg-secondary p-4">
        <Inbox className="size-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm text-center">{description}</p>
    </div>);

}