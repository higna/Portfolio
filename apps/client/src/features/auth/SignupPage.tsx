import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { createLogger } from '../../lib/logger';
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Camera, Check, X } from 'lucide-react';

const logger = createLogger('SignupPage');
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

function getPasswordStrength(password: string): { score: number; checks: boolean[] } {
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  return { score: checks.filter(Boolean).length, checks };
}

const checkLabels = ['At least 6 characters', 'One capital letter', 'One number', 'One symbol'];

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const { signup } = useAuth();
  const navigate = useNavigate();
  const captchaRef = useRef<ReCAPTCHA>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { score, checks } = getPasswordStrength(password);
  const showCaptcha = score === 4 && confirmPassword === password;

  useEffect(() => { logger.log('SignupPage mounted'); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleGoogleSignup = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:2500'}/auth/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 4) { toast.error('Please meet all password requirements'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (!captchaToken) { toast.error('Please complete the captcha'); return; }
    setLoading(true);
    try {
      const message = await signup(email, password, fullName, captchaToken, selectedFile || undefined);
      toast.success(message || 'Registration successful! Check your email to verify.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed.');
      captchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="space-y-5">
      <div className="flex flex-col items-center">
        <div className="avatar cursor-pointer mb-2" onClick={() => fileInputRef.current?.click()}>
          {previewUrl ? (
            <div className="w-20 h-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={previewUrl} alt="Avatar preview" className="rounded-full" />
            </div>
          ) : (
            <div className="bg-neutral/20 rounded-full w-20 h-20 flex items-center justify-center">
              <Camera className="w-8 h-8 text-neutral" />
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <span className="text-xs text-base-content/60 mt-1">Add photo (optional)</span>
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Full Name</span></label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" className="input input-bordered w-full pl-10" />
        </div>
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Email</span></label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input input-bordered w-full pl-10" required />
        </div>
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Password</span></label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input input-bordered w-full pl-10 pr-10" required />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {password.length > 0 && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1">
              {[1,2,3,4].map(i => <div key={i} className={`h-2 flex-1 rounded-full ${i <= score ? 'bg-success' : 'bg-base-300'}`} />)}
            </div>
            <ul className="space-y-1">
              {checkLabels.map((label, idx) => (
                <li key={idx} className="flex items-center gap-1 text-xs">
                  {checks[idx] ? <Check className="w-3 h-3 text-success" /> : <X className="w-3 h-3 text-error" />}
                  <span className={checks[idx] ? 'text-success' : 'text-base-content/50'}>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Confirm Password</span></label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className="input input-bordered w-full pl-10" required />
        </div>
        {confirmPassword && password !== confirmPassword && <p className="text-xs text-error mt-1">Passwords do not match</p>}
      </div>
      {showCaptcha && (
        <div className="flex justify-center animate-fade-in">
          <ReCAPTCHA ref={captchaRef} sitekey={RECAPTCHA_SITE_KEY} onChange={token => setCaptchaToken(token)} />
        </div>
      )}
      <button type="submit" className="btn btn-primary w-full gap-2" disabled={loading}>
        {loading ? <span className="loading loading-spinner"></span> : <><UserPlus className="w-5 h-5" /> Sign Up</>}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <img src="/auth2.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center px-8">
          <h1 className="text-5xl font-bold text-white mb-4">Hector Igna-Igboko</h1>
          <p className="text-xl text-white/80">Full‑Stack Developer & Data Engineer</p>
          <p className="mt-6 text-lg text-white/70 italic">"Crafting intelligent solutions with code, data, and automation."</p>
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-base-100 shadow-xl rounded-box p-6 sm:p-8">
          <h2 className="text-3xl font-bold mb-2">Create an account</h2>
          <p className="text-base-content/60 mb-8">Join to unlock full features</p>
          <form onSubmit={handleSubmit}>{formContent}</form>
          <div className="divider my-6">or</div>
          <button onClick={handleGoogleSignup} className="btn btn-outline w-full gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign Up with Google
          </button>
          <div className="mt-6 text-center">
            <p className="text-sm">Already have an account?{' '}<Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link></p>
          </div>
        </div>
      </div>
      {/* Mobile */}
      <div className="lg:hidden relative min-h-screen flex items-center justify-center p-4">
        <img src="/auth2.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div className="relative z-10 w-full max-w-md bg-base-100/30 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-6 sm:p-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create an account</h2>
          <p className="text-white/60 mb-8">Join to unlock full features</p>
          <form onSubmit={handleSubmit}>
            <div className="[&_.label-text]:text-white/80 [&_.input]:bg-white/10 [&_.input]:border-white/20 [&_.input]:text-white [&_.input::placeholder]:text-white/50 [&_.text-base-content\/60]:text-white/50 [&_.text-base-content\/40]:text-white/40 [&_.text-error]:text-error [&_.bg-base-300]:bg-white/20">
              {formContent}
            </div>
          </form>
          <div className="divider my-6 text-white/40">or</div>
          <button onClick={handleGoogleSignup} className="btn btn-outline w-full gap-2 border-white/20 text-white hover:bg-white/10">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign Up with Google
          </button>
          <div className="mt-6 text-center">
            <p className="text-sm text-white/70">Already have an account?{' '}<Link to="/login" className="text-amber-300 font-semibold hover:underline">Log in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}