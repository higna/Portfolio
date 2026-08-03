import { useEffect } from 'react';
import AppRouter from './router';
import { createLogger } from './lib/logger';

const logger = createLogger('App');

function App() {
  useEffect(() => {
    logger.log('App mounted');
  }, []);

  return <AppRouter />;
}

export default App;