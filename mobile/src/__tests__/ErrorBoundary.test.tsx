import React from 'react';
import { View, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';

const Throw = (): React.JSX.Element => {
  throw new Error('Test error');
};

const Ok = (): React.JSX.Element => (
  <View>
    <Text>OK</Text>
  </View>
);

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <Throw />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Coś poszło nie tak/)).toBeTruthy();
    expect(screen.getByText(/Test error/)).toBeTruthy();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Ok />
      </ErrorBoundary>
    );
    expect(screen.getByText('OK')).toBeTruthy();
    expect(screen.queryByText(/Coś poszło nie tak/)).toBeNull();
  });

  it('shows retry button when error occurs', () => {
    render(
      <ErrorBoundary>
        <Throw />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Spróbuj ponownie/)).toBeTruthy();
  });
});
