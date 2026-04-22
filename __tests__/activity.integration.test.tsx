import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

const mockCategories = [
  { id: 1, name: 'Practice', colour: '#2d6a4f' },
  { id: 2, name: 'Short Game', colour: '#52b788' },
];

const mockHabits = [
  { id: 1, name: 'Range Session', categoryId: 1, createdAt: '2026-04-01T09:00:00' },
  { id: 2, name: 'Putting Practice', categoryId: 2, createdAt: '2026-04-01T09:00:00' },
];

const mockLogs = [
  {
    id: 1,
    habitId: 1,
    date: '2026-04-01',
    count: 1,
    duration: 60,
    notes: 'driver was pulling left, slowed down backswing helped',
    score: null,
    createdAt: '2026-04-01T09:00:00',
  },
  {
    id: 2,
    habitId: 2,
    date: '2026-04-02',
    count: 1,
    duration: 45,
    notes: 'lag putting felt good, short ones still shaky',
    score: null,
    createdAt: '2026-04-02T10:00:00',
  },
];

jest.mock('../db/client', () => {
  const schema = require('../db/schema');

  return {
    db: {
      select: () => ({
        from: async (table: unknown) => {
          if (table === schema.categories) return mockCategories;
          if (table === schema.habits) return mockHabits;
          if (table === schema.habitLogs) return mockLogs;
          return [];
        },
      }),
      delete: () => ({
        where: async () => undefined,
      }),
    },
  };
});

jest.mock('@react-navigation/native', () => {
  const React = require('react');

  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(() => {
        const cleanup = callback();
        return cleanup;
      }, [callback]);
    },
  };
});

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

const ActivityScreen = require('../app/(tabs)/index').default;

describe('ActivityScreen integration', () => {
  it('shows seeded activity data on the main list screen', async () => {
    render(<ActivityScreen />);

    await waitFor(() => {
      expect(screen.getByText('Range Session')).toBeTruthy();
    });

    expect(screen.getAllByText('Practice').length).toBeGreaterThan(0);
    expect(screen.getByText('01/04/2026')).toBeTruthy();
    expect(
      screen.getByText('driver was pulling left, slowed down backswing helped')
    ).toBeTruthy();

    expect(screen.getByText('Putting Practice')).toBeTruthy();
    expect(screen.getAllByText('Short Game').length).toBeGreaterThan(0);
  });
});