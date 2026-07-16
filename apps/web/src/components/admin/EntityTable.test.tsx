import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EntityTable } from './EntityTable';

interface Row {
  id: number;
  name: string;
}

describe('EntityTable', () => {
  const columns = [{ key: 'name', label: 'Name', render: (row: Row) => row.name }];

  it('renders rows and calls onEdit/onDelete', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(
      <EntityTable
        columns={columns}
        rows={[{ id: 1, name: 'Acme' }]}
        isLoading={false}
        getRowId={(row) => row.id}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyMessage="No rows"
      />
    );

    expect(screen.getByText('Acme')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith({ id: 1, name: 'Acme' });
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith({ id: 1, name: 'Acme' });
  });

  it('shows the empty message when rows is empty and not loading', () => {
    render(
      <EntityTable
        columns={columns}
        rows={[]}
        isLoading={false}
        getRowId={(row) => row.id}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        emptyMessage="No rows"
      />
    );
    expect(screen.getByText('No rows')).toBeInTheDocument();
  });
});
