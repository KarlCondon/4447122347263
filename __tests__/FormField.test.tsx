import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

jest.mock('../lib/theme', () => ({
  useAppTheme: () => ({
    mode: 'dark',
    theme: {
      background: '#081f08',
      surface: '#102d12',
      border: '#1f4824',
      text: '#eef6ee',
      textMuted: '#8fb58f',
      textSoft: '#b8cbb8',
      primary: '#2d7a38',
      primaryText: '#ffffff',
      secondaryButton: '#1a2b1b',
      secondaryButtonText: '#d6dfd6',
      inputBackground: '#173a19',
      inputBorder: '#244d27',
      chipBackground: '#173a19',
      chipActiveBackground: '#1f5a25',
      chipBorder: '#244d27',
      chipActiveBorder: '#5faa65',
      good: '#9cd19f',
      warning: '#f0c67a',
      danger: '#f28d8d',
      dangerBackground: '#4a1717',
    },
    toggleTheme: jest.fn(),
  }),
}));

import FormField from '../components/FormField';

describe('FormField', () => {
  it('renders the label and placeholder, and fires onChangeText', () => {
    const handleChangeText = jest.fn();

    render(
      <FormField
        label="Email"
        placeholder="Enter your email"
        value=""
        onChangeText={handleChangeText}
      />
    );

    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();

    fireEvent.changeText(
      screen.getByPlaceholderText('Enter your email'),
      'karl@example.com'
    );

    expect(handleChangeText).toHaveBeenCalledWith('karl@example.com');
  });
});