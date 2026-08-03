import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { createLogger } from "../../lib/logger";
import api from "../../lib/api";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

const logger = createLogger("ResetPasswordPage");

function getPasswordStrength(password: string) {
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  return { score, checks };
}

const checkLabels = [
  "At least 6 characters",
  "One capital letter",
  "One number",
  "One symbol",
];

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { score, checks } = getPasswordStrength(password);

  useEffect(() => {
    logger.log("ResetPasswordPage mounted");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing reset token.");
      return;
    }
    if (score < 4) {
      setError("Please meet all password requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    logger.log("Password reset form submitted");
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setSuccess("Password reset successful. You can now log in.");
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Reset failed. The link may be expired.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <img
        src="/auth4.png"
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 card w-full max-w-md bg-base-100/30 backdrop-blur-[1px] border border-white/20 shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Set a new password
        </h2>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white/80">New Password</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-white/60" />
                  ) : (
                    <Eye className="w-5 h-5 text-white/60" />
                  )}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${i <= score ? "bg-success" : "bg-white/30"}`}
                      />
                    ))}
                  </div>
                  <ul className="space-y-1">
                    {checkLabels.map((label, idx) => (
                      <li key={idx} className="flex items-center gap-1 text-xs">
                        {checks[idx] ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <X className="w-3 h-3 text-error" />
                        )}
                        <span
                          className={
                            checks[idx] ? "text-success" : "text-white/50"
                          }
                        >
                          {label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-white/80">
                  Confirm Password
                </span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  required
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-error mt-1">
                  Passwords do not match
                </p>
              )}
            </div>
            {error && <div className="alert alert-error text-sm">{error}</div>}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Reset Password"
              )}
            </button>
            <p className="text-center text-sm text-white/50">
              Remember your password?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <CheckCircle className="w-12 h-12 text-success mx-auto" />
            <p className="text-white/80">{success}</p>
            <Link to="/login" className="btn btn-primary gap-2">
              Continue to Login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}