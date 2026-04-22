import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
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

type CategoryBar = {
  name: string;
  colour: string;
  total: number;
};

const toDateKey = (date: Date) => date.toISOString().split('T')[0];

const getTodayKey = () => toDateKey(new Date());

const getWeekRange = () => {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const start = new Date(today);
  start.setDate(today.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: toDateKey(start),
    end: toDateKey(end),
  };
};

const getMonthRange = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    start: toDateKey(start),
    end: toDateKey(end),
  };
};

export default function InsightsScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const categoryResults = await db.select().from(categoriesTable);
    const habitResults = await db.select().from(habitsTable);
    const logResults = await db.select().from(habitLogsTable);

    setCategories(categoryResults);
    setHabits(habitResults);
    setLogs(logResults);
  };

  const todayKey = getTodayKey();
  const weekRange = getWeekRange();
  const monthRange = getMonthRange();

  const dailyLogs = useMemo(
    () => logs.filter(log => log.date === todayKey),
    [logs, todayKey]
  );

  const weeklyLogs = useMemo(
    () => logs.filter(log => log.date >= weekRange.start && log.date <= weekRange.end),
    [logs, weekRange.start, weekRange.end]
  );

  const monthlyLogs = useMemo(
    () => logs.filter(log => log.date >= monthRange.start && log.date <= monthRange.end),
    [logs, monthRange.start, monthRange.end]
  );

  const weeklyMinutes = useMemo(
    () => weeklyLogs.reduce((sum, log) => sum + (log.duration ?? 0), 0),
    [weeklyLogs]
  );

  const monthlyMinutes = useMemo(
    () => monthlyLogs.reduce((sum, log) => sum + (log.duration ?? 0), 0),
    [monthlyLogs]
  );
// Build the weekly category totals used by the chart on the insights screen
  const categoryBars = useMemo(() => {
    const totals = new Map<number, number>();

    weeklyLogs.forEach(log => {
      const habit = habits.find(item => item.id === log.habitId);
      if (!habit) return;

      const current = totals.get(habit.categoryId) ?? 0;
      totals.set(habit.categoryId, current + 1);
    });

    const bars: CategoryBar[] = categories
      .map(category => ({
        name: category.name,
        colour: category.colour,
        total: totals.get(category.id) ?? 0,
      }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);

    return bars;
  }, [weeklyLogs, habits, categories]);

  const topCategory = useMemo(() => {
    if (categoryBars.length === 0) return 'No data yet';
    return categoryBars[0].name;
  }, [categoryBars]);

  const maxBarValue = useMemo(() => {
    if (categoryBars.length === 0) return 1;
    return Math.max(...categoryBars.map(item => item.total));
  }, [categoryBars]);
// Quick summary cards for daily, weekly and monthly activity
  const summaryCards = [
    {
      label: 'Today',
      value: String(dailyLogs.length),
      note: 'logs recorded',
    },
    {
      label: 'This week',
      value: String(weeklyLogs.length),
      note: `${weeklyMinutes} mins logged`,
    },
    {
      label: 'This month',
      value: String(monthlyLogs.length),
      note: `${monthlyMinutes} mins logged`,
    },
    {
      label: 'Top category',
      value: topCategory,
      note: 'current week',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Insights</Text>
      <Text style={styles.subheading}>A quick view of how your habits are going</Text>

      <View style={styles.summaryGrid}>
        {summaryCards.map(card => (
          <View key={card.label} style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{card.label}</Text>
            <Text style={styles.summaryValue}>{card.value}</Text>
            <Text style={styles.summaryNote}>{card.note}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Weekly activity by category</Text>
        <Text style={styles.panelSubtitle}>
          Number of logs recorded in the current week
        </Text>

        {categoryBars.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No weekly activity yet</Text>
          </View>
        ) : (
          categoryBars.map(item => (
            <View key={item.name} style={styles.barRow}>
              <View style={styles.barHeader}>
                <View style={styles.barTitleWrap}>
                  <View
                    style={[styles.dot, { backgroundColor: item.colour }]}
                  />
                  <Text style={styles.barLabel}>{item.name}</Text>
                </View>
                <Text style={styles.barValue}>{item.total}</Text>
              </View>

              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: item.colour,
                      width: `${(item.total / maxBarValue) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Period breakdown</Text>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Daily logs</Text>
          <Text style={styles.breakdownValue}>{dailyLogs.length}</Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Weekly logs</Text>
          <Text style={styles.breakdownValue}>{weeklyLogs.length}</Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Monthly logs</Text>
          <Text style={styles.breakdownValue}>{monthlyLogs.length}</Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Weekly minutes</Text>
          <Text style={styles.breakdownValue}>{weeklyMinutes}</Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Monthly minutes</Text>
          <Text style={styles.breakdownValue}>{monthlyMinutes}</Text>
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
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    summaryCard: {
      width: '48%',
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    summaryLabel: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 8,
    },
    summaryValue: {
      color: theme.text,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 6,
    },
    summaryNote: {
      color: theme.textSoft,
      fontSize: 12,
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
      marginBottom: 4,
    },
    panelSubtitle: {
      color: theme.textMuted,
      fontSize: 13,
      marginBottom: 16,
    },
    emptyBox: {
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      padding: 14,
    },
    emptyText: {
      color: theme.textMuted,
      fontSize: 14,
    },
    barRow: {
      marginBottom: 14,
    },
    barHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      alignItems: 'center',
    },
    barTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },
    barLabel: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '600',
    },
    barValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '700',
    },
    barTrack: {
      width: '100%',
      height: 12,
      backgroundColor: theme.inputBackground,
      borderRadius: 999,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 999,
    },
    breakdownRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    breakdownLabel: {
      color: theme.text,
      fontSize: 14,
    },
    breakdownValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '700',
    },
  });