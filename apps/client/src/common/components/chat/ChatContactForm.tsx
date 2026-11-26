import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Mail, MessageSquare, Send, User } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../lib/api";

export default function ChatContactForm() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.fullName ?? "",
    email: user?.email ?? "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: user?.fullName ?? "",
      email: user?.email ?? "",
    }));
  }, [user?.email, user?.fullName]);

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post("/contact", form);
      setSubmitted(true);
      toast.success("Message sent. I’ll get back to you soon.");
    } catch {
      toast.error("Could not send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 className="size-12 text-success" />
        <h3 className="mt-4 text-lg font-semibold">Message sent</h3>
        <p className="mt-1 max-w-xs text-sm leading-6 text-base-content/55">
          Thanks for reaching out. I’ll review your message and respond shortly.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm mt-5"
          onClick={() => {
            setSubmitted(false);
            setForm((current) => ({ ...current, subject: "", message: "" }));
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  const inputClass = "input input-bordered w-full bg-base-200/50 focus:border-primary";

  return (
    <form onSubmit={submit} className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
      <div className="mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Get in touch</p>
        <h3 className="mt-1.5 text-xl font-semibold tracking-tight">Send me a message</h3>
        <p className="mt-2 max-w-lg text-sm leading-6 text-base-content/55">Have a project in mind or a question? I’ll get back to you soon.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="form-control gap-2">
          <span className="label-text flex items-center gap-2 text-sm font-medium"><User className="size-4 text-primary" /> Name</span>
          <input
            required
            autoComplete="name"
            className={inputClass}
            value={form.name}
            readOnly={!!user}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Your name"
          />
        </label>

        <label className="form-control gap-2">
          <span className="label-text flex items-center gap-2 text-sm font-medium"><Mail className="size-4 text-primary" /> Email</span>
          <input
            required
            type="email"
            autoComplete="email"
            className={inputClass}
            value={form.email}
            readOnly={!!user}
            onChange={(event) => update("email", event.target.value)}
            placeholder="you@example.com"
          />
        </label>
      </div>

      <label className="form-control gap-2">
        <span className="label-text flex items-center gap-2 text-sm font-medium"><MessageSquare className="size-4 text-primary" /> Subject</span>
        <input required className={inputClass} value={form.subject} onChange={(event) => update("subject", event.target.value)} placeholder="How can I help?" />
      </label>

      <label className="form-control gap-2">
        <span className="label-text flex items-center gap-2 text-sm font-medium"><MessageSquare className="size-4 text-primary" /> Message</span>
        <textarea
          required
          rows={5}
          maxLength={5000}
          className="textarea textarea-bordered min-h-36 w-full resize-y bg-base-200/50 text-sm leading-6 focus:border-primary"
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          placeholder="Write your message..."
        />
      </label>

      <button type="submit" className="btn btn-primary mt-1 min-h-12 w-full gap-2" disabled={loading}>
        {loading ? <span className="loading loading-spinner loading-xs" /> : <Send className="size-4" />}
        {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
