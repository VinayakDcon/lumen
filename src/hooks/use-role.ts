"use client";

import { usePmoStore } from "@/store/use-pmo-store";
import { 
  canEdit, 
  canManageProgrammes, 
  canManageTeam, 
  isReadOnly, 
  ROLE_DISPLAY 
} from "@/lib/roles";

export function useRole() {
  const user = usePmoStore((state) => state.user);
  const role = user?.role;

  return {
    role,
    roleDisplayName: role ? (ROLE_DISPLAY[role] || role) : "Guest",
    canEdit: canEdit(role),
    canManageProgrammes: canManageProgrammes(role),
    canManageTeam: canManageTeam(role),
    isReadOnly: isReadOnly(role),
  };
}
