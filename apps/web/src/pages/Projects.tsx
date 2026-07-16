import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { EntityTable } from '@/components/admin/EntityTable';
import type { EntityColumn } from '@/components/admin/EntityTable';
import { ConfirmDeleteDialog } from '@/components/admin/ConfirmDeleteDialog';
import { UserMultiSelect } from '@/components/admin/UserMultiSelect';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { projectAdmin, accountAdmin } from '@/services/adminService';
import type { ProjectListItem, AccountListItem } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ProjectFormState {
  name: string;
  account_id: number | null;
  status: string;
  managers: number[];
}

const EMPTY_FORM: ProjectFormState = { name: '', account_id: null, status: 'active', managers: [] };

const Projects = () => {
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  useEffect(() => {
    accountAdmin.list({ page_size: 200 }).then((res) => setAccounts(res.accounts));
  }, []);

  const { items, total, page, setPage, search, setSearch, isLoading, error, refetch } = usePaginatedList<ProjectListItem>(
    async ({ search, page, page_size }) => {
      const res = await projectAdmin.list({ search: search || undefined, page, page_size });
      return { items: res.projects, total: res.total };
    }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProjectFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ProjectListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (error?.status === 403) {
    return (
      <Layout>
        <h1 className="text-2xl font-display font-bold mb-6">Projects</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </Layout>
    );
  }

  const accountName = (id: number) => accounts.find((a) => a.id === id)?.name ?? '-';

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (row: ProjectListItem) => {
    setEditingId(row.id);
    setForm({ name: row.name, account_id: row.account_id, status: row.status, managers: [] });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.account_id) return;
    setIsSaving(true);
    try {
      if (editingId === null) {
        await projectAdmin.create({ name: form.name, account_id: form.account_id, status: form.status, managers: form.managers });
        toast.success('Project created');
      } else {
        await projectAdmin.update(editingId, {
          name: form.name,
          account_id: form.account_id,
          status: form.status,
          managers: form.managers,
        });
        toast.success('Project updated');
      }
      setDialogOpen(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await projectAdmin.remove(deletingItem.id);
      toast.success('Project deleted');
      setDeletingItem(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: EntityColumn<ProjectListItem>[] = [
    { key: 'name', label: 'Name', render: (row) => row.name },
    { key: 'account', label: 'Account', render: (row) => accountName(row.account_id) },
    { key: 'status', label: 'Status', render: (row) => row.status },
  ];

  return (
    <Layout>
      <h1 className="text-2xl font-display font-bold mb-6">Projects</h1>
      <div className="flex items-center justify-between mb-4 gap-4">
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openCreate}>Add Project</Button>
      </div>

      <EntityTable
        columns={columns}
        rows={items}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onEdit={openEdit}
        onDelete={setDeletingItem}
        emptyMessage="No projects found"
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
            <DialogTitle>{editingId === null ? 'Add Project' : 'Edit Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input id="project-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                value={form.account_id ? String(form.account_id) : undefined}
                onValueChange={(value) => setForm({ ...form, account_id: Number(value) })}
              >
                <SelectTrigger aria-label="Account">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project Managers</Label>
              <UserMultiSelect label="Managers" selected={form.managers} onChange={(managers) => setForm({ ...form, managers })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name || !form.account_id}>
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

export default Projects;
