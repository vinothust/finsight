import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { userAdmin } from '@/services/adminService';
import type { AdminUserItem } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface UserMultiSelectProps {
  label: string;
  selected: number[];
  onChange: (selected: number[]) => void;
}

export function UserMultiSelect({ label, selected, onChange }: UserMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<AdminUserItem[]>([]);

  useEffect(() => {
    userAdmin.list({ page_size: 200 }).then((res) => setUsers(res.users));
  }, []);

  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-10 font-normal">
          <span className="truncate text-left flex-1">
            {selected.length === 0 ? `Select ${label}` : `${selected.length} selected`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label}...`} />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => {
                const isSelected = selected.includes(user.id);
                return (
                  <CommandItem key={user.id} value={user.name} onSelect={() => toggle(user.id)}>
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <Check className="h-4 w-4" />
                    </div>
                    <span>{user.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
