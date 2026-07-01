import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { useStudentStore } from '@/store/studentStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvisoryList() {
  const { user } = useAuth();
  const students = useStudentStore(s => s.students);
  const fetchStudents = useStudentStore(s => s.fetchStudents);
  const addStudent = useStudentStore(s => s.addStudent);
  const removeStudent = useStudentStore(s => s.removeStudent);
  const updateStudent = useStudentStore(s => s.updateStudent);

  const advisoryLabel = `Grade ${user.grade} - Section ${user.section}`;
  const [advisoryId, setAdvisoryId] = useState(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ studentId: '', name: '', parentPhone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const advData = await apiClient('/advisories');
        const adv = advData.find(a => a.name === advisoryLabel);
        setAdvisoryId(adv?.id || null);
        if (adv?.id) await fetchStudents(adv.id);
      } catch {}
      setLoading(false);
    };
    loadData();
  }, [advisoryLabel, fetchStudents]);

  const advisoryStudents = students.filter(s => advisoryId && s.classId === advisoryId);
  const filtered = advisoryStudents.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!advisoryId) {
      toast.error('No class found for your assignment');
      return;
    }
    if (!form.studentId) {
      toast.error('Student ID is required');
      return;
    }
    if (students.some(s => s.id === form.studentId)) {
      toast.error(`Student ID "${form.studentId}" already exists`);
      return;
    }
    setSubmitting(true);
    try {
      await addStudent({ id: form.studentId, name: form.name, parentPhone: form.parentPhone, grade: user.grade, section: user.section, classId: advisoryId });
      setForm({ studentId: '', name: '', parentPhone: '' });
      setDialogOpen(false);
      toast.success('Student added successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    setForm({ studentId: student.id, name: student.name, parentPhone: student.parentPhone || '' });
    setDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateStudent(editingId, { name: form.name, parentPhone: form.parentPhone });
      setEditingId(null);
      setForm({ studentId: '', name: '', parentPhone: '' });
      setDialogOpen(false);
      toast.success('Student updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this student?')) {
      setSubmitting(true);
      try {
        await removeStudent(id);
        setEditingId(null);
        setForm({ studentId: '', name: '', parentPhone: '' });
        setDialogOpen(false);
        toast.success('Student removed');
      } catch (err) {
        toast.error(err.message || 'Failed to remove student');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ studentId: '', name: '', parentPhone: '' });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Advisory List</h2>
        <p className="text-muted-foreground">{advisoryLabel}</p>
      </div>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Add Student</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <DialogTitle>{editingId ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                  {editingId && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(editingId)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </DialogHeader>
              <form onSubmit={editingId ? handleUpdate : handleAdd} className="space-y-5">
                <div>
                  <Label className="mb-2 block">Student ID</Label>
                  <Input type="number" inputMode="numeric" placeholder="e.g. 001" value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value.replace(/\D/g, '') })} required disabled={!!editingId} />
                </div>
                <div>
                  <Label className="mb-2 block">Name</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <Label className="mb-2 block">Parent Phone</Label>
                  <Input type="tel" inputMode="numeric" maxLength={11} placeholder="Max 11 digits" value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value.replace(/\D/g, '') })} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>{editingId ? 'Update' : 'Add'} Student</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
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
                    <TableHead>Parent Phone</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono">{s.id}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.grade}</TableCell>
                      <TableCell>{s.section}</TableCell>
                      <TableCell>{s.parentPhone}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">No students found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
