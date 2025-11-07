/**
 * Auto-login hook for FarmX MVP
 * Automatically logs in with default user on app start
 */

import { useEffect, useState } from 'react';
import { api } from './api';

export function useAutoLogin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authenticate = async () => {
      try {
        // Check if already authenticated
        const { token } = api.getAuth();
        
        if (token) {
          // Verify token by fetching current user
          try {
            await api.getCurrentUser();
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          } catch (err) {
            // Token invalid, clear and re-login
            await api.clearAuth();
          }
        }

        // Auto-login with default credentials
        console.log('🔐 Performing auto-login with default user...');
        await api.autoLogin();
        setIsAuthenticated(true);
        console.log('✅ Auto-login successful');
      } catch (err: any) {
        console.error('❌ Auto-login failed:', err);
        setError(err.message || 'Login failed');
      } finally {
        setIsLoading(false);
      }
    };

    authenticate();
  }, []);

  return {
    isLoading,
    isAuthenticated,
    error,
  };
}
