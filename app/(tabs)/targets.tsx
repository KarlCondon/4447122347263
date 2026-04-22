import { useFocusEffect } from '@react-navigation/native';
import { eq } from 'drizzle-orm';
import { useCallback, useMemo, useState } from 'react';
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
    targets as targetsTable,
} from '../../db/schema';
import { useAppTheme } from '../../lib/theme';

type Habit = {
  id: number;
  name: string;
  categoryId: number;
  createdAt: string;
};

type Category = {
  id: number;
  name: string;
  colour: string;
};

type Target = {
  id: number;
  habitId: number | null;
  categoryId: number | null;
  period: string;
  goalValue: number;
  createdAt: string;
};

type HabitLog = {
  id: number;
  habitId: number;
  date: string;
  count: number;
  duration: number | null;
  notes: string | null;
  score: number | null;
  createdAt: string;
};

const toDateKey = (date: Date) => date.toISOString().split('T')[0];
// Weekly targets use a Monday to Sunday range
const getWeekRange = (weeksBack = 0) => {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday - weeksBack * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: toDateKey(start),
    end: toDateKey(end),
  };
};
// Monthly targets are checked against full calendar months
const getMonthRange = (monthsBack = 0) => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
  const end = new Date(today.getFullYear(), today.getMonth() - monthsBack + 1, 0);

  return {
    start: toDateKey(start),
    end: toDateKey(end),
  };
};

const getRangeForPeriod = (period: string, back = 0) => {
  return period === 'monthly' ? getMonthRange(back) : getWeekRange(back);
};

const getStreakLabel = (streak: number, period: string) => {
  if (period === 'monthly') {
    return `Streak: ${streak} ${streak === 1 ? 'month' : 'months'} in a row`;
  }

  return `Streak: ${streak} ${streak === 1 ? 'week' : 'weeks'} in a row`;
};

export default function TargetsScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [targets, setTargets] = useState<Target[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState<number | null>(null);

  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [goalValue, setGoalValue] = useState('');

  const sortedHabits = useMemo(
    () => [...habits].sort((a, b) => a.name.localeCompare(b.name)),
    [habits]
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const targetResults = await db.select().from(targetsTable);
      const habitResults = await db.select().from(habitsTable);
      const categoryResults = await db.select().from(categoriesTable);
      const logResults = await db.select().from(habitLogsTable);

      setTargets(targetResults);
      setHabits(habitResults);
      setCategories(categoryResults);
      setLogs(logResults);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not load targets');
    }
  };

  const resetForm = () => {
    setSelectedHabitId(null);
    setPeriod('weekly');
    setGoalValue('');
    setEditingTargetId(null);
    setShowForm(false);
  };

  const getHabit = (habitId: number | null) => {
    if (!habitId) return null;
    return habits.find(habit => habit.id === habitId) ?? null;
  };

  const getCategory = (categoryId: number | null) => {
    if (!categoryId) return null;
    return categories.find(category => category.id === categoryId) ?? null;
  };

  const getHabitCategory = (habitId: number | null) => {
    const habit = getHabit(habitId);
    if (!habit) return null;
    return getCategory(habit.categoryId);
  };

  const getLogsForHabit = (habitId: number | null) => {
    if (!habitId) return [];
    return logs.filter(log => log.habitId === habitId);
  };
// Progress is based on logs in the current target period only
  const getProgressForTarget = (target: Target) => {
    const logsForHabit = getLogsForHabit(target.habitId);
    const range = getRangeForPeriod(target.period, 0);

    return logsForHabit.filter(
      log => log.date >= range.start && log.date <= range.end
    ).length;
  };
