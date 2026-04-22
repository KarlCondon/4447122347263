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
import { clearAllReminders, scheduleDailyReminder } from '../lib/notifications';
import { clearSessionUserId, getSessionUserId } from '../lib/session';
import { useAppTheme } from '../lib/theme';

type User = {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: string;
};

export default function ProfileScreen() {
  const { theme, mode, toggleTheme } = useAppTheme();
  const styles = createStyles(theme);

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

  const handleDailyReminder = async () => {
    try {
      await scheduleDailyReminder();
      Alert.alert('Reminder set', 'A daily reminder has been scheduled for 7:00 PM.');
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Could not set reminder',
        'Please allow notifications and try again.'
      );
    }
  };

  const handleClearReminders = async () => {
    try {
      await clearAllReminders();
      Alert.alert('Reminders cleared', 'All scheduled reminders have been removed.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not clear reminders.');
    }
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

      <TouchableOpacity style={styles.secondaryButton} onPress={toggleTheme}>
        <Text style={styles.secondaryButtonText}>
          Switch to {mode === 'dark' ? 'light' : 'dark'} mode
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleDailyReminder}>
        <Text style={styles.secondaryButtonText}>Set daily reminder</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={handleClearReminders}>
        <Text style={styles.secondaryButtonText}>Clear reminders</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={handleLogout}>
        <Text style={styles.primaryButtonText}>Log out</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteProfile}>
        <Text style={styles.dangerButtonText}>Delete profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    loadingWrap: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: theme.textSoft,
      fontSize: 15,
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 60,
      paddingHorizontal: 16,
    },
    heading: {
      color: theme.text,
      fontSize: 32,
      fontWeight: '700',
      marginBottom: 6,
    },
    subheading: {
      color: theme.textMuted,
      fontSize: 14,
      marginBottom: 24,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: theme.border,
    },
    label: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 4,
    },
    value: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 14,
    },
    secondaryButton: {
      backgroundColor: theme.secondaryButton,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 12,
    },
    secondaryButtonText: {
      color: theme.secondaryButtonText,
      fontSize: 15,
      fontWeight: '600',
    },
    primaryButton: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 12,
    },
    primaryButtonText: {
      color: theme.primaryText,
      fontSize: 15,
      fontWeight: '600',
    },
    dangerButton: {
      backgroundColor: theme.dangerBackground,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    dangerButtonText: {
      color: theme.danger,
      fontSize: 15,
      fontWeight: '600',
    },
  });