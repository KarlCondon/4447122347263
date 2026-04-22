import { useFocusEffect } from '@react-navigation/native';
import { eq } from 'drizzle-orm';
import { useCallback, useMemo, useRef, useState } from 'react';
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
// Kept to a small choice of greens to match golfer style for a cleaner category look
const colourOptions = [
  '#1b4332',
  '#2d6a4f',
  '#40916c',
  '#52b788',
  '#74c69d',
  '#588157',
];

export default function CategoriesScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const scrollRef = useRef<ScrollView>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  const [categoryName, setCategoryName] = useState('');
  const [selectedColour, setSelectedColour] = useState(colourOptions[0]);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const [habitName, setHabitName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const sortedHabits = useMemo(
    () =>
      [...habits].sort((a, b) => {
        const categoryA =
          categories.find(category => category.id === a.categoryId)?.name ?? '';
        const categoryB =
          categories.find(category => category.id === b.categoryId)?.name ?? '';

        if (categoryA !== categoryB) {
          return categoryA.localeCompare(categoryB);
        }

        return a.name.localeCompare(b.name);
      }),
    [habits, categories]
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const categoryResults = await db.select().from(categoriesTable);
      const habitResults = await db.select().from(habitsTable);

      setCategories(categoryResults);
      setHabits(habitResults);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not load categories and habits');
    }
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setSelectedColour(colourOptions[0]);
    setEditingCategoryId(null);
  };

  const resetHabitForm = () => {
    setHabitName('');
    setSelectedCategoryId(null);
    setEditingHabitId(null);
  };

  const getCategory = (categoryId: number) => {
    return categories.find(category => category.id === categoryId) ?? null;
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Missing name', 'Enter a category name');
      return;
    }

    try {
      if (editingCategoryId) {
        await db
          .update(categoriesTable)
          .set({
            name: categoryName.trim(),
            colour: selectedColour,
          })
          .where(eq(categoriesTable.id, editingCategoryId));
      } else {
        await db.insert(categoriesTable).values({
          name: categoryName.trim(),
          colour: selectedColour,
        });
      }

      await loadData();
      resetCategoryForm();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save category');
    }
  };
// Scroll back to the category form at the top so edits are obvious to the user
  const handleEditCategory = (category: Category) => {
    setCategoryName(category.name);
    setSelectedColour(category.colour);
    setEditingCategoryId(category.id);

    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleDeleteCategory = (categoryId: number) => {
    const linkedHabits = habits.filter(habit => habit.categoryId === categoryId);

    if (linkedHabits.length > 0) {
      Alert.alert(
        'Category in use',
        'Delete or move the habits in this category first'
      );
      return;
    }

    Alert.alert('Delete category', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.delete(categoriesTable).where(eq(categoriesTable.id, categoryId));
            await loadData();
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not delete category');
          }
        },
      },
    ]);
  };

  const handleSaveHabit = async () => {
    if (!habitName.trim()) {
      Alert.alert('Missing name', 'Enter a habit name');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('Missing category', 'Choose a category first');
      return;
    }

    try {
      if (editingHabitId) {
        await db
          .update(habitsTable)
          .set({
            name: habitName.trim(),
            categoryId: selectedCategoryId,
          })
          .where(eq(habitsTable.id, editingHabitId));
      } else {
        await db.insert(habitsTable).values({
          name: habitName.trim(),
          categoryId: selectedCategoryId,
          createdAt: new Date().toISOString(),
        });
      }

      await loadData();
      resetHabitForm();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not save habit');
    }
  };
// Scroll to the habit form when editing an existing habit
  const handleEditHabit = (habit: Habit) => {
    setHabitName(habit.name);
    setSelectedCategoryId(habit.categoryId);
    setEditingHabitId(habit.id);

    scrollRef.current?.scrollTo({ y: 260, animated: true });
  };

  const handleDeleteHabit = (habitId: number) => {
    Alert.alert('Delete habit', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.delete(habitsTable).where(eq(habitsTable.id, habitId));
            await loadData();
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not delete habit');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.heading}>Categories</Text>
      <Text style={styles.subheading}>Manage categories and habits</Text>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>
          {editingCategoryId ? 'Edit category' : 'New category'}
        </Text>

        <FormField
          label="Category name"
          placeholder="e.g. Practice"
          value={categoryName}
          onChangeText={setCategoryName}
        />

        <Text style={styles.label}>Colour</Text>
        <View style={styles.colourRow}>
          {colourOptions.map(colour => {
            const active = selectedColour === colour;

            return (
              <TouchableOpacity
                key={colour}
                style={[
                  styles.colourCircle,
                  { backgroundColor: colour },
                  active && styles.colourCircleActive,
                ]}
                onPress={() => setSelectedColour(colour)}
              />
            );
          })}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveCategory}>
            <Text style={styles.saveButtonText}>
              {editingCategoryId ? 'Save changes' : 'Save category'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={resetCategoryForm}
          >
            <Text style={styles.cancelButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>
          {editingHabitId ? 'Edit habit' : 'New habit'}
        </Text>

        <FormField
          label="Habit name"
          placeholder="e.g. Range Session"
          value={habitName}
          onChangeText={setHabitName}
        />

        <Text style={styles.label}>Choose category</Text>
        <View style={styles.selectorWrap}>
          {sortedCategories.map(category => {
            const active = selectedCategoryId === category.id;

            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.selectorChip,
                  active && styles.selectorChipActive,
                ]}
                onPress={() => setSelectedCategoryId(category.id)}
              >
                <View
                  style={[
                    styles.selectorDot,
                    { backgroundColor: category.colour },
                  ]}
                />
                <Text
                  style={[
                    styles.selectorText,
                    active && styles.selectorTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveHabit}>
            <Text style={styles.saveButtonText}>
              {editingHabitId ? 'Save changes' : 'Save habit'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={resetHabitForm}
          >
            <Text style={styles.cancelButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Current categories</Text>

        {sortedCategories.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No categories yet</Text>
          </View>
        ) : (
          sortedCategories.map(category => (
            <View key={category.id} style={styles.card}>
              <View style={styles.cardInfo}>
                <View
                  style={[styles.dot, { backgroundColor: category.colour }]}
                />
                <Text style={styles.cardTitle}>{category.name}</Text>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleEditCategory(category)}>
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteCategory(category.id)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Current habits</Text>

        {sortedHabits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No habits yet</Text>
          </View>
        ) : (
          sortedHabits.map(habit => {
            const category = getCategory(habit.categoryId);

            return (
              <View key={habit.id} style={styles.card}>
                <View style={styles.cardInfo}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: category?.colour ?? '#7c927d' },
                    ]}
                  />
                  <View>
                    <Text style={styles.cardTitle}>{habit.name}</Text>
                    <Text style={styles.cardMeta}>
                      {category?.name ?? 'Unknown category'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleEditHabit(habit)}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteHabit(habit.id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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
    colourRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 14,
    },
    colourCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginRight: 10,
      marginBottom: 10,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colourCircleActive: {
      borderColor: theme.text,
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
    actions: {
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
    listSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 12,
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    cardInfo: {
      flexDirection: 'row',
      alignItems: 'flex-start',
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
    cardTitle: {
      color: theme.text,
      fontSize: 16,
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
  });