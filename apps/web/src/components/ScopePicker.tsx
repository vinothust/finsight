import * as Select from "@radix-ui/react-select";
import { useEffect, useState } from "react";
import { useRole } from "../context/RoleContext";
import { getAccountOptions, getProgramOptions, type AccountOption, type ProgramOption } from "../lib/api";

export function ScopePicker() {
  const { role, scopeId, setScopeId } = useRole();
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);

  useEffect(() => {
    if (role === "account_director") {
      getAccountOptions().then(setAccountOptions);
    } else if (role === "pm") {
      getProgramOptions().then(setProgramOptions);
    }
  }, [role]);

  if (role === "area_director") return null;

  const options: { id: number; name: string }[] = role === "account_director" ? accountOptions : programOptions;
  const placeholder = role === "account_director" ? "Select account..." : "Select program...";

  return (
    <Select.Root
      value={scopeId != null ? String(scopeId) : undefined}
      onValueChange={(value) => setScopeId(Number(value))}
    >
      <Select.Trigger
        aria-label="Scope"
        className="px-3 py-2 rounded-md border border-slate-300 bg-white text-sm"
      >
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="bg-white border border-slate-200 rounded-md shadow-md">
          <Select.Viewport>
            {options.map((opt) => (
              <Select.Item
                key={opt.id}
                value={String(opt.id)}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100"
              >
                <Select.ItemText>{opt.name}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
