import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';

describe('ConfirmDeleteDialog', () => {
  it('renders the item label and calls onConfirm/onCancel', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDeleteDialog open itemLabel="Acme Cluster" isPending={false} onConfirm={onConfirm} onCancel={onCancel} />
    );

    expect(screen.getByText(/Acme Cluster/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables the delete button while pending', () => {
    render(
      <ConfirmDeleteDialog open itemLabel="Acme Cluster" isPending onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });
});
