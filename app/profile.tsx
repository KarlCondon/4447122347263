import { useFocusEffect } from '@react-navigation/native';
import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../db/client';
import { users } from '../db/schema';
import { clearSessionUserId, getSessionUserId } from '../lib/session';

type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: string;
};

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const loadUser = async () => {
    const sessionId = await getSessionUserId();

    if (!sessionId) {
      router.replace('/(auth)/login');
      return;
    }

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(sessionId)));

    if (result.length === 0) {
      await clearSessionUserId();
      router.replace('/(auth)/login');
      return;
    }

    setUser(result[0]);
  };

  const handleLogout = async () => {
    await clearSessionUserId();
    router.replace('/(auth)/login');
  };

  const handleDeleteProfile = () => {
    if (!user) return;

    Alert.alert(
      'Delete profile',
      'Are you sure you want to delete your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await db.delete(users).where(eq(users.id, user.id));
            await clearSessionUserId();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Account</Text>
      <Text style={styles.subheading}>Manage your profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user.name}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.email}</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleLogout}>
        <Text style={styles.primaryButtonText}>Log out</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteProfile}>
        <Text style={styles.dangerButtonText}>Delete profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    backgroundColor: '#081f08',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#d6dfd6',
    fontSize: 15,
  },
  container: {
    flex: 1,
    backgroundColor: '#081f08',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  heading: {
    color: '#eef6ee',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 6,
  },
  subheading: {
    color: '#8fb58f',
    fontSize: 14,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#102d12',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1f4824',
  },
  label: {
    color: '#8fb58f',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  value: {
    color: '#eef6ee',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#2d7a38',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#4a1717',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#ffd7d7',
    fontSize: 15,
    fontWeight: '600',
  },
});