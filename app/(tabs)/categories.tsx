import { eq } from 'drizzle-orm';
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

const colourOptions = [
  '#2d6a4f',
  '#52b788',
  '#1b4332',
  '#74c69d',
  '#40916c',
  '#95d5b2',
];

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);

  const [categoryName, setCategoryName] = useState('');
  const [selectedColour, setSelectedColour] = useState(colourOptions[0]);

  const [habitName, setHabitName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

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
      Alert.alert('Error', 'Could not load categories and habits');
    }
  };

  const resetCategoryForm = () => {
    setCategoryName('');
    setSelectedColour(colourOptions[0]);
    setEditingCategoryId(null);
    setShowCategoryForm(false);
  };

  const resetHabitForm = () => {
    setHabitName('');
    setSelectedCategoryId(null);
    setEditingHabitId(null);
    setShowHabitForm(false);
  };

  const handleSaveCategory = async () => {
    const trimmedName = categoryName.trim();

    if (!trimmedName) {
      Alert.alert('Missing name', 'Enter a category name');
      return;
    }

    try {
      if (editingCategoryId) {
        await db
          .update(categoriesTable)
          .set({
            name: trimmedName,
            colour: selectedColour,
          })
          .where(eq(categoriesTable.id, editingCategoryId));
      } else {
        await db.insert(categoriesTable).values({
          name: trimmedName,
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

  const handleEditCategory = (category: Category) => {
    setCategoryName(category.name);
    setSelectedColour(category.colour);
    setEditingCategoryId(category.id);
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    const linkedHabits = habits.filter(habit => habit.categoryId === categoryId);

    if (linkedHabits.length > 0) {
      Alert.alert(
        'Category in use',
        'Move or delete the habits in this category first'
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
    const trimmedName = habitName.trim();

    if (!trimmedName) {
      Alert.alert('Missing name', 'Enter a habit name');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('Missing category', 'Choose a category for the habit');
      return;
    }

    try {
      if (editingHabitId) {
        await db
          .update(habitsTable)
          .set({
            name: trimmedName,
            categoryId: selectedCategoryId,
          })
          .where(eq(habitsTable.id, editingHabitId));
      } else {
        await db.insert(habitsTable).values({
          name: trimmedName,
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

  const handleEditHabit = (habit: Habit) => {
    setHabitName(habit.name);
    setSelectedCategoryId(habit.categoryId);
    setEditingHabitId(habit.id);
    setShowHabitForm(true);
  };

  const handleDeleteHabit = async (habitId: number) => {
    try {
      const existingLogs = await db
        .select()
        .from(habitLogsTable)
        .where(eq(habitLogsTable.habitId, habitId));

      if (existingLogs.length > 0) {
        Alert.alert(
          'Habit has logs',
          'Delete the related activity logs first'
        );
        return;
      }

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
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not check habit logs');
    }
  };

  const getCategoryName = (categoryId: number) => {
    const match = categories.find(category => category.id === categoryId);
    return match?.name ?? 'Unknown';
  };

  const getCategoryColour = (categoryId: number) => {
    const match = categories.find(category => category.id === categoryId);
    return match?.colour ?? '#7c927d';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Categories</Text>
      <Text style={styles.subheading}>Organise your golf habits properly</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Category list</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            resetCategoryForm();
            setShowCategoryForm(true);
          }}
        >
          <Text style={styles.actionButtonText}>Add category</Text>
        </TouchableOpacity>
      </View>

      {showCategoryForm ? (
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

          <Text style={styles.label}>Choose colour</Text>
          <View style={styles.colourRow}>
            {colourOptions.map(colour => {
              const active = selectedColour === colour;

              return (
                <TouchableOpacity
                  key={colour}
                  style={[
                    styles.colourChip,
                    { backgroundColor: colour },
                    active && styles.colourChipActive,
                  ]}
                  onPress={() => setSelectedColour(colour)}
                />
              );
            })}
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveCategory}>
              <Text style={styles.saveButtonText}>
                {editingCategoryId ? 'Save changes' : 'Save category'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={resetCategoryForm}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {sortedCategories.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No categories yet</Text>
        </View>
      ) : (
        sortedCategories.map(category => (
          <View key={category.id} style={styles.card}>
            <View style={styles.cardMain}>
              <View
                style={[styles.dot, { backgroundColor: category.colour }]}
              />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{category.name}</Text>
                <Text style={styles.cardMeta}>Colour selected</Text>
              </View>
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

      <View style={[styles.sectionHeader, styles.spacedSection]}>
        <Text style={styles.sectionTitle}>Habits</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            resetHabitForm();
            setShowHabitForm(true);
          }}
        >
          <Text style={styles.actionButtonText}>Add habit</Text>
        </TouchableOpacity>
      </View>

      {showHabitForm ? (
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

          <Text style={styles.label}>Assign category</Text>
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
                    style={[styles.selectorDot, { backgroundColor: category.colour }]}
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

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveHabit}>
              <Text style={styles.saveButtonText}>
                {editingHabitId ? 'Save changes' : 'Save habit'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={resetHabitForm}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {sortedHabits.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No habits yet</Text>
        </View>
      ) : (
        sortedHabits.map(habit => (
          <View key={habit.id} style={styles.card}>
            <View style={styles.cardMain}>
              <View
                style={[styles.dot, { backgroundColor: getCategoryColour(habit.categoryId) }]}
              />
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{habit.name}</Text>
                <Text style={styles.cardMeta}>{getCategoryName(habit.categoryId)}</Text>
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
        ))
      )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  spacedSection: {
    marginTop: 28,
  },
  sectionTitle: {
    color: '#dce8dc',
    fontSize: 20,
    fontWeight: '700',
  },
  actionButton: {
    backgroundColor: '#1c5f27',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionButtonText: {
    color: '#eef6ee',
    fontSize: 13,
    fontWeight: '600',
  },
  panel: {
    backgroundColor: '#102d12',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f4824',
  },
  panelTitle: {
    color: '#eef6ee',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  label: {
    color: '#dce8dc',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  colourRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  colourChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colourChipActive: {
    borderColor: '#eef6ee',
  },
  selectorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  selectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#173a19',
    borderWidth: 1,
    borderColor: '#244d27',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },
  selectorChipActive: {
    backgroundColor: '#1f5a25',
    borderColor: '#5faa65',
  },
  selectorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  selectorText: {
    color: '#b8cbb8',
    fontSize: 13,
    fontWeight: '500',
  },
  selectorTextActive: {
    color: '#eef6ee',
  },
  formActions: {
    flexDirection: 'row',
    marginTop: 4,
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
  emptyCard: {
    backgroundColor: '#102d12',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f4824',
  },
  emptyText: {
    color: '#89a589',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#102d12',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f4824',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    color: '#eef6ee',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardMeta: {
    color: '#8fb58f',
    fontSize: 14,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
  },
  editText: {
    color: '#9cd19f',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 18,
  },
  deleteText: {
    color: '#f28d8d',
    fontSize: 14,
    fontWeight: '600',
  },
});