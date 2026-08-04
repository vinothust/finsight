import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ColumnMappingDialog } from './ColumnMappingDialog';

describe('ColumnMappingDialog', () => {
  it('renders one field per canonical column with the suggested mapping pre-selected', () => {
    render(
      <ColumnMappingDialog
        open
        dataset="financial"
        sourceColumns={['Account', 'Project', 'Date', 'Revenue ($)', 'Cost ($)']}
        suggestedMapping={{ account_name: 'Account', program_name: 'Project', period: 'Date', revenue: 'Revenue ($)', cost: null }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Account Name')).toBeInTheDocument();
    expect(screen.getByText('Cost')).toBeInTheDocument();
  });

  it('disables Confirm until every field has a selection, then calls onConfirm with the full mapping', () => {
    const onConfirm = vi.fn();
    render(
      <ColumnMappingDialog
        open
        dataset="financial"
        sourceColumns={['Account', 'Project', 'Date', 'Revenue ($)', 'Cost ($)']}
        suggestedMapping={{ account_name: 'Account', program_name: 'Project', period: 'Date', revenue: 'Revenue ($)', cost: null }}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /confirm mapping/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('combobox', { name: 'Cost' }));
    fireEvent.click(screen.getByText('Cost ($)'));

    expect(screen.getByRole('button', { name: /confirm mapping/i })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /confirm mapping/i }));

    expect(onConfirm).toHaveBeenCalledWith({
      account_name: 'Account',
      program_name: 'Project',
      period: 'Date',
      revenue: 'Revenue ($)',
      cost: 'Cost ($)',
    });
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ColumnMappingDialog
        open
        dataset="financial"
        sourceColumns={['Account']}
        suggestedMapping={{}}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
