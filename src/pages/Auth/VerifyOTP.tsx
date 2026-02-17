// pages/auth/VerifyOTP.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
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
  const [severeWarning, setSevereWarning] = useState('');

  const phone = location.state?.phone || '';

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSevereWarning(''); // Clear previous warnings

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
      // Improved error extraction to catch Django/DRF standard formats
      const errorData = error.response?.data;
      const errorMessage = 
        errorData?.error || 
        errorData?.non_field_errors?.[0] || 
        errorData?.detail || 
        errorData?.message || 
        'Invalid OTP';
      
      // Check if it's our cyber crime warning or access denied
      if (errorMessage.includes('ACCOUNT LOCKED') || errorMessage.includes('SUSPICIOUS ACTIVITY')) {
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
            <ShieldCheck className="w-10 h-10 text-dark" />
          </div>
          <h1 className="text-3xl font-bold text-dark">Verify OTP</h1>
          <p className="text-gray-600 mt-2">
            Enter the OTP sent to {phone}
          </p>
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