import { Pencil, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export interface EntityColumn<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
}

export interface EntityTableProps<T> {
  columns: EntityColumn<T>[];
  rows: T[];
  isLoading: boolean;
  getRowId: (row: T) => string | number;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  emptyMessage: string;
}

export function EntityTable<T>({ columns, rows, isLoading, getRowId, onEdit, onDelete, emptyMessage }: EntityTableProps<T>) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={getRowId(row)}>
              {columns.map((col) => (
                <TableCell key={col.key}>{col.render(row)}</TableCell>
              ))}
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => onEdit(row)}>
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => onDelete(row)}>
                  <Trash2 size={16} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!isLoading && rows.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">{emptyMessage}</div>
      )}
    </div>
  );
}
