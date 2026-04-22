import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
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