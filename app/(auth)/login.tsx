import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import FormField from '../../components/FormField';
import { db } from '../../db/client';
import { users } from '../../db/schema';
import { setSessionUserId } from '../../lib/session';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password');
      return;
    }

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));

    if (result.length === 0 || result[0].password !== password) {
      Alert.alert('Login failed', 'Incorrect email or password');
      return;
    }

    await setSessionUserId(String(result[0].id));
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Golf Tracker</Text>
        <Text style={styles.subtitle}>Track your game, improve your scores</Text>

        <FormField
          label="Email"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <FormField
          label="Password"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>Don&apos;t have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1f0f',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#e8f5e9',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#81c784',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#81c784',
    textAlign: 'center',
    fontSize: 14,
  },
});