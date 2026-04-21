import { db } from './client';
import { categories, habitLogs, habits, targets } from './schema';

export async function seedIfEmpty() {
  const existingCategories = await db.select().from(categories);
  if (existingCategories.length > 0) return;

  await db.insert(categories).values({ name: 'Practice', colour: '#2d6a4f' });
  await db.insert(categories).values({ name: 'Short Game', colour: '#52b788' });
  await db.insert(categories).values({ name: 'Course Play', colour: '#1b4332' });
  await db.insert(categories).values({ name: 'Fitness', colour: '#74c69d' });
  await db.insert(categories).values({ name: 'Mental Game', colour: '#40916c' });

  const cats = await db.select().from(categories);
  const practice = cats.find(c => c.name === 'Practice')!;
  const shortGame = cats.find(c => c.name === 'Short Game')!;
  const coursePlay = cats.find(c => c.name === 'Course Play')!;
  const fitness = cats.find(c => c.name === 'Fitness')!;
  const mental = cats.find(c => c.name === 'Mental Game')!;

  await db.insert(habits).values({ name: 'Range Session', categoryId: practice.id, createdAt: '2026-04-01T09:00:00' });
  await db.insert(habits).values({ name: 'Putting Practice', categoryId: shortGame.id, createdAt: '2026-04-01T09:00:00' });
  await db.insert(habits).values({ name: 'Chipping Drills', categoryId: shortGame.id, createdAt: '2026-04-01T09:00:00' });
  await db.insert(habits).values({ name: 'Play 18 Holes', categoryId: coursePlay.id, createdAt: '2026-04-01T09:00:00' });
  await db.insert(habits).values({ name: 'Gym Workout', categoryId: fitness.id, createdAt: '2026-04-01T09:00:00' });
  await db.insert(habits).values({ name: 'Visualisation', categoryId: mental.id, createdAt: '2026-04-01T09:00:00' });

  const allHabits = await db.select().from(habits);
  const rangeHabit = allHabits.find(h => h.name === 'Range Session')!;
  const puttingHabit = allHabits.find(h => h.name === 'Putting Practice')!;
  const play18 = allHabits.find(h => h.name === 'Play 18 Holes')!;
  const gymHabit = allHabits.find(h => h.name === 'Gym Workout')!;

  await db.insert(habitLogs).values({ habitId: rangeHabit.id, date: '2026-04-01', count: 1, duration: 60, notes: 'driver was pulling left, slowed down backswing helped', createdAt: '2026-04-01T09:00:00' });
  await db.insert(habitLogs).values({ habitId: puttingHabit.id, date: '2026-04-02', count: 1, duration: 45, notes: 'lag putting felt good, short ones still shaky', createdAt: '2026-04-02T10:00:00' });
  await db.insert(habitLogs).values({ habitId: play18.id, date: '2026-04-05', count: 1, duration: 240, notes: 'played fota, lost it on the back 9 as usual', score: 86, createdAt: '2026-04-05T08:00:00' });
  await db.insert(habitLogs).values({ habitId: gymHabit.id, date: '2026-04-07', count: 1, duration: 50, notes: 'hip rotation and core work', createdAt: '2026-04-07T07:30:00' });
  await db.insert(habitLogs).values({ habitId: rangeHabit.id, date: '2026-04-09', count: 1, duration: 75, notes: '7 iron was flushing, best range session in a while', createdAt: '2026-04-09T09:30:00' });
  await db.insert(habitLogs).values({ habitId: play18.id, date: '2026-04-12', count: 1, duration: 210, notes: 'shot 83, fairways were soft after the rain', score: 83, createdAt: '2026-04-12T08:00:00' });

  await db.insert(targets).values({ habitId: rangeHabit.id, period: 'weekly', goalValue: 3, createdAt: '2026-04-01T00:00:00' });
  await db.insert(targets).values({ habitId: play18.id, period: 'monthly', goalValue: 4, createdAt: '2026-04-01T00:00:00' });
  await db.insert(targets).values({ habitId: gymHabit.id, period: 'weekly', goalValue: 2, createdAt: '2026-04-01T00:00:00' });
}