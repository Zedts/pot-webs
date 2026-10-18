export type UserRole =
  | 'owner'
  | 'admin'
  | 'spg'
  | 'produksi'
  | 'viar'
  | 'unassigned'
  | string;

export interface UserModel {
  id: string;
  nama: string;
  username: string;
  email: string;
  role: UserRole;
  lapak_id?: string | null;
  shift?: 'pagi' | 'siang' | null;
  no_hp: string;
  status: string;
  authProvider: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function getUserDisplayName(user?: UserModel | null): string {
  if (!user) return 'Pengguna';
  if (user.nama?.trim()) return user.nama.trim();
  if (user.username?.trim()) return user.username.trim();
  if (user.email?.trim()) return user.email.trim();
  return 'Pengguna';
}

export function getUserInitials(user?: UserModel | null): string {
  const name = getUserDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'P';
  if (parts.length === 1) {
    const single = parts[0];
    return single.length === 1 ? single.toUpperCase() : single.slice(0, 2).toUpperCase();
  }
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function isUserActive(user?: UserModel | null): boolean {
  return user?.status?.toLowerCase() === 'active';
}

export function isAdminOrOwner(user?: UserModel | null): boolean {
  if (!user || !user.role) return false;
  const normalized = user.role.toLowerCase().trim();
  return normalized === 'admin' || normalized === 'owner';
}

export interface UpdateUserPayload {
  nama?: string;
  username?: string;
  email?: string;
  role?: string;
  lapak_id?: string | null;
  shift?: string | null;
  no_hp?: string;
  password?: string;
  status?: string;
}

export interface UserSummaryMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  unassignedRolesCount: number;
  noLapakCount: number;
  noShiftCount: number;
}

export interface UserFilterState {
  searchTerm: string;
  role: string;
  shift: string;
  lapakId: string;
  status: string;
}
