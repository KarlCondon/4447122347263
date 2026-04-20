import { db } from './client';
import { categories, sessions, targets } from './schema';

export async function seedIfEmpty() {
  const existingCategories = await db.select().from(categories);
  if (existingCategories.length > 0) return;

  await db.insert(categories).values([
    { name: 'Range Practice', colour: '#2d6a4f' },
    { name: 'Short Game', colour: '#52b788' },
    { name: 'Course Play', colour: '#1b4332' },
    { name: 'Fitness', colour: '#74c69d' },
    { name: 'Mental Game', colour: '#40916c' },
  ]);

  const cats = await db.select().from(categories);
  const range = cats.find(c => c.name === 'Range Practice')!;
  const short = cats.find(c => c.name === 'Short Game')!;
  const course = cats.find(c => c.name === 'Course Play')!;
  const fitness = cats.find(c => c.name === 'Fitness')!;

  await db.insert(sessions).values([
    { categoryId: range.id, date: '01/04/2026', duration: 60, notes: 'Driver was all over the place, need to slow down the backswing', holesPlayed: null, score: null, createdAt: '2026-04-01T09:00:00' },
    { categoryId: short.id, date: '02/04/2026', duration: 45, notes: 'Putting felt very good today, chipping still inconsistent from tight lies', holesPlayed: null, score: null, createdAt: '2026-04-02T10:00:00' },
    { categoryId: course.id, date: '05/04/2026', duration: 240, notes: 'Played Fota, started well then fell apart on the back 9', holesPlayed: 18, score: 86, createdAt: '2026-04-05T08:00:00' },
    { categoryId: fitness.id, date: '07/04/2026', duration: 50, notes: 'Focused on hip rotation and core, my shoulders felt tight', holesPlayed: null, score: null, createdAt: '2026-04-07T07:30:00' },
    { categoryId: range.id, date: '09/04/2026', duration: 75, notes: 'Much better with the irons today, 7 iron was good', holesPlayed: null, score: null, createdAt: '2026-04-09T09:30:00' },
    { categoryId: course.id, date: '12/04/2026', duration: 210, notes: 'Shot 83, which was my best round in a while, fairways were soft after the rain', holesPlayed: 18, score: 83, createdAt: '2026-04-12T08:00:00' },
  ]);

  await db.insert(targets).values([
    { categoryId: range.id, period: 'weekly', goalValue: 3, createdAt: '2026-04-01T00:00:00' },
    { categoryId: course.id, period: 'monthly', goalValue: 4, createdAt: '2026-04-01T00:00:00' },
    { categoryId: fitness.id, period: 'weekly', goalValue: 2, createdAt: '2026-04-01T00:00:00' },
  ]);
}