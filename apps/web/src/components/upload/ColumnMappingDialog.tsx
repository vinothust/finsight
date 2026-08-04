import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export interface ColumnMappingDialogProps {
  open: boolean;
  dataset: 'financial' | 'utilization';
  sourceColumns: string[];
  suggestedMapping: Record<string, string | null>;
  onConfirm: (mapping: Record<string, string>) => void;
  onCancel: () => void;
}

const FIELD_LABELS: Record<'financial' | 'utilization', { key: string; label: string }[]> = {
  financial: [
    { key: 'account_name', label: 'Account Name' },
    { key: 'program_name', label: 'Project Name' },
    { key: 'period', label: 'Period' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'cost', label: 'Cost' },
  ],
  utilization: [
    { key: 'program_name', label: 'Project Name' },
    { key: 'resource_name', label: 'Resource Name' },
    { key: 'period', label: 'Period' },
    { key: 'allocation_pct', label: 'Allocation %' },
    { key: 'on_bench', label: 'On Bench' },
  ],
};

export function ColumnMappingDialog({
  open,
  dataset,
  sourceColumns,
  suggestedMapping,
  onConfirm,
  onCancel,
}: ColumnMappingDialogProps) {
  const fields = FIELD_LABELS[dataset];
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      const suggested = suggestedMapping[field.key];
      if (suggested) initial[field.key] = suggested;
    }
    return initial;
  });

  const allMapped = fields.every((field) => Boolean(mapping[field.key]));

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Column Mapping</DialogTitle>
          <DialogDescription>
            We couldn't match every column automatically. Map each required field to a column from your file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <Select
                value={mapping[field.key] ?? undefined}
                onValueChange={(value) => setMapping((prev) => ({ ...prev, [field.key]: value }))}
              >
                <SelectTrigger aria-label={field.label}>
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  {sourceColumns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(mapping)} disabled={!allMapped}>
            Confirm Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
