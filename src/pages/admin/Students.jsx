import { useState, useEffect } from 'react';
import { useStudentStore } from '@/store/studentStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Students() {
  const { students, loading, fetchStudents, addStudent, updateStudent, removeStudent } = useStudentStore();
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ id: '', name: '', parentPhone: '' });

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.advisory?.grade || '').toLowerCase().includes(q) ||
      (s.advisory?.section || '').toLowerCase().includes(q) ||
      (s.advisory?.name || '').toLowerCase().includes(q)
    );
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.id || !form.id.trim()) {
      toast.error('Student ID is required');
      return;
    }
    if (!form.parentPhone || form.parentPhone.length !== 11) {
      toast.error('Parent phone must be exactly 11 digits');
      return;
    }
    if (students.some(s => s.id === form.id.trim())) {
      toast.error(`Student ID "${form.id}" already exists`);
      return;
    }
    const payload = { id: form.id.trim(), name: form.name.trim(), parentPhone: form.parentPhone };
    setSubmitting(true);
    try {
      await addStudent(payload);
      setForm({ id: '', name: '', parentPhone: '' });
      setDialogOpen(false);
      toast.success('Student added successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!form.parentPhone || form.parentPhone.length !== 11) {
      toast.error('Parent phone must be exactly 11 digits');
      return;
    }
    setSubmitting(true);
    try {
      const updates = { name: form.name.trim(), parentPhone: form.parentPhone };
      await updateStudent(editingId, updates);
      setForm({ id: '', name: '', parentPhone: '' });
      setDialogOpen(false);
      setEditingId(null);
      toast.success('Student updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete student "${name}"?`)) return;
    try {
      await removeStudent(id);
      setForm({ id: '', name: '', parentPhone: '' });
      setEditingId(null);
      setDialogOpen(false);
      toast.success('Student deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete student');
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ id: '', name: '', parentPhone: '' });
    setDialogOpen(true);
  };

  const openEdit = (student) => {
    setEditingId(student.id);
    setForm({
      id: student.id || '',
      name: student.name || '',
      parentPhone: student.parentPhone || '',
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Students</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Student</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {editingId ? 'Edit Student' : 'Add New Student'}
                  {editingId && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(editingId, form.name)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={editingId ? handleEdit : handleAdd} className="space-y-5">
                <div>
                  <Label className="mb-2 block">Student ID</Label>
                  <Input inputMode="numeric" placeholder="Numbers only" value={form.id} onChange={e => setForm({ ...form, id: e.target.value.replace(/\D/g, '') })} disabled={!!editingId} required />
                  {editingId && <p className="text-xs text-muted-foreground mt-1">ID cannot be changed after creation</p>}
                </div>
                <div>
                  <Label className="mb-2 block">Name</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value.replace(/[0-9]/g, '') })} required />
                </div>
                <div>
                  <Label className="mb-2 block">Parent Phone</Label>
                  <Input type="tel" inputMode="numeric" maxLength={11} placeholder="Exactly 11 digits" value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value.replace(/\D/g, '').slice(0, 11) })} required />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>{editingId ? 'Update' : 'Add'} Student</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading students...</p>
          ) : (
            <div className="overflow-auto max-h-[500px]">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-background z-10">
                  <tr>
                    <th className="h-10 px-2 text-left text-sm font-medium text-muted-foreground bg-background">ID</th>
                    <th className="h-10 px-2 text-left text-sm font-medium text-muted-foreground bg-background">Name</th>
                    <th className="h-10 px-2 text-left text-sm font-medium text-muted-foreground bg-background">Grade</th>
                    <th className="h-10 px-2 text-left text-sm font-medium text-muted-foreground bg-background">Section</th>
                    <th className="h-10 px-2 text-left text-sm font-medium text-muted-foreground bg-background">Advisory</th>
                    <th className="h-10 px-2 text-left text-sm font-medium text-muted-foreground bg-background">Parent Phone</th>
                    <th className="h-10 px-2 text-right text-sm font-medium text-muted-foreground bg-background">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">No students yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Click "Add Student" to create one</p>
                      </td>
                    </tr>
                  )}
                  {filtered.map(s => (
                    <tr key={s.id} className="border-t">
                      <td className="p-2 font-mono text-sm">{s.id}</td>
                      <td className="p-2 text-sm">{s.name}</td>
                      <td className="p-2 text-sm">{s.advisory?.grade || '—'}</td>
                      <td className="p-2 text-sm">{s.advisory?.section || '—'}</td>
                      <td className="p-2 text-sm">{s.advisory?.name || '—'}</td>
                      <td className="p-2 text-sm">{s.parentPhone}</td>
                      <td className="p-2 text-right">
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
