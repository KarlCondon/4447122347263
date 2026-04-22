import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
// Ask for notification permission before trying to schedule reminders
export async function ensureNotificationPermissions() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2d7a38',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}
// Reset existing reminders first so the user only keeps one daily prompt
export async function scheduleDailyReminder() {
  const granted = await ensureNotificationPermissions();

  if (!granted) {
    throw new Error('Notification permission was not granted');
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Golf Tracker reminder',
      body: 'Log todays activity and check your target progress.',
      sound: true,
    },
  trigger: {
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  hour: 19,
  minute: 0,
},
  });
}
// Remove every scheduled reminder for the device user
export async function clearAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}