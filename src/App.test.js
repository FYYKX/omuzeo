import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

it('renders pettamo homepage', () => {
  render(<App />);
  const testElement = screen.getByText(/Pettamo home/i);
  expect(testElement).toBeInTheDocument();
});
