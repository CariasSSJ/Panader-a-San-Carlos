import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

const mockObservarUsuario = jest.fn();

jest.mock('./services/authService', () => ({
  observarUsuario: (...args) => mockObservarUsuario(...args),
  cerrarSesion: jest.fn(),
  iniciarSesion: jest.fn(),
  obtenerRolUsuario: jest.fn()
}));

test('solicita autenticación antes de mostrar el portal', () => {
  mockObservarUsuario.mockImplementation((callback) => {
    callback(null);
    return jest.fn();
  });

  render(<App />);
  expect(screen.getByRole('heading', { name: /acceso de empleados/i })).toBeInTheDocument();
  expect(screen.queryByText(/PORTAL SUCURSALES/i)).not.toBeInTheDocument();
});

test('abre el login gerencial desde Producción sin cambiar la vista del empleado', () => {
  mockObservarUsuario.mockImplementation((callback) => {
    callback({ user: { email: 'empleado@panaderia.com' }, role: 'empleado' });
    return jest.fn();
  });

  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /producción/i }));

  expect(screen.getByRole('heading', { name: /acceso de gerencia \/ producción/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

  expect(screen.getByText(/PORTAL SUCURSALES/i)).toBeInTheDocument();
});
