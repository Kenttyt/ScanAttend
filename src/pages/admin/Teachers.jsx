import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Search, Eye, EyeOff, KeyRound, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Teachers() {
  const { users, loading, fetchUsers, addUser, updateUser, deleteUser } = useUserStore();
  const teachers = users.filter(u => u.role === 'teacher');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ teacherId: '', name: '', password: '', grade: '', section: '' });
  const [search, setSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [pwTeacherId, setPwTeacherId] = useState(null);
  const [pwTeacherName, setPwTeacherName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.teacherId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    await addUser({ ...form, role: 'teacher' });
    setForm({ teacherId: '', name: '', password: '', grade: '', section: '' });
    setDialogOpen(false);
    toast.success('Teacher added successfully');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const { password, ...rest } = form;
    const updates = { ...rest, role: 'teacher' };
    if (password) updates.password = password;
    await updateUser(editingId, updates);
    setForm({ teacherId: '', name: '', password: '', grade: '', section: '' });
    setDialogOpen(false);
    setEditingId(null);
    toast.success('Teacher updated successfully');
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete teacher "${name}"?`)) return;
    try {
      await deleteUser(id);
      setForm({ teacherId: '', name: '', password: '', grade: '', section: '' });
      setEditingId(null);
      setDialogOpen(false);
      toast.success('Teacher deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete teacher');
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ teacherId: '', name: '', password: '', grade: '', section: '' });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEdit = (teacher) => {
    setEditingId(teacher.id);
    setForm({
      teacherId: teacher.teacherId || '',
      name: teacher.name || '',
      password: '',
      grade: teacher.grade || '',
      section: teacher.section || '',
    });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openPasswordDialog = (teacher) => {
    setPwTeacherId(teacher.id);
    setPwTeacherName(teacher.name);
    setNewPassword('');
    setShowNewPassword(false);
    setPwDialogOpen(true);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    await updateUser(pwTeacherId, { password: newPassword });
    setPwDialogOpen(false);
    setNewPassword('');
    toast.success(`Password updated for ${pwTeacherName}`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Teachers</CardTitle>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Teacher</Button>
        </CardHeader>
        <CardContent>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingId ? 'Edit Teacher' : 'Add New Teacher'}
                  {editingId && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(editingId, form.name)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={editingId ? handleEdit : handleAdd} className="space-y-5">
                <div>
                  <Label className="mb-2 block">Teacher ID</Label>
                  <Input placeholder="0000000" value={form.teacherId} onChange={e => setForm({ ...form, teacherId: e.target.value })} required />
                </div>
                <div>
                  <Label className="mb-2 block">Name</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                {!editingId && (
                  <div>
                    <Label className="mb-2 block">Password</Label>
                    <div className="relative">
                      <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Grade</Label>
                    <Input type="number" min="1" max="12" placeholder="1-12" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="mb-2 block">Section</Label>
                    <Input placeholder="e.g. A" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} required />
                  </div>
                </div>
                <Button type="submit" className="w-full">{editingId ? 'Update' : 'Add'} Teacher</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password — {pwTeacherName}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePasswordChange} className="space-y-5">
                <div>
                  <Label className="mb-2 block">New Password</Label>
                  <div className="relative">
                    <Input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full">Update Password</Button>
              </form>
            </DialogContent>
          </Dialog>

          <div className="overflow-x-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Loading teachers...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2">
                    <TableHead className="pb-3">ID</TableHead>
                    <TableHead className="pb-3">Name</TableHead>
                    <TableHead className="pb-3">Grade</TableHead>
                    <TableHead className="pb-3">Section</TableHead>
                    <TableHead className="pb-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">No teachers yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Click "Add Teacher" to create one</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono">{t.teacherId}</TableCell>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.grade}</TableCell>
                      <TableCell>{t.section}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Change Password" onClick={() => openPasswordDialog(t)}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
