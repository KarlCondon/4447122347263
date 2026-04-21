import { eq } from 'drizzle-orm';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import FormField from '../../components/FormField';
import { db } from '../../db/client';
import {
    categories as categoriesTable,
    habitLogs as habitLogsTable,
    habits as habitsTable,
} from '../../db/schema';

type Category = {
  id: number;
  name: string;
  colour: string;
};

type Habit = {
  id: number;
  name: string;
  categoryId: number;
  createdAt: string;
};

export default function EditLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [count, setCount] = useState('1');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [score, setScore] = useState('');

  const sortedHabits = useMemo(
    () => [...habits].sort((a, b) => a.name.localeCompare(b.name)),
    [habits]
  );

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) {
      Alert.alert('Missing log', 'No log was selected');
      router.back();
      return;
    }

    try {
      const logId = Number(id);

      const categoryResults = await db.select().from(categoriesTable);
      const habitResults = await db.select().from(habitsTable);
      const logResults = await db
        .select()
        .from(habitLogsTable)
        .where(eq(habitLogsTable.id, logId));

      const log = logResults[0];

      if (!log) {
        Alert.alert('Not found', 'That log could not be found');
        router.back();
        return;
      }

      setCategories(categoryResults);
      setHabits(habitResults);

      setSelectedHabitId(log.habitId);
      setDate(log.date);
      setCount(String(log.count));
      setDuration(log.duration ? String(log.duration) : '');
      setNotes(log.notes ?? '');
      setScore(log.score ? String(log.score) : '');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not load log');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getCategory = (categoryId: number) => {
    return categories.find(category => category.id === categoryId);
  };

  const handleSave = async () => {
    if (!id) return;

    if (!selectedHabitId) {
      Alert.alert('Missing habit', 'Choose a habit first');
      return;
    }

    if (!date.trim()) {
      Alert.alert('Missing date', 'Enter a date in YYYY-MM-DD format');
      return;
    }

    const countValue = Number(count);
    const durationValue = duration.trim() ? Number(duration) : null;
    const scoreValue = score.trim() ? Number(score) : null;

    if (Number.isNaN(countValue) || countValue < 1) {
      Alert.alert('Invalid count', 'Count must be 1 or more');
      return;
    }

    if (duration.trim() && (Number.isNaN(durationValue) || durationValue! < 0)) {
      Alert.alert('Invalid duration', 'Duration must be a valid number');
      return;
    }

    if (score.trim() && Number.isNaN(scoreValue)) {
      Alert.alert('Invalid score', 'Score must be a valid number');
      return;
    }

    try {
      await db
        .update(habitLogsTable)
        .set({
          habitId: selectedHabitId,
          date: date.trim(),
          count: countValue,
          duration: durationValue,
          notes: notes.trim() || null,
          score: scoreValue,
        })
        .where(eq(habitLogsTable.id, Number(id)));

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update log');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Loading log...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Edit log</Text>
      <Text style={styles.subheading}>Update an existing activity entry</Text>

      <View style={styles.panel}>
        <Text style={styles.label}>Choose habit</Text>

        <View style={styles.habitWrap}>
          {sortedHabits.map(habit => {
            const category = getCategory(habit.categoryId);
            const active = selectedHabitId === habit.id;

            return (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitChip,
                  active && styles.habitChipActive,
                ]}
                onPress={() => setSelectedHabitId(habit.id)}
              >
                <View
                  style={[
                    styles.habitDot,
                    { backgroundColor: category?.colour ?? '#7c927d' },
                  ]}
                />
                <View>
                  <Text
                    style={[
                      styles.habitName,
                      active && styles.habitNameActive,
                    ]}
                  >
                    {habit.name}
                  </Text>
                  <Text style={styles.habitCategory}>
                    {category?.name ?? 'Unknown'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <FormField
          label="Date"
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        <FormField
          label="Count"
          placeholder="1"
          value={count}
          onChangeText={setCount}
          keyboardType="number-pad"
        />

        <FormField
          label="Duration (mins)"
          placeholder="Optional"
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
        />

        <FormField
          label="Notes"
          placeholder="Optional"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <FormField
          label="Score"
          placeholder="Optional"
          value={score}
          onChangeText={setScore}
          keyboardType="number-pad"
        />

        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#081f08',
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 28,
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
  panel: {
    backgroundColor: '#102d12',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f4824',
  },
  label: {
    color: '#dce8dc',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  habitWrap: {
    marginBottom: 16,
  },
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#173a19',
    borderWidth: 1,
    borderColor: '#244d27',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  habitChipActive: {
    backgroundColor: '#1f5a25',
    borderColor: '#5faa65',
  },
  habitDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  habitName: {
    color: '#e6efe6',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  habitNameActive: {
    color: '#ffffff',
  },
  habitCategory: {
    color: '#8fb58f',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 6,
  },
  saveButton: {
    backgroundColor: '#2d7a38',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginRight: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#1a2b1b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  cancelButtonText: {
    color: '#d6dfd6',
    fontSize: 14,
    fontWeight: '600',
  },
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
});