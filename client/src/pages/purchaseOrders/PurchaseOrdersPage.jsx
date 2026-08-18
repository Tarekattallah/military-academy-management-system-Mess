import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  ClipboardCheck, 
  Plus, 
  Eye
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { getPurchaseOrders } from '../../lib/api/purchaseOrders';
import { AppLayout } from '../../components/layout/AppLayout';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { PurchaseOrderForm } from './components/PurchaseOrderForm';
import { createPurchaseOrder } from '../../lib/api/purchaseOrders';

const STATUS_VARIANTS = {
  draft: 'secondary',
  submitted: 'warning',
  approved: 'success',
  partially_received: 'info',
  fully_received: 'success',
  rejected: 'destructive',
  cancelled: 'destructive'
};

export function PurchaseOrdersPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [openCreate, setOpenCreate] = useState(false);

  const canCreate = hasPermission('purchase-orders:create');

  const { data: pos = [], isLoading } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: async () => {
      return getPurchaseOrders();
    }
  });

  const createMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['purchaseOrders']);
      setOpenCreate(false);
    }
  });

  const columns = [
    {
      header: t('purchaseOrders.fields.orderNumber'),
      accessorKey: 'orderNumber',
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.orderNumber}</span>
      )
    },
    {
      header: t('purchaseOrders.fields.purchaseRequest'),
      accessorKey: 'purchaseRequest',
      cell: ({ row }) => row.original.purchaseRequest?.requestNumber || '-'
    },
    {
      header: t('purchaseOrders.fields.supplier'),
      accessorKey: 'supplier',
      cell: ({ row }) => row.original.supplier?.name || '-'
    },
    {
      header: t('purchaseOrders.fields.warehouse'),
      accessorKey: 'warehouse',
      cell: ({ row }) => row.original.warehouse?.name || '-'
    },
    {
      header: t('purchaseOrders.fields.status'),
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status]}>
          {t(`purchaseOrders.status.${row.original.status}`)}
        </Badge>
      )
    },
    {
      header: t('purchaseOrders.fields.orderDate'),
      accessorKey: 'orderDate',
      cell: ({ row }) => row.original.orderDate ? format(new Date(row.original.orderDate), 'dd MMM yyyy', { locale: ar }) : '-'
    },
    {
      header: t('purchaseOrders.fields.totalPrice'),
      accessorKey: 'subtotal',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.subtotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/purchase-orders/${row.original._id}`)}
            title={t('purchaseOrders.actions.viewDetails')}
          >
            <Eye className="size-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <AppLayout title={t('purchaseOrders.title')}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardCheck className="size-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">{t('purchaseOrders.title')}</h1>
          </div>
          
          {canCreate && (
            <Button onClick={() => setOpenCreate(true)}>
              <Plus className="size-4 ml-2" />
              {t('purchaseOrders.create')}
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <DataTable
            data={pos}
            columns={columns}
            searchPlaceholder="البحث برقم الأمر..."
            searchField="orderNumber"
            isLoading={isLoading}
            emptyMessage={t('purchaseOrders.messages.empty')}
          />
        </div>
      </div>

      <Dialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        title={t('purchaseOrders.create')}
      >
        <PurchaseOrderForm
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
          onCancel={() => setOpenCreate(false)}
        />
      </Dialog>
    </AppLayout>
  );
}
