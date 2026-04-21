import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f1f0f',
          borderTopColor: '#1b3a1b',
        },
        tabBarActiveTintColor: '#81c784',
        tabBarInactiveTintColor: '#4a6741',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Activity' }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories' }} />
      <Tabs.Screen name="targets" options={{ title: 'Targets' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
    </Tabs>
  );
}
