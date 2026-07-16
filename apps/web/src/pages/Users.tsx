import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { EntityTable } from '@/components/admin/EntityTable';
import type { EntityColumn } from '@/components/admin/EntityTable';
import { ConfirmDeleteDialog } from '@/components/admin/ConfirmDeleteDialog';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { userAdmin, roleAdmin } from '@/services/adminService';
import type { AdminUserItem, Role } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

interface UserFormState {
  name: string;
  email: string;
  role: string;
  department: string;
}

const EMPTY_FORM: UserFormState = { name: '', email: '', role: '', department: '' };

const Users = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  useEffect(() => {
    roleAdmin.list().then((res) => setRoles(res.roles));
  }, []);

  const { items, total, page, setPage, search, setSearch, isLoading, error, refetch } = usePaginatedList<AdminUserItem>(
    async ({ search, page, page_size }) => {
      const res = await userAdmin.list({ search: search || undefined, page, page_size });
      return { items: res.users, total: res.total };
    }
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingItem, setDeletingItem] = useState<AdminUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  if (error?.status === 403) {
    return (
      <Layout>
        <h1 className="text-2xl font-display font-bold mb-6">Users</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </Layout>
    );
  }

  const roleLabel = (value: string) => roles.find((r) => r.value === value)?.label ?? value;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (row: AdminUserItem) => {
    setEditingId(row.id);
    setForm({ name: row.name, email: row.email, role: row.role, department: row.department ?? '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.role) return;
    setIsSaving(true);
    try {
      if (editingId === null) {
        const { temp_password } = await userAdmin.create({
          name: form.name,
          email: form.email,
          role: form.role,
          department: form.department || null,
        });
        setDialogOpen(false);
        setTempPassword(temp_password);
        toast.success('User created');
      } else {
        await userAdmin.update(editingId, {
          name: form.name,
          email: form.email,
          role: form.role,
          department: form.department || null,
        });
        setDialogOpen(false);
        toast.success('User updated');
      }
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsDeleting(true);
    try {
      await userAdmin.remove(deletingItem.id);
      toast.success('User deactivated');
      setDeletingItem(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate user');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: EntityColumn<AdminUserItem>[] = [
    { key: 'name', label: 'Name', render: (row) => row.name },
    { key: 'email', label: 'Email', render: (row) => row.email },
    { key: 'role', label: 'Role', render: (row) => <Badge variant="secondary">{roleLabel(row.role)}</Badge> },
    { key: 'department', label: 'Department', render: (row) => row.department ?? '-' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (row.is_active ? <Badge variant="outline">Active</Badge> : <Badge variant="destructive">Inactive</Badge>),
    },
  ];

  return (
    <Layout>
      <h1 className="text-2xl font-display font-bold mb-6">Users</h1>
      <div className="flex items-center justify-between mb-4 gap-4">
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Button onClick={openCreate}>Add User</Button>
      </div>

      <EntityTable
        columns={columns}
        rows={items}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        onEdit={openEdit}
        onDelete={setDeletingItem}
        emptyMessage="No users found"
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
            <DialogTitle>{editingId === null ? 'Add User' : 'Edit User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input id="user-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role || undefined} onValueChange={(value) => setForm({ ...form, role: value })}>
                <SelectTrigger aria-label="Role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-department">Department</Label>
              <Input
                id="user-department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.name || !form.email || !form.role}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tempPassword !== null} onOpenChange={(next) => !next && setTempPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Created</DialogTitle>
            <DialogDescription>
              Share this temporary password with the user now — it will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted p-3 font-mono text-sm">{tempPassword}</div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (tempPassword) navigator.clipboard.writeText(tempPassword);
              }}
            >
              Copy
            </Button>
            <Button variant="outline" onClick={() => setTempPassword(null)}>
              Close
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

export default Users;
