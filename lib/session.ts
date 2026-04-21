import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'currentUserId';

export async function setSessionUserId(userId: string) {
  await SecureStore.setItemAsync(SESSION_KEY, userId);
}

export async function getSessionUserId() {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function clearSessionUserId() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}