import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LogIn, 
  Loader2, 
  AlertCircle, 
  Mail, 
  Key, 
  Eye, 
  EyeOff, 
  X, 
  HelpCircle, 
  Zap, 
  Shield, 
  BarChart3, 
  Smartphone, 
  FileText, 
  Target, 
  Check, 
  Sparkles,
  Award
} from 'lucide-react';
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

  const loginSectionRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [highlightCard, setHighlightCard] = useState(false);

  const scrollToLogin = () => {
    loginSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Focus email input and trigger slight highlight glow after arriving (650ms delay)
    setTimeout(() => {
      setHighlightCard(true);
      emailInputRef.current?.focus();
      
      setTimeout(() => {
        setHighlightCard(false);
      }, 1500);
    }, 700);
  };

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

  const stats = [
    { label: 'Real-Time Monitoring', desc: 'Track intern activities instantly' },
    { label: 'Attendance Analytics', desc: 'Detailed reporting & logs' },
    { label: 'Internship Progress', desc: 'Step-by-step milestone check' },
    { label: 'Performance Dashboard', desc: 'Visual analytical view' }
  ];

  const features = [
    { icon: <Zap className="text-amber-400 w-6 h-6" />, title: 'Fast Performance', desc: 'Manage internship records instantly.' },
    { icon: <Shield className="text-emerald-400 w-6 h-6" />, title: 'Secure Access', desc: 'Protected and role-based authentication.' },
    { icon: <BarChart3 className="text-indigo-400 w-6 h-6" />, title: 'Smart Analytics', desc: 'Track performance in real time.' },
    { icon: <Smartphone className="text-sky-400 w-6 h-6" />, title: 'Responsive Experience', desc: 'Desktop and mobile optimized.' },
    { icon: <FileText className="text-pink-400 w-6 h-6" />, title: 'Automated Reports', desc: 'Generate reports automatically.' },
    { icon: <Target className="text-rose-400 w-6 h-6" />, title: 'Better Monitoring', desc: 'Monitor intern growth efficiently.' }
  ];

  const journeyItems = [
    {
      img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
      title: 'Team Collaboration',
      subtitle: 'Interns working on real-world projects together.'
    },
    {
      img: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
      title: 'Tech Events & Seminars',
      subtitle: 'Engaging workshops and professional learning sessions.'
    },
    {
      img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      title: 'Hands-on Training',
      subtitle: 'Mentorship and technical skills development.'
    },
    {
      img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
      title: 'Award Moments',
      subtitle: 'Recognizing excellence and achievements.'
    },
    {
      img: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80',
      title: 'Internship Highlights',
      subtitle: 'Building paths for future IT leaders.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#01061B] text-slate-100 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* SECTION 1: LANDING HERO + AUTHENTICATION SPLIT */}
      <div ref={loginSectionRef} className="relative min-h-screen flex flex-col md:flex-row items-stretch justify-between">
        
        {/* LEFT SIDE: BRANDING / HERO SECTION */}
        <div className="relative flex-1 flex flex-col justify-between p-8 md:p-16 lg:p-24 overflow-hidden bg-gradient-to-b from-[#01061B] via-[#020B24] to-[#081535]">
          
          {/* Background soft glow effects & digital particles */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
            
            {/* Digital abstract particle/circles */}
            <div className="absolute top-[15%] right-[20%] w-3 h-3 rounded-full bg-indigo-500/35 animate-bounce [animation-duration:6s]" />
            <div className="absolute bottom-[30%] left-[15%] w-2 h-2 rounded-full bg-purple-500/35 animate-bounce [animation-duration:8s]" />
            <div className="absolute top-[60%] left-[25%] w-4 h-4 rounded-full bg-indigo-400/20 animate-ping [animation-duration:4s]" />
          </div>

          {/* Logo & Header */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl shadow-inner hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="NexTrack Logo" className="w-4/5 h-4/5 object-contain" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">NEXTrack</span>
          </div>

          {/* Center Content */}
          <div className="relative z-10 my-auto py-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200 tracking-tight leading-none mb-3">
                NexTrack
              </h1>
              <p className="text-lg lg:text-2xl font-semibold text-indigo-400 mb-4 tracking-wide uppercase">
                Next Generation IT Professional
              </p>
              <p className="text-slate-400 text-base lg:text-lg max-w-md mb-12">
                Monitor your internship progress. Centralized tracking, beautiful statistics, and performance management.
              </p>
            </motion.div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.03 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx, duration: 0.5 }}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    <h3 className="font-bold text-white text-sm">{stat.label}</h3>
                  </div>
                  <p className="text-slate-400 text-xs">{stat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer branding */}
          <div className="relative z-10 text-xs text-slate-500">
            Next Generation IT Professional • Platform v2.0
          </div>
        </div>

        {/* RIGHT SIDE: LOGIN UI */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-[#020718] border-l border-white/5 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.05),_transparent_60%)] pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: highlightCard 
                ? '0 0 35px rgba(99, 102, 241, 0.7)' 
                : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            transition={{ duration: 0.6 }}
            className={`w-full max-w-[480px] bg-slate-900/40 border backdrop-blur-xl rounded-[28px] shadow-2xl p-8 lg:p-10 relative overflow-hidden group transition-all duration-500 ${
              highlightCard ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-[1.01]' : 'border-white/10 hover:border-indigo-500/25'
            }`}
          >
            {/* Border glow effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-purple-500/0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight text-center">Welcome Back</h2>
              <p className="text-slate-400 text-sm mb-8 text-center">Sign in to continue your internship journey.</p>

              {/* Alert Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-300 text-sm overflow-hidden text-left"
                  >
                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                    <p>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-6">
                
                {/* Email input */}
                <div className="relative text-left">
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                      <Mail size={18} />
                    </div>
                    <input
                      ref={emailInputRef}
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="block w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-slate-950 shadow-inner transition-all duration-300"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password input */}
                <div className="relative text-left">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                      <Key size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="block w-full pl-12 pr-12 py-3.5 bg-slate-950/50 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-slate-950 shadow-inner transition-all duration-300"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
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
                    className="h-4.5 w-4.5 rounded-lg border-white/10 bg-slate-950/60 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 focus:ring-offset-2"
                  />
                  <label htmlFor="remember" className="ml-2.5 block text-xs text-slate-400 hover:text-slate-300 cursor-pointer font-medium select-none">
                    Keep me signed in
                  </label>
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim()}
                  whileHover={(!loading && email.trim() && password.trim()) ? { scale: 1.02, boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' } : {}}
                  whileTap={(!loading && email.trim() && password.trim()) ? { scale: 0.98 } : {}}
                  className={`w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-indigo-900/30 ${
                    loading || !email.trim() || !password.trim()
                      ? 'opacity-65 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin text-white" />
                  ) : (
                    <LogIn size={18} />
                  )}
                  <span>{loading ? 'Verifying...' : 'Sign In'}</span>
                </motion.button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Administrative access only. Authorized credentials required.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* SECTION 2: WHY CHOOSE NEXTRACK? */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#010515] relative overflow-hidden border-t border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto text-center relative z-10 mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Why Choose NexTrack?
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto">
            Designed to simplify intern management. A comprehensive system tailored for organizations and interns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto relative z-10">
          {features.map((feat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -6, scale: 1.02 }}
              className="p-6 rounded-[24px] bg-slate-900/30 border border-white/5 hover:border-indigo-500/35 hover:bg-slate-900/50 backdrop-blur-md transition-all duration-300 group"
            >
              {/* Outer Glow Effect on hover */}
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all duration-300">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 3: ACHIEVEMENT GALLERY */}
      <section className="py-24 bg-[#020718] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Our Journey
          </h2>
          <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto">
            Building future IT professionals. Take a look at some of our training programs, events, and highlights.
          </p>
        </div>

        {/* Masonry / Grid Gallery */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[280px]">
          {journeyItems.map((item, idx) => {
            // Give specific elements larger grid spans to mock a masonry look
            let spanClass = "col-span-1 row-span-1";
            if (idx === 0) spanClass = "col-span-1 sm:col-span-2 row-span-1";
            if (idx === 3) spanClass = "col-span-1 lg:col-span-2 row-span-1";

            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.015 }}
                className={`relative overflow-hidden rounded-[24px] border border-white/5 group ${spanClass}`}
              >
                {/* Image */}
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-90 group-hover:brightness-75"
                />
                
                {/* Dark overlay & caption */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-60 group-hover:opacity-85 transition-opacity duration-300" />
                
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-950/60 border border-white/5 backdrop-blur-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Award size={14} className="text-indigo-400" />
                    {item.title}
                  </h4>
                  <p className="text-slate-300 text-xs mt-1 font-medium">{item.subtitle}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4: ABOUT NEXTRACK */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-gradient-to-b from-[#020718] to-[#01061B] relative overflow-hidden border-t border-white/5">
        <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          {/* Left Feature List */}
          <div className="flex-1 text-left">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
              About NexTrack
            </h2>
            <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed">
              NexTrack is a modern designed intern tracking system that helps organizations manage internship performance in real time and efficiently handle multiple interns through a centralized platform.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {[
                { title: 'Real-time attendance tracking', desc: 'Track attendance instantly.' },
                { title: 'Application Tracking', desc: 'Never lose track of your intern.' },
                { title: 'Progress Analytics', desc: 'Visual presentation of internship journey with detailed analytics.' },
                { title: 'DTR Generator', desc: 'Generate daily time records automatically.' },
                { title: 'Task Management', desc: 'Assign and monitor intern tasks.' },
                { title: 'Export to PDF & Excel', desc: 'Export reports instantly.' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} className="text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-slate-400 text-xs mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              onClick={scrollToLogin}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-2xl shadow-lg shadow-indigo-900/40 hover:shadow-indigo-900/60 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Get Started with NexTrack</span>
              <Sparkles size={16} className="text-indigo-200" />
            </motion.button>
          </div>

          {/* Right Logo Presentation */}
          <div className="flex-1 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.1),_transparent_50%)] animate-pulse pointer-events-none" />
            <motion.div
              animate={{ 
                y: [0, -12, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-64 h-64 md:w-80 md:h-80 bg-slate-900/50 border border-white/10 backdrop-blur-xl rounded-[40px] shadow-2xl flex items-center justify-center p-12 group hover:border-indigo-500/20 transition-colors duration-500"
            >
              <img src="/logo.png" alt="Large NexTrack Logo" className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(99,102,241,0.25)] group-hover:scale-105 transition-transform duration-500" />
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-6xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© NexTrack 2026. All rights reserved.</p>
          <p className="font-semibold text-slate-400">Next Generation IT Professional</p>
        </div>
      </section>

      {/* Forgot Password Modal (Preserved exactly as requested) */}
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
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 text-center text-slate-100 z-10"
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
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl border border-white/5 hover:border-white/15 transition-all text-sm cursor-pointer"
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
