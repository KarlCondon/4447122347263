import { useFocusEffect } from '@react-navigation/native';
import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
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

export default function ActivityScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const loadLogs = async () => {
    const allLogs = await db.select().from(habitLogs);
    const allHabits = await db.select().from(habits);
    const allCategories = await db.select().from(categories);

    const merged = allLogs.map(log => {
      const habit = allHabits.find(item => item.id === log.habitId);
      const category = allCategories.find(item => item.id === habit?.categoryId);

      return {
        id: log.id,
        habitName: habit?.name ?? 'Unknown',
        categoryName: category?.name ?? 'Unknown',
        categoryColour: category?.colour ?? '#888',
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

  useFocusEffect(
    useCallback(() => {
      loadLogs();
    }, [])
  );

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
          <Text style={styles.meta}>Count: {item.count}</Text>
          {item.duration ? <Text style={styles.meta}>{item.duration} mins</Text> : null}
          {item.score ? <Text style={styles.meta}>Score: {item.score}</Text> : null}
        </View>
      </View>

      <View style={styles.cardActions}>
       <TouchableOpacity
  onPress={() =>
    router.push({
      pathname: '/logs/edit',
      params: { id: String(item.id) },
    })
  }
>
  <Text style={styles.editBtn}>Edit</Text>
</TouchableOpacity>

        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteBtn}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Activity</Text>
          <Text style={styles.subheading}>Your recent golf habit logs</Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/logs/add')}
        >
          <Text style={styles.addButtonText}>Add log</Text>
        </TouchableOpacity>
      </View>

      {logs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No logs yet. Add your first one.</Text>
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
    backgroundColor: '#081f08',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heading: {
    color: '#eef6ee',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheading: {
    color: '#8fb58f',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#1c5f27',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#eef6ee',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#102d12',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f4824',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  habitName: {
    color: '#eef6ee',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  category: {
    color: '#8fb58f',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    color: '#b9cfb9',
    fontSize: 13,
    marginBottom: 6,
  },
  notes: {
    color: '#d6e2d6',
    fontSize: 13,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  meta: {
    color: '#89a589',
    fontSize: 12,
    marginRight: 12,
    marginBottom: 4,
  },
  cardActions: {
    marginLeft: 10,
  },
  editBtn: {
    color: '#9cd19f',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  deleteBtn: {
    color: '#f28d8d',
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#89a589',
    fontSize: 15,
  },
});