// A streak only counts when the full goal is met in consecutive periods
  const getStreakForTarget = (target: Target) => {
    const logsForHabit = getLogsForHabit(target.habitId);

    if (logsForHabit.length === 0) {
      return 0;
    }

    const limit = target.period === 'monthly' ? 24 : 104;
    let streak = 0;

    for (let back = 0; back < limit; back++) {
      const range = getRangeForPeriod(target.period, back);

      const count = logsForHabit.filter(
        log => log.date >= range.start && log.date <= range.end
      ).length;

      if (count >= target.goalValue) {
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  };

  const handleSave = async () => {
    if (!selectedHabitId) {
      Alert.alert('Missing habit', 'Choose a habit first');
      return;
    }

    const parsedGoal = Number(goalValue);

    if (Number.isNaN(parsedGoal) || parsedGoal < 1) {
      Alert.alert('Invalid goal', 'Goal must be 1 or more');
      return;
    }

    try {
      const selectedHabit = habits.find(habit => habit.id === selectedHabitId);

      if (!selectedHabit) {
        Alert.alert('Missing habit', 'Selected habit could not be found');
        return;
      }

      if (editingTargetId) {
        await db
          .update(targetsTable)
          .set({
            habitId: selectedHabitId,
            categoryId: selectedHabit.categoryId,
            period,
            goalValue: parsedGoal,
          })
          .where(eq(targetsTable.id, editingTargetId));
      } else {
        await db.insert(targetsTable).values({
          habitId: selectedHabitId,
          categoryId: selectedHabit.categoryId,
          period,
          goalValue: parsedGoal,
          createdAt: new Date().toISOString(),
        });
      }

      await loadData();
      resetForm();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save target');
    }
  };

  const handleEdit = (target: Target) => {
    setSelectedHabitId(target.habitId);
    setPeriod(target.period === 'monthly' ? 'monthly' : 'weekly');
    setGoalValue(String(target.goalValue));
    setEditingTargetId(target.id);
    setShowForm(true);
  };

  const handleDelete = (targetId: number) => {
    Alert.alert('Delete target', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.delete(targetsTable).where(eq(targetsTable.id, targetId));
            await loadData();
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not delete target');
          }
        },
      },
    ]);
  };

  const TargetCard = ({ target }: { target: Target }) => {
    const progress = getProgressForTarget(target);
    const streak = getStreakForTarget(target);

    const habit = getHabit(target.habitId);
    const category = getHabitCategory(target.habitId);

    const remaining = Math.max(target.goalValue - progress, 0);
    const exceeded = Math.max(progress - target.goalValue, 0);
    const met = progress >= target.goalValue;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            <View
              style={[
                styles.dot,
                { backgroundColor: category?.colour ?? '#7c927d' },
              ]}
            />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{habit?.name ?? 'Unknown habit'}</Text>
              <Text style={styles.cardMeta}>
                {(category?.name ?? 'No category') + ' · ' + target.period}
              </Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => handleEdit(target)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(target.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <Text style={styles.progressMain}>
            {progress} / {target.goalValue}
          </Text>

          {met ? (
            exceeded > 0 ? (
              <Text style={styles.goodText}>Exceeded by {exceeded}</Text>
            ) : (
              <Text style={styles.goodText}>Target met</Text>
            )
          ) : (
            <Text style={styles.warningText}>{remaining} remaining</Text>
          )}

          <Text style={styles.streakText}>{getStreakLabel(streak, target.period)}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Targets</Text>
      <Text style={styles.subheading}>Set goals and track your progress</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Current targets</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Text style={styles.actionButtonText}>Add target</Text>
        </TouchableOpacity>
      </View>

      {showForm ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>
            {editingTargetId ? 'Edit target' : 'New target'}
          </Text>

          <Text style={styles.label}>Choose habit</Text>
          <View style={styles.selectorWrap}>
            {sortedHabits.map(habit => {
              const category = getCategory(habit.categoryId);
              const active = selectedHabitId === habit.id;

              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[
                    styles.selectorChip,
                    active && styles.selectorChipActive,
                  ]}
                  onPress={() => setSelectedHabitId(habit.id)}
                >
                  <View
                    style={[
                      styles.selectorDot,
                      { backgroundColor: category?.colour ?? '#7c927d' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.selectorText,
                      active && styles.selectorTextActive,
                    ]}
                  >
                    {habit.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Period</Text>
          <View style={styles.periodRow}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                period === 'weekly' && styles.periodButtonActive,
              ]}
              onPress={() => setPeriod('weekly')}
            >
              <Text
                style={[
                  styles.periodText,
                  period === 'weekly' && styles.periodTextActive,
                ]}
              >
                Weekly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.periodButton,
                period === 'monthly' && styles.periodButtonActive,
              ]}
              onPress={() => setPeriod('monthly')}
            >
              <Text
                style={[
                  styles.periodText,
                  period === 'monthly' && styles.periodTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
          </View>

          <FormField
            label="Goal value"
            placeholder="e.g. 3"
            value={goalValue}
            onChangeText={setGoalValue}
            keyboardType="number-pad"
          />

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {editingTargetId ? 'Save changes' : 'Save target'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {targets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No targets set yet</Text>
        </View>
      ) : (
        targets.map(target => <TargetCard key={target.id} target={target} />)
      )}
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
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '700',
    },
    actionButton: {
      backgroundColor: theme.primary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    actionButtonText: {
      color: theme.primaryText,
      fontSize: 13,
      fontWeight: '600',
    },
    panel: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    panelTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 14,
    },
    label: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 8,
    },
    selectorWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 14,
    },
    selectorChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.chipBackground,
      borderWidth: 1,
      borderColor: theme.chipBorder,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 9,
      marginRight: 8,
      marginBottom: 8,
    },
    selectorChipActive: {
      backgroundColor: theme.chipActiveBackground,
      borderColor: theme.chipActiveBorder,
    },
    selectorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },
    selectorText: {
      color: theme.textSoft,
      fontSize: 13,
      fontWeight: '500',
    },
    selectorTextActive: {
      color: theme.text,
    },
    periodRow: {
      flexDirection: 'row',
      marginBottom: 14,
    },
    periodButton: {
      backgroundColor: theme.chipBackground,
      borderWidth: 1,
      borderColor: theme.chipBorder,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginRight: 10,
    },
    periodButtonActive: {
      backgroundColor: theme.chipActiveBackground,
      borderColor: theme.chipActiveBorder,
    },
    periodText: {
      color: theme.textSoft,
      fontSize: 13,
      fontWeight: '600',
    },
    periodTextActive: {
      color: theme.text,
    },
    formActions: {
      flexDirection: 'row',
      marginTop: 4,
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
    emptyCard: {
      backgroundColor: theme.surface,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 14,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    cardInfo: {
      flexDirection: 'row',
      flex: 1,
      marginRight: 10,
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginTop: 4,
      marginRight: 12,
    },
    cardText: {
      flex: 1,
    },
    cardTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 3,
    },
    cardMeta: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    cardActions: {
      alignItems: 'flex-end',
    },
    editText: {
      color: theme.good,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 8,
    },
    deleteText: {
      color: theme.danger,
      fontSize: 13,
      fontWeight: '600',
    },
    progressBlock: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 12,
    },
    progressMain: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 6,
    },
    goodText: {
      color: theme.good,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 6,
    },
    warningText: {
      color: theme.warning,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 6,
    },
    streakText: {
      color: theme.textSoft,
      fontSize: 13,
      fontWeight: '600',
    },
  });