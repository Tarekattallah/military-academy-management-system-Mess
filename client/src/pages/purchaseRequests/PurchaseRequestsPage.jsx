import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, Edit, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { AppLayout } from '../../components/layout/AppLayout';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { Dialog } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { LogoLoader } from '../../components/ui/LogoLoader';
import {
  getPurchaseRequests,
  createPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequest
} from '../../lib/api/purchaseRequests';
import api from '../../lib/api';
import { PurchaseRequestForm } from './components/PurchaseRequestForm';

const STATUS_VARIANTS = {
  draft: 'secondary',
  submitted: 'warning',
  approved: 'success',
  rejected: 'destructive',
  cancelled: 'destructive'
};

export function PurchaseRequestsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Dialog states
  const [openCreate, setOpenCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const canCreate = hasPermission('purchase-requests:create');
  const canUpdate = hasPermission('purchase-requests:update');
  const canDelete = hasPermission('purchase-requests:delete');

  const { data: purchaseRequests = [], isLoading, error } = useQuery({
    queryKey: ['purchaseRequests'],
    queryFn: async () => {
      return getPurchaseRequests();
    }
  });

  const { data: warehousesResponse } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data } = await api.get('/warehouses');
      return data.data;
    }
  });
  const warehouses = warehousesResponse || [];

  const filteredRequests = useMemo(() => {
    return purchaseRequests.filter((pr) => {
      const matchWarehouse = !selectedWarehouse || pr.warehouse?._id === selectedWarehouse || pr.warehouse === selectedWarehouse;
      const matchStatus = !selectedStatus || pr.status === selectedStatus;
      return matchWarehouse && matchStatus;
    });
  }, [purchaseRequests, selectedWarehouse, selectedStatus]);

  const createMutation = useMutation({
    mutationFn: createPurchaseRequest,
    onSuccess: () => {
      toast.success(t('purchaseRequests.messages.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      setOpenCreate(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('purchaseRequests.messages.error'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePurchaseRequest(id, data),
    onSuccess: () => {
      toast.success(t('purchaseRequests.messages.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      setEditTarget(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('purchaseRequests.messages.error'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deletePurchaseRequest,
    onSuccess: () => {
      toast.success(t('purchaseRequests.messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['purchaseRequests'] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || t('purchaseRequests.messages.error'));
    }
  });


  const handleCreate = (values) => {
    // Map items to match backend requirements
    const mappedValues = {
      ...values,
      items: values.items.map(item => ({
        ...item,
        quantity: Number(item.quantity)
      }))
    };
    createMutation.mutate(mappedValues);
  };

  const handleUpdate = (values) => {
    if (!editTarget) return;
    const mappedValues = {
      ...values,
      items: values.items.map(item => ({
        ...item,
        quantity: Number(item.quantity)
      }))
    };
    updateMutation.mutate({ id: editTarget._id, data: mappedValues });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget._id);
  };

  const columns = [
    {
      accessorKey: 'requestNumber',
      header: t('purchaseRequests.fields.requestNumber'),
      cell: ({ row }) => <span className="font-mono text-xs font-medium">{row.original.requestNumber}</span>
    },
    {
      accessorKey: 'warehouse',
      header: t('purchaseRequests.fields.warehouse'),
      cell: ({ row }) => row.original.warehouse?.name ?? '—'
    },
    {
      accessorKey: 'requestedBy',
      header: t('purchaseRequests.fields.requestedBy'),
      cell: ({ row }) => row.original.requestedBy?.displayName ?? '—'
    },
    {
      accessorKey: 'items',
      header: t('purchaseRequests.fields.items'),
      cell: ({ row }) => <span className="font-mono">{row.original.items.length}</span>
    },
    {
      accessorKey: 'createdAt',
      header: t('purchaseRequests.fields.createdAt'),
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('ar-EG')
    },
    {
      accessorKey: 'status',
      header: t('purchaseRequests.fields.status'),
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status]}>
          {t(`purchaseRequests.status.${row.original.status}`)}
        </Badge>
      )
    },
    {
      id: 'actions',
      header: 'إجراءات',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/purchase-requests/${row.original._id}`)}
            title={t('purchaseRequests.details')}
          >
            <Eye className="size-4" />
          </Button>
          
          {canUpdate && row.original.status === 'draft' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditTarget(row.original)}
              title={t('purchaseRequests.actions.edit')}
            >
              <Edit className="size-4 text-blue-500" />
            </Button>
          )}

          {canDelete && row.original.status === 'draft' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row.original)}
              title={t('purchaseRequests.actions.delete')}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <AppLayout title={t('purchaseRequests.title')}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="size-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">{t('purchaseRequests.title')}</h1>
          </div>
          
          {canCreate && (
            <Button onClick={() => setOpenCreate(true)}>
              <Plus className="size-4 ml-2" />
              {t('purchaseRequests.create')}
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden p-4">
          {/* Filters */}
          <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-2">
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">كل المستودعات</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 w-full sm:w-auto rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">كل الحالات</option>
              <option value="draft">{t('purchaseRequests.status.draft')}</option>
              <option value="submitted">{t('purchaseRequests.status.submitted')}</option>
              <option value="approved">{t('purchaseRequests.status.approved')}</option>
              <option value="rejected">{t('purchaseRequests.status.rejected')}</option>
              <option value="cancelled">{t('purchaseRequests.status.cancelled')}</option>
            </select>
          </div>

          {isLoading ? (
            <div className="py-12"><LogoLoader /></div>
          ) : error ? (
            <div className="text-center text-destructive py-8 font-medium">
              فشل تحميل البيانات
            </div>
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              title={t('purchaseRequests.messages.empty')}
              description="قم بإنشاء طلب شراء جديد للبدء"
            />
          ) : (
            <DataTable 
              columns={columns} 
              data={filteredRequests}
              searchKey="requestNumber"
              searchPlaceholder="البحث برقم الطلب..."
            />
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog
        open={openCreate}
        onOpenChange={setOpenCreate}
        title={t('purchaseRequests.create')}
        description=""
      >
        <PurchaseRequestForm
          onSubmit={handleCreate}
          isSubmitting={createMutation.isPending}
          onCancel={() => setOpenCreate(false)}
        />
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(isOpen) => !isOpen && setEditTarget(null)}
        title={t('purchaseRequests.actions.edit')}
        description=""
      >
        {editTarget && (
          <PurchaseRequestForm
            defaultValues={{
              warehouse: editTarget.warehouse?._id,
              items: editTarget.items.map(i => ({
                product: i.product?._id,
                quantity: i.quantity,
                unit: i.unit?._id,
                notes: i.notes || ''
              }))
            }}
            onSubmit={handleUpdate}
            isSubmitting={updateMutation.isPending}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(isOpen) => !isOpen && setDeleteTarget(null)}
        title={t('purchaseRequests.actions.delete')}
        description={`هل أنت متأكد من حذف طلب الشراء ${deleteTarget?.requestNumber}؟`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              {t('purchaseRequests.actions.cancelAction')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              {t('purchaseRequests.actions.confirm')}
            </Button>
          </div>
        }
      >
        {/* Empty body for confirmation dialogs */}
      </Dialog>
    </AppLayout>
  );
}
