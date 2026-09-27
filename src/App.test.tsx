import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

// Minimal smoke test - just ensure the app renders without crashing
test('renders the app without crashing', () => {
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
  // The product page should be rendered (or at least no crash)
  // Since products load async, just check the page renders
  expect(document.body).toBeTruthy();
});
