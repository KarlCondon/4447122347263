import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { getSessionUserId } from '../lib/session';

export default function Index() {
  const [destination, setDestination] = useState<'/(tabs)' | '/(auth)/login' | null>(null);
// Send returning users straight to the app if a local session already exists
  useEffect(() => {
    const checkSession = async () => {
      const userId = await getSessionUserId();
      setDestination(userId ? '/(tabs)' : '/(auth)/login');
    };

    checkSession();
  }, []);

  if (!destination) return null;

  return <Redirect href={destination} />;
}