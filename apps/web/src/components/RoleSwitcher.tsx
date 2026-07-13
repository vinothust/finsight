import * as Select from "@radix-ui/react-select";
import { useRole, type Role } from "../context/RoleContext";

const ROLE_LABELS: Record<Role, string> = {
  pm: "Program Manager",
  account_director: "Account Director",
  area_director: "Area Director",
};

export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <Select.Root value={role} onValueChange={(value) => setRole(value as Role)}>
      <Select.Trigger aria-label="Role" className="px-3 py-2 rounded-md border border-slate-300 bg-white text-sm">
        <Select.Value>{ROLE_LABELS[role]}</Select.Value>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="bg-white border border-slate-200 rounded-md shadow-md">
          <Select.Viewport>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <Select.Item key={value} value={value} className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100">
                <Select.ItemText>{label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
