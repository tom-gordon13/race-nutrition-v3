import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export const useUserSync = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasSynced, setHasSynced] = useState(false)

  useEffect(() => {
    const syncUser = async () => {

      if (!isAuthenticated || !user || isLoading || hasSynced) {
        console.log('Early return - conditions not met');
        return;
      }

      setIsSyncing(true);
      setSyncError(null);

      try {
        // Extract name from user object
        const firstName = user.given_name || user.name?.split(' ')[0] || 'User';
        const lastName = user.family_name || user.name?.split(' ').slice(1).join(' ') || '';

        console.log('Sending request with data:', { auth0Sub: user.sub, email: user.email, firstName, lastName });

        const response = await fetch(`${API_URL}/api/auth/sync-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auth0Sub: user.sub,
            email: user.email,
            firstName,
            lastName
          }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          throw new Error('Failed to sync user');
        }

        const data = await response.json();
        console.log('User synced successfully:', data.message);
        setHasSynced(true);
      } catch (error) {
        console.error('Error syncing user:', error);
        setSyncError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsSyncing(false);
      }
    };

    syncUser();
  }, [isAuthenticated, user, isLoading, hasSynced]);

  return { isSyncing, syncError };
};
