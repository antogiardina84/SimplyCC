import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock dei componenti usati in App
vi.mock('../app/providers/AppProviders', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../app/layout/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar Mock</div>,
}));

vi.mock('../app/routes', () => ({
  default: () => <div data-testid="routes">Routes Mock</div>,
}));

describe('App', () => {
  it('renders navbar and routes', () => {
    render(<App />);
    
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('routes')).toBeInTheDocument();
  });
});