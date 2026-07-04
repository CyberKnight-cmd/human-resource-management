import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ShaderBackground from '../../components/background/ShaderBackground';
import FloatingGlassBlob from '../../components/background/FloatingGlassBlob';
import NoiseOverlay from '../../components/common/NoiseOverlay';

export default function AuthPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('employee'); // 'employee' | 'hr'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [strength, setStrength] = useState({ text: 'Too short', width: '0%', colorClass: 'bg-error' });

  const magneticBtnRef = useRef(null);

  const updateStrength = (val) => {
    if (val.length === 0) {
      setStrength({ text: 'Too short', width: '0%', colorClass: 'bg-error' });
    } else if (val.length < 6) {
      setStrength({ text: 'Weak', width: '25%', colorClass: 'bg-error' });
    } else if (val.length < 10) {
      setStrength({ text: 'Medium', width: '60%', colorClass: 'bg-tertiary-container' });
    } else {
      setStrength({ text: 'Strong Precision', width: '100%', colorClass: 'bg-primary' });
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    updateStrength(val);
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    setShowSuccess(true);
  };

  const proceedToDashboard = () => {
    if (role === 'hr') {
      navigate('/admin');
    } else {
      navigate('/employee');
    }
  };

  useEffect(() => {
    const btn = magneticBtnRef.current;
    if (!btn) return;

    const handleMouseMove = (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    };

    const handleMouseLeave = () => {
      btn.style.transform = `translate(0, 0)`;
    };

    btn.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [showSuccess]);

  return (
    <div className="font-body-md text-body-md antialiased text-on-surface">
      <NoiseOverlay />
      
      <main className="flex min-h-screen w-full relative overflow-hidden">
        {/* Left Section: Auth Form */}
        <section className="relative w-full lg:w-2/5 flex flex-col justify-center items-center p-8 lg:p-16 z-10 bg-background/40">
          
          {/* Brand Logo */}
          <div className="absolute top-10 left-10 flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(104,218,185,0.4)]">
              <span className="material-symbols-outlined text-on-primary font-bold">blur_on</span>
            </div>
            <span className="font-headline-md text-headline-md font-bold text-primary tracking-tighter">Aether HR</span>
          </div>

          {/* Auth Container */}
          <div className="glass-card w-full max-w-md p-10 rounded-2xl relative overflow-hidden group" id="auth-container">
            
            {/* Email Verification State / Magic Link Screen */}
            <div className={`absolute inset-0 bg-surface-container/95 flex flex-col items-center justify-center p-10 text-center transition-all duration-700 ${
              showSuccess ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
            }`}>
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  mark_email_read
                </span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mb-2">Check your inbox</h2>
              <p className="text-on-surface-variant font-body-md mb-8">
                We've sent a magic link to <span className="text-on-surface font-bold">{email || 'admin@aethercorp.com'}</span>. Click the link to securely log in.
              </p>
              
              <button 
                onClick={proceedToDashboard} 
                className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 mb-4 hover:shadow-[0_0_30px_rgba(104,218,185,0.3)] transition-all cursor-pointer border-none"
              >
                PROCEED TO DASHBOARD
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>

              <button 
                className="text-primary font-label-sm uppercase hover:underline bg-transparent border-none cursor-pointer" 
                onClick={() => setShowSuccess(false)}
              >
                Back to sign in
              </button>
            </div>

            {/* Form Content */}
            <div className={`transition-all duration-500 ${showSuccess ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
              <div className="mb-10">
                <h1 className="font-headline-lg text-headline-lg mb-2 text-on-surface">Welcome Back</h1>
                <p class="text-on-surface-variant">Sign in to manage your high-performance workspace.</p>
              </div>

              {/* Role Toggle */}
              <div className="flex p-1 bg-surface-variant rounded-xl mb-8">
                <button 
                  type="button"
                  className={`flex-1 py-2 rounded-lg font-label-sm text-label-sm transition-all duration-300 cursor-pointer border-none ${
                    role === 'employee' ? 'bg-primary/10 text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface bg-transparent'
                  }`} 
                  onClick={() => setRole('employee')}
                >
                  EMPLOYEE
                </button>
                <button 
                  type="button"
                  className={`flex-1 py-2 rounded-lg font-label-sm text-label-sm transition-all duration-300 cursor-pointer border-none ${
                    role === 'hr' ? 'bg-primary/10 text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface bg-transparent'
                  }`} 
                  onClick={() => setRole('hr')}
                >
                  HR ADMIN
                </button>
              </div>

              <form className="space-y-6" onSubmit={handleSignIn}>
                {/* Employee ID */}
                <div className="space-y-2 group">
                  <label className="font-label-sm text-label-sm text-on-surface-variant group-focus-within:text-primary transition-colors">
                    EMPLOYEE ID
                  </label>
                  <div className="relative flex items-center border-b border-white/10 input-glow transition-all py-2">
                    <span className="material-symbols-outlined text-on-surface-variant mr-3 text-lg">badge</span>
                    <input 
                      className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant/30 font-label-sm outline-none" 
                      placeholder="AE-102934" 
                      required 
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2 group">
                  <label className="font-label-sm text-label-sm text-on-surface-variant group-focus-within:text-primary transition-colors">
                    WORK EMAIL
                  </label>
                  <div className="relative flex items-center border-b border-white/10 input-glow transition-all py-2">
                    <span className="material-symbols-outlined text-on-surface-variant mr-3 text-lg">mail</span>
                    <input 
                      className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant/30 font-body-md outline-none" 
                      placeholder="name@aethercorp.com" 
                      required 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2 group">
                  <div className="flex justify-between items-end">
                    <label className="font-label-sm text-label-sm text-on-surface-variant group-focus-within:text-primary transition-colors">
                      PASSWORD
                    </label>
                    <a className="text-[11px] text-primary/60 hover:text-primary transition-colors" href="#">Forgot?</a>
                  </div>
                  <div className="relative flex items-center border-b border-white/10 input-glow transition-all py-2">
                    <span className="material-symbols-outlined text-on-surface-variant mr-3 text-lg">lock</span>
                    <input 
                      className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant/30 font-body-md outline-none" 
                      placeholder="••••••••" 
                      required 
                      type="password"
                      value={password}
                      onChange={handlePasswordChange}
                    />
                  </div>
                  
                  {/* Strength Meter */}
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-3">
                    <div className={`h-full strength-bar ${strength.colorClass}`} style={{ width: strength.width }}></div>
                  </div>
                  <div className="text-[10px] font-label-sm text-on-surface-variant/50 uppercase tracking-widest pt-1">
                    {strength.text}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    ref={magneticBtnRef}
                    className="magnetic-btn w-full py-4 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 group hover:shadow-[0_0_30px_rgba(104,218,185,0.3)] transition-all active:scale-95 border-t border-white/20 cursor-pointer" 
                    type="submit"
                  >
                    SIGN IN TO AETHER
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center">
                <p className="text-on-surface-variant font-body-md">
                  Don't have an account? <a className="text-primary font-bold hover:underline" href="#">Contact HR</a>
                </p>
              </div>
            </div>
          </div>

          {/* Support Footer */}
          <div className="absolute bottom-10 left-10 flex gap-6">
            <a className="font-label-sm text-label-sm text-on-surface-variant/60 hover:text-primary transition-colors" href="#">PRIVACY</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant/60 hover:text-primary transition-colors" href="#">SECURITY</a>
            <a className="font-label-sm text-label-sm text-on-surface-variant/60 hover:text-primary transition-colors" href="#">SUPPORT</a>
          </div>
        </section>

        {/* Right Section: Hero Scene */}
        <section className="hidden lg:flex relative w-3/5 bg-surface-container-lowest overflow-hidden">
          {/* Shader Background */}
          <ShaderBackground className="absolute inset-0 w-full h-full opacity-60" />
          
          {/* Three.js Floating Elements */}
          <FloatingGlassBlob className="absolute inset-0 w-full h-full z-10" />

          {/* Text Overlay */}
          <div className="relative z-20 w-full h-full flex flex-col justify-end p-20 bg-gradient-to-t from-background via-transparent to-transparent">
            <div className="max-w-2xl translate-y-10 opacity-0 animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-6 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-primary tracking-widest">SYSTEM STATUS: OPTIMAL</span>
              </div>
              <h1 className="font-display-xl text-display-xl text-on-surface mb-6 leading-tight">
                Every workday, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-fixed to-secondary">
                  perfectly aligned.
                </span>
              </h1>
              <p className="text-body-lg font-body-lg text-on-surface-variant max-w-lg mb-8 leading-relaxed">
                Aether HR orchestrates your entire organization's lifecycle with atmospheric precision and computational elegance.
              </p>

              {/* Stats Floating Cards */}
              <div className="flex gap-4">
                <div className="glass-card p-4 rounded-xl flex items-center gap-4 animate-float" style={{ animationDelay: '0s' }}>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">groups</span>
                  </div>
                  <div>
                    <div className="font-label-sm text-on-surface-variant">ACTIVE TEAMS</div>
                    <div className="font-headline-md text-on-surface">1,204</div>
                  </div>
                </div>
                <div className="glass-card p-4 rounded-xl flex items-center gap-4 animate-float" style={{ animationDelay: '1.5s' }}>
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-secondary">flash_on</span>
                  </div>
                  <div>
                    <div className="font-label-sm text-on-surface-variant">EFFICIENCY</div>
                    <div className="font-headline-md text-on-surface">98.2%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Abstract light orb */}
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none"></div>
        </section>
      </main>
    </div>
  );
}
