import { router } from 'expo-router';
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
import { useAppTheme } from '../../lib/theme';

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
// Default new logs to today's date to make quick entry easier
const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

export default function AddLogScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [date, setDate] = useState(getToday());
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
  }, []);

  const loadData = async () => {
    try {
      const categoryResults = await db.select().from(categoriesTable);
      const habitResults = await db.select().from(habitsTable);

      setCategories(categoryResults);
      setHabits(habitResults);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not load habits');
    }
  };

  const getCategory = (categoryId: number) => {
    return categories.find(category => category.id === categoryId);
  };
// Validate the entry before saving it into the local SQLite database
  const handleSave = async () => {
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
      await db.insert(habitLogsTable).values({
        habitId: selectedHabitId,
        date: date.trim(),
        count: countValue,
        duration: durationValue,
        notes: notes.trim() || null,
        score: scoreValue,
        createdAt: new Date().toISOString(),
      });

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save log');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Add log</Text>
      <Text style={styles.subheading}>Record a habit properly</Text>

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
            <Text style={styles.saveButtonText}>Save log</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      paddingTop: 60,
      paddingHorizontal: 16,
      paddingBottom: 28,
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
    panel: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    label: {
      color: theme.text,
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
      backgroundColor: theme.chipBackground,
      borderWidth: 1,
      borderColor: theme.chipBorder,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },
    habitChipActive: {
      backgroundColor: theme.chipActiveBackground,
      borderColor: theme.chipActiveBorder,
    },
    habitDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    habitName: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    habitNameActive: {
      color: theme.text,
    },
    habitCategory: {
      color: theme.textMuted,
      fontSize: 12,
    },
    actions: {
      flexDirection: 'row',
      marginTop: 6,
    },
    saveButton: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      marginRight: 10,
    },
    saveButtonText: {
      color: theme.primaryText,
      fontSize: 14,
      fontWeight: '600',
    },
    cancelButton: {
      backgroundColor: theme.secondaryButton,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    cancelButtonText: {
      color: theme.secondaryButtonText,
      fontSize: 14,
      fontWeight: '600',
    },
  });