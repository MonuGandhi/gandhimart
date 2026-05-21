import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);
  const login = useAdminStore((state) => state.login);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  
  const isAuthorizedAdmin = isLoggedIn && (user?.role === 'admin' || user?.role === 'pro_admin');

  if (!isAuthorizedAdmin) {
    return <Navigate to="/profile" replace />;
  }
  
  const handleLogin = async (e) => {
    e.preventDefault();
    const loginToast = toast.loading('Verifying credentials...');
    try {
      const success = await login(username, password);
      if (success) {
        toast.success(username === 'monugandhi5911' ? 'Welcome back, Super Admin!' : 'Welcome back, Admin!', { id: loginToast });
        navigate('/admin/dashboard');
      } else {
        setShake(true);
        toast.error('Invalid username or password', { id: loginToast });
        setTimeout(() => setShake(false), 500);
      }
    } catch (error) {
      console.error(error);
      toast.error('Login failed. Please try again.', { id: loginToast });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-[#1CA672] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#1CA672]/30">
          <Lock size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Admin Portal</h1>
        <p className="text-gray-500 mt-2">Sign in to manage G Mart</p>
      </div>

      <div className={`w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 ${shake ? 'animate-shake' : ''}`}>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1CA672] focus:bg-white transition-all"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1CA672] focus:bg-white transition-all"
              placeholder="Enter password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#1CA672] hover:bg-[#158F5F] text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-[#1CA672]/20"
          >
            Login to Dashboard
          </button>
        </form>
      </div>
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
}
