import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <img
        src="/404.png"
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 card w-full max-w-md bg-base-100/30 backdrop-blur-xl border border-white/20 shadow-2xl p-8 text-center">
        <h1 className="text-6xl font-extrabold text-white drop-shadow-lg mb-2">404</h1>
        <h2 className="text-xl font-bold text-white mb-2">Page not found</h2>
        <p className="text-white/60 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}