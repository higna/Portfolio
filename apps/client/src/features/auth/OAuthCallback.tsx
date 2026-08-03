import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createLogger } from '../../lib/logger';

const logger = createLogger('OAuthCallback');

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      logger.log('OAuth token stored, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      window.location.reload(); 
    } else {
      logger.error('No token found in callback');
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return null; 
}