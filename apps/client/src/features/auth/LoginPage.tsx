import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { createLogger } from '../../lib/logger';
import api from '../../lib/api';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowLeft, Send } from 'lucide-react';

const logger = createLogger('LoginPage');
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'forgot' | 'resend'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const captchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => { logger.log('LoginPage mounted'); }, []);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:2500'}/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email) { toast.error('Please enter your email.'); setLoading(false); return; }

    if (mode === 'login') {
      if (!password) { toast.error('Please enter your password.'); setLoading(false); return; }
      if (!captchaToken) { toast.error('Please complete the captcha.'); setLoading(false); return; }
      try {
        await login(email, password, captchaToken);
        toast.success('Login successful.');
        navigate('/dashboard');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Invalid email or password');
        captchaRef.current?.reset();
        setCaptchaToken(null);
      }
    } else if (mode === 'forgot') {
      try {
        await api.post('/auth/forgot-password', { email });
        toast.success('If that email exists, a reset link has been sent.');
        setMode('login');
      } catch {
        toast.error('Something went wrong.');
      }
    } else {
      try {
        await api.post('/auth/resend-verification', { email });
        toast.success('Verification email resent. Check your inbox.');
        setMode('login');
      } catch {
        toast.error('Something went wrong.');
      }
    }
    setLoading(false);
  };

  const showCaptcha = mode === 'login' && email && password.length >= 6;

  const formContent = (
    <div className="w-full max-w-md bg-base-100 shadow-xl rounded-box p-6 sm:p-8">
      <h2 className="text-3xl font-bold mb-2">
        {mode === 'login' ? 'Welcome back' : mode === 'forgot' ? 'Forgot Password?' : 'Resend Verification'}
      </h2>
      <p className="text-base-content/60 mb-8">
        {mode === 'login' ? 'Sign in to your account' : mode === 'forgot' ? 'Enter your email to receive a reset link' : 'Enter your email to receive a verification link'}
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="form-control">
          <label className="label"><span className="label-text">Email</span></label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input input-bordered w-full pl-10" required />
          </div>
        </div>
        {mode === 'login' && (
          <div className="form-control">
            <label className="label"><span className="label-text">Password</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input input-bordered w-full pl-10 pr-10" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Toggle visibility">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
        {showCaptcha && (
          <div className="flex justify-center animate-fade-in">
            <ReCAPTCHA ref={captchaRef} sitekey={RECAPTCHA_SITE_KEY} onChange={token => setCaptchaToken(token)} />
          </div>
        )}
        <button type="submit" className="btn btn-primary w-full gap-2" disabled={loading}>
          {loading ? <span className="loading loading-spinner"></span> :
            mode === 'login' ? <><LogIn className="w-5 h-5" /> Sign In</> :
            <><Send className="w-5 h-5" /> {mode === 'forgot' ? 'Send Reset Link' : 'Resend Verification'}</>
          }
        </button>
        {mode !== 'login' && (
          <button type="button" onClick={() => { setMode('login'); setCaptchaToken(null); captchaRef.current?.reset(); }} className="flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </button>
        )}
      </form>
      {mode === 'login' && (
        <>
          <div className="divider my-6">or</div>
          <button onClick={handleGoogleLogin} className="btn btn-outline w-full gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Login with Google
          </button>
          <div className="mt-6 text-center space-y-2">
            <p><button type="button" onClick={() => setMode('forgot')} className="text-sm text-primary hover:underline">Forgot password?</button></p>
            <p className="text-sm">Don&apos;t have an account?{' '}<Link to="/signup" className="text-primary font-semibold hover:underline">Sign up</Link></p>
            <p className="text-sm text-base-content/60">Didn't receive a verification email?{' '}<button type="button" onClick={() => setMode('resend')} className="text-primary hover:underline">Resend</button></p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <img src="/auth3.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-8">
          <h1 className="text-5xl font-bold text-white mb-4">Hector Igna-Igboko</h1>
          <p className="text-xl text-white/80">Full‑Stack Developer & Data Engineer</p>
          <p className="mt-6 text-lg text-white/70 italic">"Crafting intelligent solutions with code, data, and automation."</p>
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-4 sm:p-8">
        {formContent}
      </div>
      {/* Mobile */}
      <div className="lg:hidden relative min-h-screen flex items-center justify-center p-4">
        <img src="/auth2.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div className="relative z-10 w-full max-w-md bg-base-100/30 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 sm:p-8">
          <h2 className="text-3xl font-bold text-white mb-2">{mode === 'login' ? 'Welcome back' : mode === 'forgot' ? 'Forgot Password?' : 'Resend Verification'}</h2>
          <p className="text-white/60 mb-8">{mode === 'login' ? 'Sign in to your account' : mode === 'forgot' ? 'Enter your email to receive a reset link' : 'Enter your email to receive a verification link'}</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-control">
              <label className="label"><span className="label-text text-white/80">Email</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input input-bordered w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50" required />
              </div>
            </div>
            {mode === 'login' && (
              <div className="form-control">
                <label className="label"><span className="label-text text-white/80">Password</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input input-bordered w-full pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="w-5 h-5 text-white/60" /> : <Eye className="w-5 h-5 text-white/60" />}
                  </button>
                </div>
              </div>
            )}
            {showCaptcha && (
              <div className="flex justify-center animate-fade-in">
                <ReCAPTCHA ref={captchaRef} sitekey={RECAPTCHA_SITE_KEY} onChange={token => setCaptchaToken(token)} />
              </div>
            )}
            <button type="submit" className="btn btn-primary w-full gap-2" disabled={loading}>
              {loading ? <span className="loading loading-spinner"></span> :
                mode === 'login' ? <><LogIn className="w-5 h-5" /> Sign In</> :
                <><Send className="w-5 h-5" /> {mode === 'forgot' ? 'Send Reset Link' : 'Resend Verification'}</>
              }
            </button>
            {mode !== 'login' && (
              <button type="button" onClick={() => { setMode('login'); setCaptchaToken(null); captchaRef.current?.reset(); }} className="flex items-center gap-2 text-sm text-amber-300 hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </button>
            )}
          </form>
          {mode === 'login' && (
            <>
              <div className="divider my-6 text-white/40">or</div>
              <button onClick={handleGoogleLogin} className="btn btn-outline w-full gap-2 border-white/20 text-white hover:bg-white/10">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Login with Google
              </button>
              <div className="mt-6 text-center space-y-2">
                <p><button type="button" onClick={() => setMode('forgot')} className="text-sm text-amber-300 hover:underline">Forgot password?</button></p>
                <p className="text-sm text-white/70">Don&apos;t have an account?{' '}<Link to="/signup" className="text-amber-300 font-semibold hover:underline">Sign up</Link></p>
                <p className="text-sm text-white/50">Didn't receive a verification email?{' '}<button type="button" onClick={() => setMode('resend')} className="text-amber-300 hover:underline">Resend</button></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}