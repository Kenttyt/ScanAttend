import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, Users, Clock, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function Advisories() {
  const [advisories, setAdvisories] = useState([]);
  const [teacherMap, setTeacherMap] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [studentsByAdvisory, setStudentsByAdvisory] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', grade: '', section: '', teacherId: '', schedule: '' });

  // Add Student modal state
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentAdvisoryId, setAddStudentAdvisoryId] = useState(null);
  const [addStudentSearch, setAddStudentSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [advData, usersData, studentsData] = await Promise.all([
        apiClient('/advisories'),
        apiClient('/users'),
        apiClient('/students'),
      ]);
      setAdvisories(advData);
      const teacherList = usersData.filter(u => u.role === 'teacher');
      const tMap = {};
      teacherList.forEach(t => { tMap[t.teacherId] = t.name; });
      setTeacherMap(tMap);
      setTeachers(teacherList);
      setAllStudents(studentsData);
      const grouped = {};
      studentsData.forEach(s => {
        if (!grouped[s.classId]) grouped[s.classId] = [];
        grouped[s.classId].push(s);
      });
      Object.values(grouped).forEach(list => list.sort((a, b) => a.name.localeCompare(b.name)));
      setStudentsByAdvisory(grouped);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const unassignedStudents = useMemo(() => {
    return allStudents.filter(s => !s.classId);
  }, [allStudents]);

  const filteredUnassigned = useMemo(() => {
    if (!addStudentSearch.trim()) return unassignedStudents;
    const q = addStudentSearch.toLowerCase();
    return unassignedStudents.filter(s =>
      s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [unassignedStudents, addStudentSearch]);

  const openAddStudent = (advisoryId) => {
    setAddStudentAdvisoryId(advisoryId);
    setAddStudentSearch('');
    setSelectedStudentIds([]);
    setAddStudentOpen(true);
  };

  const toggleStudent = (id) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedStudentIds.length === filteredUnassigned.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredUnassigned.map(s => s.id));
    }
  };

  const handleAssignStudent = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    setAssigning(true);
    let successCount = 0;
    let failCount = 0;
    try {
      for (const sid of selectedStudentIds) {
        try {
          await apiClient(`/advisories/${addStudentAdvisoryId}/students`, {
            method: 'POST',
            body: JSON.stringify({ studentId: sid }),
          });
          successCount++;
        } catch {
          failCount++;
        }
      }
      if (successCount > 0) {
        toast.success(`${successCount} student${successCount > 1 ? 's' : ''} assigned successfully`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} student${failCount > 1 ? 's' : ''} failed to assign`);
      }
      setAddStudentOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to assign students');
    } finally {
      setAssigning(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', grade: '', section: '', teacherId: '', schedule: '' });
    setDialogOpen(true);
  };

  const openEdit = (advisory) => {
    setEditingId(advisory.id);
    setForm({
      name: advisory.name,
      grade: advisory.grade,
      section: advisory.section,
      teacherId: advisory.teacherId || '',
      schedule: advisory.schedule || '',
    });
    setDialogOpen(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Advisory name is required');
      return;
    }
    if (!form.grade.trim()) {
      toast.error('Grade is required');
      return;
    }
    if (!form.section.trim()) {
      toast.error('Section is required');
      return;
    }
    if (advisories.some(a => a.name === form.name.trim())) {
      toast.error(`Advisory "${form.name.trim()}" already exists`);
      return;
    }
    setSubmitting(true);
    try {
      const payload = { name: form.name.trim(), grade: form.grade.trim(), section: form.section.trim() };
      if (form.teacherId) payload.teacherId = form.teacherId;
      if (form.schedule.trim()) payload.schedule = form.schedule.trim();
      const newAdvisory = await apiClient('/advisories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAdvisories(prev => [...prev, newAdvisory]);
      setForm({ name: '', grade: '', section: '', teacherId: '', schedule: '' });
      setDialogOpen(false);
      toast.success('Advisory created successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Advisory name is required');
      return;
    }
    if (!form.grade.trim()) {
      toast.error('Grade is required');
      return;
    }
    if (!form.section.trim()) {
      toast.error('Section is required');
      return;
    }
    if (advisories.some(a => a.name === form.name.trim() && a.id !== editingId)) {
      toast.error(`Advisory "${form.name.trim()}" already exists`);
      return;
    }
    setSubmitting(true);
    try {
      const payload = { name: form.name.trim(), grade: form.grade.trim(), section: form.section.trim() };
      if (form.teacherId) payload.teacherId = form.teacherId;
      else payload.teacherId = null;
      if (form.schedule.trim()) payload.schedule = form.schedule.trim();
      else payload.schedule = null;
      const updated = await apiClient(`/advisories/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setAdvisories(prev => prev.map(a => a.id === editingId ? updated : a));
      setForm({ name: '', grade: '', section: '', teacherId: '', schedule: '' });
      setEditingId(null);
      setDialogOpen(false);
      toast.success('Advisory updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete class "${name}"?`)) return;
    try {
      await apiClient(`/advisories/${id}`, { method: 'DELETE' });
      setAdvisories(prev => prev.filter(a => a.id !== id));
      setEditingId(null);
      setForm({ name: '', grade: '', section: '', teacherId: '', schedule: '' });
      setDialogOpen(false);
      toast.success('Advisory deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete class');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Advisories</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Advisory</Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingId ? 'Edit Advisory' : 'Add New Advisory'}
                {editingId && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(editingId, form.name)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={editingId ? handleUpdate : handleAdd} className="space-y-5">
              <div>
                <Label className="mb-2 block">Advisory Name</Label>
                <Input
                  placeholder="Auto-filled from teacher"
                  value={form.name}
                  readOnly
                  className="bg-gray-100 cursor-not-allowed"
                  required
                />
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
                <Label className="mb-2 block">Teacher</Label>
                <select
                  value={form.teacherId}
                  onChange={e => {
                    const teacherId = e.target.value;
                    const teacher = teachers.find(t => t.teacherId === teacherId);
                    setForm({
                      ...form,
                      teacherId,
                      name: teacher ? teacher.name : form.name,
                    });
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">No teacher assigned</option>
                  {teachers.map(t => (
                    <option key={t.teacherId} value={t.teacherId}>{t.name} ({t.teacherId})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-2 block">Schedule</Label>
                <Input placeholder="e.g. Mon-Fri 08:00-09:30" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>{editingId ? 'Update' : 'Create'} Advisory</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add Student Modal */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Students to Advisory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID or name..."
                value={addStudentSearch}
                onChange={e => setAddStudentSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {filteredUnassigned.length > 0 && (
              <label className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-accent rounded">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={selectedStudentIds.length === filteredUnassigned.length && filteredUnassigned.length > 0}
                  onChange={toggleAll}
                />
                Select All ({filteredUnassigned.length})
              </label>
            )}
            <div className="max-h-64 overflow-y-auto border rounded-md">
              {filteredUnassigned.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {unassignedStudents.length === 0
                    ? 'No unassigned students available'
                    : 'No students match your search'}
                </p>
              ) : (
                filteredUnassigned.map(s => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent text-sm ${
                      selectedStudentIds.includes(s.id) ? 'bg-accent' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={selectedStudentIds.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                    />
                    <span className="font-mono text-xs text-muted-foreground">{s.id}</span>
                    <span className="flex-1">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.parentPhone}</span>
                  </label>
                ))
              )}
            </div>
            <Button className="w-full" disabled={selectedStudentIds.length === 0 || assigning} onClick={handleAssignStudent}>
              {assigning ? 'Assigning...' : `Assign ${selectedStudentIds.length > 0 ? `${selectedStudentIds.length} ` : ''}Student${selectedStudentIds.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading Advisories...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {advisories.length === 0 && (
            <div className="col-span-full text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No classes yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Add Advisory" to create one</p>
            </div>
          )}
          {advisories.map(a => {
            const students = studentsByAdvisory[a.id] || [];
            return (
              <Card key={a.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {a.name}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Grade:</span>
                    <span>{a.grade}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Section:</span>
                    <span>{a.section}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{teacherMap[a.teacherId] || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{a.schedule || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-medium">{students.length} Student{students.length !== 1 ? 's' : ''}</p>
                    <Button variant="outline" size="sm" onClick={() => openAddStudent(a.id)}>
                      <Plus className="h-3 w-3 mr-1" />Add Student
                    </Button>
                  </div>
                  {students.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="py-1 text-xs">ID</TableHead>
                          <TableHead className="py-1 text-xs">Name</TableHead>
                          <TableHead className="py-1 text-xs">Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map(s => (
                          <TableRow key={s.id}>
                            <TableCell className="py-1 font-mono text-xs">{s.id}</TableCell>
                            <TableCell className="py-1 text-xs">{s.name}</TableCell>
                            <TableCell className="py-1 text-xs">{s.parentPhone}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No students assigned</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
