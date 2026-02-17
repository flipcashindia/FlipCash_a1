// pages/auth/PasswordLogin.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function PasswordLogin() {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const [credentials, setCredentials] = useState({
    phone: '', // Changed from username
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [severeWarning, setSevereWarning] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSevereWarning(''); // Clear previous warnings

    try {
      const response = await authService.passwordLogin(credentials);
      
      setTokens(response.tokens.access, response.tokens.refresh);
      setUser(response.user);
      
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error: any) {
      // Extract the error message
      const errorData = error.response?.data;
      // Django serializers usually return non_field_errors as an array
      const errorMessage = errorData?.non_field_errors?.[0] || errorData?.detail || 'Invalid credentials';
      
      // Check if it's our cyber crime warning
      if (errorMessage.includes('ACCOUNT LOCKED DUE TO SUSPICIOUS ACTIVITY')) {
        setSevereWarning(errorMessage);
        toast.error('Account Locked', { duration: 5000 });
      } else {
        toast.error(errorMessage);
      }
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

        {/* Display Severe Warning prominently if triggered */}
        {severeWarning && (
          <div className="mb-6 p-4 bg-red-50 border border-red-500 rounded-md flex items-start gap-3">
            <AlertTriangle className="text-red-600 shrink-0 w-6 h-6 mt-0.5" />
            <p className="text-sm text-red-800 font-medium leading-relaxed">
              {severeWarning}
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="9876543210"
            value={credentials.phone}
            onChange={(e) => setCredentials({ ...credentials, phone: e.target.value })}
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