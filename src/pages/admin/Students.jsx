import { useState, useEffect } from 'react';
import { useStudentStore } from '@/store/studentStore';
import { apiClient } from '@/lib/apiClient';
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
  const [advisories, setAdvisories] = useState([]);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', grade: '', section: '', classId: '', parentPhone: '' });

  useEffect(() => {
    fetchStudents();
    apiClient('/advisories').then(setAdvisories).catch(() => {});
  }, [fetchStudents]);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.parentPhone || form.parentPhone.length < 5) {
      toast.error('Parent phone is required (at least 5 digits)');
      return;
    }
    // Generate ID that avoids conflicts with existing students
    const existingIds = students.map(s => parseInt(s.id, 10)).filter(n => !isNaN(n));
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const nextId = String(maxId + 1).padStart(3, '0');
    if (students.some(s => s.id === nextId)) {
      toast.error(`Student ID "${nextId}" already exists`);
      return;
    }
    const payload = { ...form, id: nextId };
    if (!payload.classId) delete payload.classId;
    setSubmitting(true);
    try {
      await addStudent(payload);
      setForm({ name: '', grade: '', section: '', classId: '', parentPhone: '' });
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
    if (!form.parentPhone || form.parentPhone.length < 5) {
      toast.error('Parent phone is required (at least 5 digits)');
      return;
    }
    setSubmitting(true);
    try {
      const { classId, ...rest } = form;
      const updates = { ...rest };
      if (classId) updates.classId = classId;
      else updates.classId = null;
      await updateStudent(editingId, updates);
      setForm({ name: '', grade: '', section: '', classId: '', parentPhone: '' });
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
      setForm({ name: '', grade: '', section: '', classId: '', parentPhone: '' });
      setEditingId(null);
      setDialogOpen(false);
      toast.success('Student deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete student');
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', grade: '', section: '', classId: '', parentPhone: '' });
    setDialogOpen(true);
  };

  const openEdit = (student) => {
    setEditingId(student.id);
    setForm({
      name: student.name || '',
      grade: student.grade || '',
      section: student.section || '',
      classId: student.classId || '',
      parentPhone: student.parentPhone || '',
    });
    setDialogOpen(true);
  };

  const advisoryMap = Object.fromEntries(advisories.map(a => [a.id, a.name]));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Students</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Add Student</Button>
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
                  <Label className="mb-2 block">Name</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Grade</Label>
                    <Input placeholder="e.g. 10" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="mb-2 block">Section</Label>
                    <Input placeholder="e.g. A" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Advisory</Label>
                  <select
                    value={form.classId}
                    onChange={e => setForm({ ...form, classId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">No class</option>
                    {advisories.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="mb-2 block">Parent Phone</Label>
                  <Input type="tel" inputMode="numeric" maxLength={11} placeholder="Max 11 digits" value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value.replace(/\D/g, '') })} required />
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Advisory</TableHead>
                    <TableHead>Parent Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">No students yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Click "Add Student" to create one</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {filtered.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono">{s.id}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.grade}</TableCell>
                      <TableCell>{s.section}</TableCell>
                      <TableCell>{advisoryMap[s.classId] || '—'}</TableCell>
                      <TableCell>{s.parentPhone}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
