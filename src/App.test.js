import { render, screen } from '@testing-library/react';
import App from './App';

test('renderiza el portal de pedidos de sucursales', () => {
  render(<App />);
  expect(screen.getByText(/PORTAL SUCURSALES/i)).toBeInTheDocument();
});
