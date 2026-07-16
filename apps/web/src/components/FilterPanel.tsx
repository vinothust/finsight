import React, { useState } from 'react';
import { Filter, X, Check, ChevronsUpDown } from 'lucide-react';
import type { FilterState } from '@/types';
import type { ScopeOption } from '@/services/filterService';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableClusters: ScopeOption[];
  availableAccounts: ScopeOption[];
  availableProjects: ScopeOption[];
  availableYears: number[];
  availableMonths: string[];
}

interface Option {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ label, options, selected, onToggle }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-10 font-normal py-0 px-3"
        >
          <span className="truncate text-left flex-1">
            {selected.length === 0
              ? `Select ${label}`
              : selected.length === 1
                ? (options.find((o) => o.value === selected[0])?.label ?? selected[0])
                : `${selected.length} selected`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <CommandItem key={option.value} value={option.label} onSelect={() => onToggle(option.value)}>
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  availableClusters,
  availableAccounts,
  availableProjects,
  availableYears,
  availableMonths,
}) => {
  const toggleStringFilter = (key: 'clusters' | 'accounts' | 'projects' | 'months', value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];
    onFilterChange({ ...filters, [key]: newArray });
  };

  const toggleYearFilter = (value: number) => {
    const newArray = filters.years.includes(value)
      ? filters.years.filter((item) => item !== value)
      : [...filters.years, value];
    onFilterChange({ ...filters, years: newArray });
  };

  const clearAllFilters = () => {
    onFilterChange({ ...filters, clusters: [], accounts: [], projects: [], years: [], months: [] });
  };

  const activeFilterCount =
    filters.clusters.length + filters.accounts.length + filters.projects.length + filters.years.length + filters.months.length;

  return (
    <div className="bg-card border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-primary" />
          <h3 className="font-semibold font-display">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground hover:text-destructive">
            <X size={14} className="mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cluster</Label>
          <MultiSelectDropdown
            label="Clusters"
            options={availableClusters.map((c) => ({ value: String(c.id), label: c.name }))}
            selected={filters.clusters}
            onToggle={(val) => toggleStringFilter('clusters', val)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</Label>
          <MultiSelectDropdown
            label="Accounts"
            options={availableAccounts.map((a) => ({ value: String(a.id), label: a.name }))}
            selected={filters.accounts}
            onToggle={(val) => toggleStringFilter('accounts', val)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</Label>
          <MultiSelectDropdown
            label="Projects"
            options={availableProjects.map((p) => ({ value: String(p.id), label: p.name }))}
            selected={filters.projects}
            onToggle={(val) => toggleStringFilter('projects', val)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Year</Label>
          <MultiSelectDropdown
            label="Years"
            options={availableYears.map((y) => ({ value: String(y), label: String(y) }))}
            selected={filters.years.map(String)}
            onToggle={(val) => toggleYearFilter(Number(val))}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Month</Label>
          <MultiSelectDropdown
            label="Months"
            options={availableMonths.map((m) => ({ value: m, label: m }))}
            selected={filters.months}
            onToggle={(val) => toggleStringFilter('months', val)}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
