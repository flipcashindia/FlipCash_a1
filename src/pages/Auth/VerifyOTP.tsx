// pages/auth/VerifyOTP.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setTokens } = useAuthStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const phone = location.state?.phone || '';

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.verifyOTP({ 
        phone, 
        code,
        device_id: 'admin-web-' + Date.now()
      });
      
      setTokens(response.tokens.access, response.tokens.refresh);
      setUser(response.user);
      
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-dark" />
          </div>
          <h1 className="text-3xl font-bold text-dark">Verify OTP</h1>
          <p className="text-gray-600 mt-2">
            Enter the OTP sent to {phone}
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <Input
            label="OTP Code"
            type="text"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            required
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
          >
            Verify OTP
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="text-secondary hover:text-secondary-dark text-sm"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}