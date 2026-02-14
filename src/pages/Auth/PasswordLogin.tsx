// pages/auth/PasswordLogin.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function PasswordLogin() {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.passwordLogin(credentials);
      
      setTokens(response.access, response.refresh);
      setUser(response.user);
      
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-dark" />
          </div>
          <h1 className="text-3xl font-bold text-dark">Admin Login</h1>
          <p className="text-gray-600 mt-2">Sign in with your credentials</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="Username"
            type="text"
            placeholder="admin"
            value={credentials.username}
            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            required
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
          >
            Sign In
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="text-secondary hover:text-secondary-dark text-sm"
            >
              Login with OTP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}