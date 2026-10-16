import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { drivers } from '@/test/fixtures';
import { DriverCombobox, filterDrivers } from './DriverCombobox';

vi.mock('./Providers', () => ({ useResolvedTheme: () => 'light' }));

describe('filterDrivers', () => {
  it('ranks exact code, then surname prefix, ignoring accents', () => {
    expect(filterDrivers(drivers, 'ham')[0].driverId).toBe('hamilton');
    expect(filterDrivers(drivers, 'perez').map((d) => d.driverId)).toEqual(['perez']);
    expect(filterDrivers(drivers, 'raikk')[0].driverId).toBe('raikkonen');
    expect(filterDrivers(drivers, 'zzz')).toEqual([]);
  });
});

describe('DriverCombobox', () => {
  it('is fully keyboard operable', async () => {
    const onChange = vi.fn();
    render(<DriverCombobox label="Driver A" drivers={drivers} value={null} onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Driver A' });
    await userEvent.click(input);
    await userEvent.type(input, 'ver');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')[0]).toHaveTextContent('Max Verstappen');
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('max_verstappen');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves the active option with arrow keys and closes on Escape', async () => {
    const onChange = vi.fn();
    render(<DriverCombobox label="Driver B" drivers={drivers} value={null} onChange={onChange} exclude="hamilton" />);
    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    expect(screen.queryByText('Lewis Hamilton')).not.toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}');
    const active = input.getAttribute('aria-activedescendant');
    expect(active).toBeTruthy();
    expect(document.getElementById(active!)).toHaveAttribute('role', 'option');
    await userEvent.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('tells the user when nothing matches', async () => {
    render(<DriverCombobox label="Driver A" drivers={drivers} value={null} onChange={() => {}} />);
    await userEvent.type(screen.getByRole('combobox'), 'nobody');
    expect(screen.getByText(/No drivers match/)).toBeInTheDocument();
  });
});
