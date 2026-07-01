import { AuthProvider } from '@/context/AuthContext';
import AppRouter from '@/router/AppRouter';
import { Toaster } from 'sonner';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;
