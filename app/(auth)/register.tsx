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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields');
      return;
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));

    if (existing.length > 0) {
      Alert.alert('Account exists', 'An account with that email already exists');
      return;
    }

    await db.insert(users).values({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      createdAt: new Date().toISOString(),
    });

    const createdUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));

    if (createdUser.length === 0) {
      Alert.alert('Error', 'Could not complete registration');
      return;
    }

    await setSessionUserId(String(createdUser[0].id));
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start tracking your golf habits</Text>

        <FormField
          label="Full name"
          placeholder="Full name"
          value={name}
          onChangeText={setName}
        />

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

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Create account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.link}>Already have an account? Log in</Text>
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
    fontSize: 32,
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