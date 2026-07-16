import { useState } from 'react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { EntityTable } from '@/components/admin/EntityTable';
import type { EntityColumn } from '@/components/admin/EntityTable';
import { ConfirmDeleteDialog } from '@/components/admin/ConfirmDeleteDialog';
import { UserMultiSelect } from '@/components/admin/UserMultiSelect';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { clusterAdmin } from '@/services/adminService';
import type { ClusterListItem } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ClusterFormState {
  name: string;
  description: string;
  heads: number[];
}

const EMPTY_FORM: ClusterFormState = { name: '', description: '', heads: [] };

const Clusters = () => {
  const { items, total, page, setPage, search, setSearch, isLoading, error, refetch } = usePaginatedList<ClusterListItem>(
    async ({ search, page, page_size }) => {
      const res = await clusterAdmin.list({ search: search || undefined, page, page_size });
      return { items: res.clusters, total: res.total };
    }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClusterFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ClusterListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (error?.status === 403) {
    return (
      <Layout>
        <h1 className="text-2xl font-display font-bold mb-6">Clusters</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </Layout>
    );
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (row: ClusterListItem) => {
    setEditingId(row.id);
    setForm({ name: row.name, description: row.description ?? '', heads: [] });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingId === null) {
        await clusterAdmin.create({ name: form.name, description: form.description || null, heads: form.heads });
        toast.success('Cluster created');
      } else {
        await clusterAdmin.update(editingId, { name: form.name, description: form.description || null, heads: form.heads });
        toast.success('Cluster updated');
      }
      setDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save cluster');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await clusterAdmin.remove(deletingItem.id);
      toast.success('Cluster deleted');
      setDeletingItem(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete cluster');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: EntityColumn<ClusterListItem>[] = [
    { key: 'name', label: 'Name', render: (row) => row.name },
    { key: 'description', label: 'Description', render: (row) => row.description ?? '-' },
    { key: 'account_count', label: 'Accounts', render: (row) => row.account_count },
  ];

  return (
    <Layout>
      <h1 className="text-2xl font-display font-bold mb-6">Clusters</h1>
      <div className="flex items-center justify-between mb-4 gap-4">
        <Input
          placeholder="Search clusters..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openCreate}>Add Cluster</Button>
      </div>

      <EntityTable
        columns={columns}
        rows={items}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onEdit={openEdit}
        onDelete={setDeletingItem}
        emptyMessage="No clusters found"
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
            <DialogTitle>{editingId === null ? 'Add Cluster' : 'Edit Cluster'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cluster-name">Name</Label>
              <Input id="cluster-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cluster-description">Description</Label>
              <Textarea
                id="cluster-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Cluster Heads</Label>
              <UserMultiSelect label="Heads" selected={form.heads} onChange={(heads) => setForm({ ...form, heads })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name}>
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

export default Clusters;
