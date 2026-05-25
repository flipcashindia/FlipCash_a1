// pages/auth/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { Button } from '../../components/UI/Button';
import { Input } from '../../components/UI/Input';
import { authService } from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.sendOTP({ 
        phone, 
        purpose: 'login' 
      });
      toast.success('OTP sent successfully');
      navigate('/auth/verify-otp', { state: { phone } });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-10 h-10 text-dark" />
          </div>
          <h1 className="text-3xl font-bold text-dark">FlipCash Admin</h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </div>

        <form onSubmit={handleSendOTP} className="space-y-6">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
          >
            Send OTP
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/auth/password-login')}
              className="text-secondary hover:text-secondary-dark text-sm"
            >
              Login with Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}