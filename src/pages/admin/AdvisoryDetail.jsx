import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Search, Users, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

export default function AdvisoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [advisory, setAdvisory] = useState(null);
  const [teacherName, setTeacherName] = useState('');
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentSearch, setAddStudentSearch] = useState('');
  const [addStudentPage, setAddStudentPage] = useState(1);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const loadData = async () => {
    try {
      const [advData, advisoryStudentsData, allStudentsData, usersData] = await Promise.all([
        apiClient(`/advisories/${id}`),
        apiClient(`/advisories/${id}/students`),
        apiClient('/students'),
        apiClient('/users'),
      ]);
      setAdvisory(advData);
      setStudents(advisoryStudentsData);
      setAllStudents(allStudentsData);
      const teacher = usersData.find(u => u.teacherId === advData.teacherId);
      setTeacherName(teacher?.name || '');
    } catch {
      toast.error('Failed to load advisory');
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

  const addStudentTotalPages = Math.max(1, Math.ceil(filteredUnassigned.length / PAGE_SIZE));
  const paginatedUnassigned = filteredUnassigned.slice((addStudentPage - 1) * PAGE_SIZE, addStudentPage * PAGE_SIZE);
  const addStudentStart = filteredUnassigned.length === 0 ? 0 : (addStudentPage - 1) * PAGE_SIZE + 1;
  const addStudentEnd = Math.min(addStudentPage * PAGE_SIZE, filteredUnassigned.length);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    );
  }, [students, search]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const paginatedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const start = filteredStudents.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, filteredStudents.length);

  const openAddStudent = () => {
    setAddStudentSearch('');
    setAddStudentPage(1);
    setSelectedStudentIds([]);
    setAddStudentOpen(true);
  };

  useEffect(() => {
    setAddStudentPage(1);
  }, [addStudentSearch]);

  const toggleStudent = (sid) => {
    setSelectedStudentIds(prev =>
      prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]
    );
  };

  const toggleAll = () => {
    if (selectedStudentIds.length === filteredUnassigned.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredUnassigned.map(s => s.id));
    }
  };

  const handleAssignStudents = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    setAssigning(true);
    let successCount = 0;
    let failCount = 0;
    for (const sid of selectedStudentIds) {
      try {
        await apiClient(`/advisories/${id}/students`, {
          method: 'POST',
          body: JSON.stringify({ studentId: sid }),
        });
        successCount++;
      } catch {
        failCount++;
      }
    }
    if (successCount > 0) {
      toast.success(`${successCount} student${successCount > 1 ? 's' : ''} added`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} student${failCount > 1 ? 's' : ''} failed to add`);
    }
    setAddStudentOpen(false);
    loadData();
    setAssigning(false);
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    if (!confirm(`Remove "${studentName}" from this advisory?`)) return;
    try {
      await apiClient(`/advisories/${id}/students/${studentId}`, { method: 'DELETE' });
      toast.success(`${studentName} removed`);
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove student');
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>;
  }

  if (!advisory) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Advisory not found</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/advisories')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{advisory.name}</h2>
          <p className="text-sm text-muted-foreground">
            {teacherName || 'No teacher'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 sm:w-48" />
            </div>
            <Button onClick={openAddStudent}><Plus className="h-4 w-4 mr-1" />Add Student</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="h-10 px-2 text-left text-sm font-medium text-muted-foreground bg-background">ID</th>
                  <th className="h-10 px-2 text-left text-sm font-medium text-muted-foreground bg-background">Name</th>
                  <th className="h-10 px-2 text-left text-sm font-medium text-muted-foreground bg-background">Phone</th>
                  <th className="h-10 px-2 text-right text-sm font-medium text-muted-foreground bg-background">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">
                        {students.length === 0 ? 'No students in this advisory' : 'No results found'}
                      </p>
                      {students.length === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">Click "Add Student" to assign one</p>
                      )}
                    </td>
                  </tr>
                )}
                {paginatedStudents.map(s => (
                  <tr key={s.id} className="border-t">
                    <td className="p-2 font-mono text-sm">{s.id}</td>
                    <td className="p-2 text-sm">{s.name}</td>
                    <td className="p-2 text-sm">{s.parentPhone}</td>
                    <td className="p-2 text-right">
                      <Button variant="ghost" size="icon" title="Remove" onClick={() => handleRemoveStudent(s.id, s.name)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {start}-{end} of {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
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

      {/* Add Student Modal */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent style={{ overflow: 'visible', maxHeight: 'none' }} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Student to Advisory</DialogTitle>
          </DialogHeader>
          {unassignedStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              All students are already assigned to an advisory. Add new students from the Students page first.
            </p>
          ) : (
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
              <div className="border rounded-md">
                {filteredUnassigned.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No students match your search
                  </p>
                ) : (
                  paginatedUnassigned.map(s => (
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
                      <span className="flex-1">— {s.name}</span>
                    </label>
                  ))
                )}
              </div>
              {filteredUnassigned.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {addStudentStart}-{addStudentEnd} of {filteredUnassigned.length} student{filteredUnassigned.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={addStudentPage <= 1} onClick={() => setAddStudentPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">{addStudentPage} / {addStudentTotalPages}</span>
                    <Button variant="outline" size="sm" disabled={addStudentPage >= addStudentTotalPages} onClick={() => setAddStudentPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setAddStudentOpen(false)}>Cancel</Button>
                <Button disabled={selectedStudentIds.length === 0 || assigning} onClick={handleAssignStudents}>
                  {assigning ? 'Adding...' : `Add ${selectedStudentIds.length > 0 ? `${selectedStudentIds.length} ` : ''}Student${selectedStudentIds.length !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
