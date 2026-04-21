import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { seedIfEmpty } from '../db/seed';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedIfEmpty()
      .catch(error => {
        console.error('Seed failed:', error);
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  if (!ready) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}