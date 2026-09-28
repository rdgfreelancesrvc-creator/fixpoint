export const profileRoles = ["admin", "staff", "technician"] as const;

export type ProfileRole = (typeof profileRoles)[number];

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function isProfileRole(role: string): role is ProfileRole {
  return profileRoles.includes(role as ProfileRole);
}

export function getRolePath(role: ProfileRole) {
  return `/app/${role}`;
}
