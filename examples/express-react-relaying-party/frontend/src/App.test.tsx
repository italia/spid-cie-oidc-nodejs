import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders title', () => {
  render(<App />);
  const titleElement = screen.getByText(/OIDC Relying Party/i);
  expect(titleElement).toBeInTheDocument();
});
