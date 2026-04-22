import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { seedIfEmpty } from '../db/seed';

jest.mock('../db/client', () => {
  const { categories, habits, habitLogs, targets } = require('../db/schema');

  const categoryRows: any[] = [];
  const habitRows: any[] = [];
  const logRows: any[] = [];
  const targetRows: any[] = [];

  const getStore = (table: any) => {
    if (table === categories) return categoryRows;
    if (table === habits) return habitRows;
    if (table === habitLogs) return logRows;
    if (table === targets) return targetRows;
    throw new Error('Unknown table');
  };

  const db = {
    select: () => ({
      from: async (table: any) => {
        const store = getStore(table);
        return store.map(item => ({ ...item }));
      },
    }),
    insert: (table: any) => ({
      values: async (values: any) => {
        const store = getStore(table);
        const row = { ...values, id: store.length + 1 };
        store.push(row);
      },
    }),
  };

  return {
    db,
    __stores: {
      categoryRows,
      habitRows,
      logRows,
      targetRows,
    },
  };
});

const mockedClient = require('../db/client') as {
  __stores: {
    categoryRows: any[];
    habitRows: any[];
    logRows: any[];
    targetRows: any[];
  };
};

describe('seedIfEmpty', () => {
  beforeEach(() => {
    mockedClient.__stores.categoryRows.length = 0;
    mockedClient.__stores.habitRows.length = 0;
    mockedClient.__stores.logRows.length = 0;
    mockedClient.__stores.targetRows.length = 0;
  });

  it('seeds all core tables once without duplication', async () => {
    await expect(seedIfEmpty()).resolves.toBeUndefined();

    expect(mockedClient.__stores.categoryRows).toHaveLength(5);
    expect(mockedClient.__stores.habitRows).toHaveLength(6);
    expect(mockedClient.__stores.logRows).toHaveLength(6);
    expect(mockedClient.__stores.targetRows).toHaveLength(3);

    expect(mockedClient.__stores.categoryRows[0].name).toBe('Practice');
    expect(mockedClient.__stores.habitRows[0].name).toBe('Range Session');

    await expect(seedIfEmpty()).resolves.toBeUndefined();

    expect(mockedClient.__stores.categoryRows).toHaveLength(5);
    expect(mockedClient.__stores.habitRows).toHaveLength(6);
    expect(mockedClient.__stores.logRows).toHaveLength(6);
    expect(mockedClient.__stores.targetRows).toHaveLength(3);
  });
});