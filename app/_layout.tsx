import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { seedIfEmpty } from '../db/seed';
import { ThemeProvider } from '../lib/theme';

function AppNavigator() {
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    seedIfEmpty().then(() => setSeeded(true));
  }, []);

  if (!seeded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}