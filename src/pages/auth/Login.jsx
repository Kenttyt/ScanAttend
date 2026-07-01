import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';

const ROLE_DEFAULTS = {
  admin: '/admin/students',
  teacher: '/teacher/attendance',
};

const QUICK_LOGIN = [
  { id: 'admin@school.com', password: 'admin123', label: 'Admin' },
  { id: 'T001', password: 'teacher123', label: 'Teacher' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(loginId, password);
    if (result.error) {
      setError(result.error);
    } else {
      navigate(ROLE_DEFAULTS[result.user.role]);
    }
  };

  const quickLogin = (q) => {
    setLoginId(q.id);
    setPassword(q.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">ScanAttend</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="loginId" className="mb-2 block">Teacher ID / Admin Email</Label>
              <Input
                id="loginId"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter Teacher ID or Admin Email"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="mb-2 block">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center mb-3">Quick Demo Login</p>
            <div className="flex gap-2">
              {QUICK_LOGIN.map(q => (
                <Button key={q.label} variant="outline" size="sm" className="flex-1" onClick={() => quickLogin(q)}>
                  {q.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
