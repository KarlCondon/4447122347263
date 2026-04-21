import { StyleSheet, Text, View } from 'react-native';

export default function InsightsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Insights screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#e8f5e9',
    fontSize: 18,
    fontWeight: '600',
  },
});