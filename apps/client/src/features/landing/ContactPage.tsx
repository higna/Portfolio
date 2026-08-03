import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  User,
  MessageSquare,
  Send,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { createLogger } from '../../lib/logger';

const logger = createLogger('ContactPage');

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await api.post('/contact', form);
      setSubmitted(true);
      toast.success('Message sent! I\'ll get back to you soon.');
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
      logger.error('Contact form error', err);
    } finally {
      setLoading(false);
    }
  };

  const glassInput =
    'input input-bordered w-full bg-base-200/50 focus:ring-2 focus:ring-primary transition-all duration-200';

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero section */}
      <div className="relative h-[60vh] min-h-75 overflow-hidden flex items-center -mt-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/contact.png')" }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-[#D4AF37] mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="text-center">
            <p className="text-[#D4AF37] font-mono text-xs tracking-[0.3em] uppercase">
              Get in Touch
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mt-3 font-['Cormorant_Garamond']">
              Contact
            </h1>
            <p className="text-lg text-white/70 mt-4 max-w-xl mx-auto">
              Have a project in mind or just want to say hello? Drop me a message.
            </p>
          </div>
        </div>
      </div>

      {/* Two‑column layout */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-stretch">
            {/* Contact info cards */}
            <div className="flex flex-col space-y-6 h-full">
              {[
                { icon: Mail, title: 'Email', detail: 'higboko@gmail.com' },
                { icon: Phone, title: 'Phone', detail: '+234 916 040 9456' },
                { icon: MapPin, title: 'Office', detail: 'Ibadan, Nigeria' },
                { icon: Clock, title: 'Response Time', detail: 'Within 24 hours' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="card bg-base-100 border border-base-200 shadow-sm p-5 flex items-center gap-4"
                >
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-base-content">{item.title}</p>
                    <p className="text-sm text-base-content/60">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Form column */}
            <div className="lg:col-span-2 h-full">
              {submitted ? (
                <div className="card bg-base-100 border border-success/30 shadow-sm p-10 text-center h-full flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-base-content mb-2">Message Sent!</h2>
                  <p className="text-base-content/60 max-w-md mx-auto">
                    {user
                      ? 'I\'ll respond to you shortly.'
                      : 'Thank you for reaching out. I\'ll review your message and respond shortly.'}
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="card bg-base-100 border border-base-200 shadow-sm p-6 md:p-8 space-y-6 h-full flex flex-col"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-9">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text flex items-center gap-2">
                          <User className="w-4 h-4" /> Your Name *
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        className={glassInput}
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                        readOnly={!!user}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text flex items-center gap-2">
                          <Mail className="w-4 h-4" /> Email Address *
                        </span>
                      </label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        className={glassInput}
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                        readOnly={!!user}
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Subject *
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="How can I help?"
                      className={glassInput}
                      value={form.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control flex-1">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Message *
                      </span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered w-full bg-base-200/50 focus:ring-2 focus:ring-primary transition-all duration-200 flex-1 min-h-60"
                      rows={5}
                      placeholder="Describe your request or issue..."
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary gap-2 mt-auto"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {loading ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}