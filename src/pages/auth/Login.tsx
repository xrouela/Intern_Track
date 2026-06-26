import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, AlertCircle, Mail, Key, Eye, EyeOff, X, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await loginUser(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      console.error('Error signing in:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_rgba(79,70,229,0.15),_transparent_45%)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/70 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 text-center text-slate-100"
      >
        {/* Brand Logo */}
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl shadow-inner hover:scale-105 hover:rotate-3 transition-all duration-300">
          <img src="/logo.png" alt="NexTrack Logo" className="w-4/5 h-4/5 object-contain drop-shadow-md rounded-xl" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-1 tracking-tight">Welcome to NexTrack</h1>
        <p className="text-slate-400 text-sm mb-8 font-medium">Monitor your internship progress</p>

        {/* Alert Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-sm overflow-hidden text-left"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email input */}
          <div className="relative text-left">
            <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail size={18} />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="block w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-slate-950 sm:text-sm shadow-inner transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="relative text-left">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Key size={18} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="block w-full pl-11 pr-12 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-slate-950 sm:text-sm shadow-inner transition-all duration-200"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center text-left">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-slate-950/60 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-offset-2"
            />
            <label htmlFor="remember" className="ml-2 block text-xs text-slate-400 hover:text-slate-300 cursor-pointer font-medium select-none">
              Keep me signed in
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className={`w-full flex items-center justify-center gap-2.5 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-900/30 ${
              loading || !email.trim() || !password.trim()
                ? 'opacity-65 cursor-not-allowed'
                : 'hover:bg-indigo-500 hover:translate-y-[-1px] hover:shadow-indigo-900/50 active:translate-y-[1px]'
            }`}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin text-white" />
            ) : (
              <LogIn size={18} />
            )}
            <span>{loading ? 'Verifying...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-xs text-slate-500 leading-relaxed">
            For administrative access, please sign in with your authorized IT account.
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 text-center text-slate-100 z-10"
            >
              <button
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
              <div className="w-14 h-14 bg-indigo-950/50 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                <HelpCircle size={26} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Password Recovery</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                For security reasons, password recovery is managed by the system administrator. 
                Please contact the IT Management office or email your department supervisor to reset your password.
              </p>
              <button
                onClick={() => setShowForgotModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl border border-white/5 hover:border-white/15 transition-all text-sm"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
