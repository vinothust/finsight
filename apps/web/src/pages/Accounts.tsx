import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { EntityTable } from '@/components/admin/EntityTable';
import type { EntityColumn } from '@/components/admin/EntityTable';
import { ConfirmDeleteDialog } from '@/components/admin/ConfirmDeleteDialog';
import { UserMultiSelect } from '@/components/admin/UserMultiSelect';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { accountAdmin, clusterAdmin } from '@/services/adminService';
import type { AccountListItem, ClusterListItem } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface AccountFormState {
  name: string;
  cluster_id: number | null;
  directors: number[];
}

const EMPTY_FORM: AccountFormState = { name: '', cluster_id: null, directors: [] };

const Accounts = () => {
  const [clusters, setClusters] = useState<ClusterListItem[]>([]);
  useEffect(() => {
    clusterAdmin.list({ page_size: 200 }).then((res) => setClusters(res.clusters));
  }, []);

  const { items, total, page, setPage, search, setSearch, isLoading, error, refetch } = usePaginatedList<AccountListItem>(
    async ({ search, page, page_size }) => {
      const res = await accountAdmin.list({ search: search || undefined, page, page_size });
      return { items: res.accounts, total: res.total };
    }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AccountFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState<AccountListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (error?.status === 403) {
    return (
      <Layout>
        <h1 className="text-2xl font-display font-bold mb-6">Accounts</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </Layout>
    );
  }

  const clusterName = (id: number) => clusters.find((c) => c.id === id)?.name ?? '-';

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (row: AccountListItem) => {
    setEditingId(row.id);
    setForm({ name: row.name, cluster_id: row.cluster_id, directors: [] });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.cluster_id) return;
    setIsSaving(true);
    try {
      if (editingId === null) {
        await accountAdmin.create({ name: form.name, cluster_id: form.cluster_id, directors: form.directors });
        toast.success('Account created');
      } else {
        await accountAdmin.update(editingId, { name: form.name, cluster_id: form.cluster_id, directors: form.directors });
        toast.success('Account updated');
      }
      setDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await accountAdmin.remove(deletingItem.id);
      toast.success('Account deleted');
      setDeletingItem(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: EntityColumn<AccountListItem>[] = [
    { key: 'name', label: 'Name', render: (row) => row.name },
    { key: 'cluster', label: 'Cluster', render: (row) => clusterName(row.cluster_id) },
    { key: 'project_count', label: 'Projects', render: (row) => row.project_count },
  ];

  return (
    <Layout>
      <h1 className="text-2xl font-display font-bold mb-6">Accounts</h1>
      <div className="flex items-center justify-between mb-4 gap-4">
        <Input
          placeholder="Search accounts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openCreate}>Add Account</Button>
      </div>

      <EntityTable
        columns={columns}
        rows={items}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onEdit={openEdit}
        onDelete={setDeletingItem}
        emptyMessage="No accounts found"
      />

      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>{total} total</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={items.length < 20} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId === null ? 'Add Account' : 'Edit Account'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Name</Label>
              <Input id="account-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cluster</Label>
              <Select
                value={form.cluster_id ? String(form.cluster_id) : undefined}
                onValueChange={(value) => setForm({ ...form, cluster_id: Number(value) })}
              >
                <SelectTrigger aria-label="Cluster">
                  <SelectValue placeholder="Select a cluster" />
                </SelectTrigger>
                <SelectContent>
                  {clusters.map((cluster) => (
                    <SelectItem key={cluster.id} value={String(cluster.id)}>
                      {cluster.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account Directors</Label>
              <UserMultiSelect label="Directors" selected={form.directors} onChange={(directors) => setForm({ ...form, directors })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name || !form.cluster_id}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deletingItem && (
        <ConfirmDeleteDialog
          open
          itemLabel={deletingItem.name}
          isPending={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
        />
      )}
    </Layout>
  );
};

export default Accounts;
