import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { useStudentStore } from '@/store/studentStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Users, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export default function AdvisoryList() {
  const { user } = useAuth();
  const students = useStudentStore(s => s.students);
  const fetchStudents = useStudentStore(s => s.fetchStudents);
  const updateStudent = useStudentStore(s => s.updateStudent);

  const [advisoryId, setAdvisoryId] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', parentPhone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        const advData = await apiClient('/advisories');
        const adv = advData.find(a => a.teacherId === user.teacherId);
        setAdvisory(adv || null);
        setAdvisoryId(adv?.id || null);
        if (adv?.id) await fetchStudents(adv.id);
      } catch {}
      setLoading(false);
    };
    loadData();
  }, [user.teacherId, fetchStudents]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const advisoryStudents = students.filter(s => advisoryId && s.classId === advisoryId);
  const filtered = advisoryStudents.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedStudents = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, filtered.length);

  const handleEdit = (student) => {
    setEditingId(student.id);
    setForm({ name: student.name, parentPhone: student.parentPhone || '' });
    setDialogOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.parentPhone || form.parentPhone.length !== 11) {
      toast.error('Parent phone must be exactly 11 digits');
      return;
    }
    setSubmitting(true);
    try {
      await updateStudent(editingId, { name: form.name, parentPhone: form.parentPhone });
      setEditingId(null);
      setForm({ name: '', parentPhone: '' });
      setDialogOpen(false);
      toast.success('Student updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Advisory List</h2>
        <p className="text-muted-foreground">{advisory?.name || 'No advisory assigned'}</p>
      </div>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Student</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-5">
                <div>
                  <Label className="mb-2 block">Name</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <Label className="mb-2 block">Parent Phone</Label>
                  <Input type="tel" inputMode="numeric" maxLength={11} placeholder="Max 11 digits" value={form.parentPhone} onChange={e => setForm({ ...form, parentPhone: e.target.value.replace(/\D/g, '') })} />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>Update Student</Button>
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
                    <TableHead>Parent Phone</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono">{s.id}</TableCell>
                      <TableCell>{s.name}</TableCell>
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
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No students found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {start}-{end} of {filtered.length} student{filtered.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
