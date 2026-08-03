import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { createLogger } from "../../lib/logger";
import api from "../../lib/api";
import {
  MailCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Send,
} from "lucide-react";

const logger = createLogger("VerifyEmailPage");

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState(emailParam);
  const [showResendInput, setShowResendInput] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    logger.log("VerifyEmailPage mounted");
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }
    api
      .post("/auth/verify-email", { token })
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message || "Email verified successfully.");
      })
      .catch((err) => {
        const msg = err.response?.data?.message || "Verification failed.";
        setStatus("error");
        setMessage(msg);
      });
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) {
      setResendMessage("Please enter your email.");
      return;
    }
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email: resendEmail });
      setResendMessage("Verification email resent! Check your inbox.");
      logger.log("Resend verification requested");
    } catch (err: any) {
      setResendMessage(
        err.response?.data?.message || "Could not resend email.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <img
        src="/auth2.png"
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 card w-full max-w-md bg-base-100/30 backdrop-blur-[1px] border border-white/20 shadow-2xl p-8 text-center">
        {status === "loading" && (
          <div className="space-y-6">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
            <h2 className="text-2xl font-bold text-white">
              Verifying your email…
            </h2>
            <p className="text-white/60">Please wait a moment.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-primary/20">
              <MailCheck className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
            <p className="text-white/70">{message}</p>
            <Link to="/login" className="btn btn-primary gap-2">
              Continue to Login <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-error/20">
              <AlertCircle className="w-8 h-8 text-error" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Verification Failed
            </h2>
            <p className="text-white/70">{message}</p>
            <Link
              to="/login"
              className="btn btn-outline btn-sm border-white/20 text-white hover:bg-white/10"
            >
              Go to Login
            </Link>
            <div className="mt-4">
              {!showResendInput ? (
                <button
                  onClick={() => setShowResendInput(true)}
                  className="btn btn-ghost btn-sm text-white/70"
                >
                  Resend verification email
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="input input-bordered w-full bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="btn btn-primary btn-sm w-full gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {resending ? "Sending..." : "Send"}
                  </button>
                  {resendMessage && (
                    <p className="text-xs text-white/80 mt-1">
                      {resendMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}