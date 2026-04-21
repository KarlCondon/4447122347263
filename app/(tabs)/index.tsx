import { eq } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../db/client';
import { categories, habitLogs, habits } from '../../db/schema';

type LogEntry = {
  id: number;
  habitName: string;
  categoryName: string;
  categoryColour: string;
  date: string;
  count: number;
  duration: number | null;
  notes: string | null;
  score: number | null;
};

export default function HomeScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const loadLogs = async () => {
    const allLogs = await db.select().from(habitLogs);
    const allHabits = await db.select().from(habits);
    const allCats = await db.select().from(categories);

    const merged = allLogs.map(log => {
      const habit = allHabits.find(h => h.id === log.habitId);
      const cat = allCats.find(c => c.id === habit?.categoryId);
      return {
        id: log.id,
        habitName: habit?.name ?? 'Unknown',
        categoryName: cat?.name ?? 'Unknown',
        categoryColour: cat?.colour ?? '#888',
        date: log.date,
        count: log.count,
        duration: log.duration,
        notes: log.notes,
        score: log.score,
      };
    });

    merged.sort((a, b) => b.date.localeCompare(a.date));
    setLogs(merged);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete log', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await db.delete(habitLogs).where(eq(habitLogs.id, id));
          loadLogs();
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: LogEntry }) => (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: item.categoryColour }]} />
      <View style={styles.cardContent}>
        <Text style={styles.habitName}>{item.habitName}</Text>
        <Text style={styles.category}>{item.categoryName}</Text>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
        <View style={styles.metaRow}>
          {item.duration ? <Text style={styles.meta}>{item.duration} mins</Text> : null}
          {item.score ? <Text style={styles.meta}>Score: {item.score}</Text> : null}
        </View>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)}>
        <Text style={styles.deleteBtn}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Activity Log</Text>

      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No logs yet. Start tracking!</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1f0f',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e8f5e9',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1b3a1b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: 10,
  },
  cardContent: {
    flex: 1,
  },
  habitName: {
    color: '#e8f5e9',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  category: {
    color: '#81c784',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  date: {
    color: '#a5d6a7',
    fontSize: 13,
    marginBottom: 4,
  },
  notes: {
    color: '#a5d6a7',
    fontSize: 13,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  meta: {
    color: '#4a6741',
    fontSize: 12,
  },
  deleteBtn: {
    color: '#e57373',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#4a6741',
    fontSize: 15,
  },
});