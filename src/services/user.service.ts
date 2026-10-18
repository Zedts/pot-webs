import { apiClient } from "@/lib/api-client";
import { ApiEndpoints } from "@/constants/api_endpoints";
import { UserModel, UpdateUserPayload } from "@/types/user";

export interface UserQueryFilters {
  role?: string;
  status?: string;
  lapak_id?: string;
}

class UserService {
  /**
   * GET /api/v1/users
   * Retrieve all users with optional query filtering (role, status, lapak_id)
   */
  async getAllUsers(filters?: UserQueryFilters): Promise<UserModel[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.set("role", filters.role);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.lapak_id) params.set("lapak_id", filters.lapak_id);

    const qs = params.toString();
    const endpoint = qs ? `${ApiEndpoints.users}?${qs}` : ApiEndpoints.users;

    const res = await apiClient.get<UserModel[]>(endpoint, { requiresAuth: true });
    return res.data || [];
  }

  /**
   * GET /api/v1/users/:id
   * Retrieve single user by ID
   */
  async getUserById(id: string): Promise<UserModel> {
    const res = await apiClient.get<UserModel>(`${ApiEndpoints.users}/${id}`, { requiresAuth: true });
    if (!res.data) throw new Error("Data pengguna tidak ditemukan.");
    return res.data;
  }

  /**
   * PUT /api/v1/users/:id
   * Update full user profile details
   */
  async updateUser(id: string, payload: UpdateUserPayload): Promise<UserModel> {
    const res = await apiClient.put<UserModel>(`${ApiEndpoints.users}/${id}`, payload, {
      requiresAuth: true,
    });
    if (!res.data) throw new Error("Gagal memperbarui data pengguna.");
    return res.data;
  }

  /**
   * PATCH /api/v1/users/:id/role
   * Dedicated role update operation (Admin only)
   */
  async updateUserRole(id: string, role: string): Promise<UserModel> {
    const res = await apiClient.patch<UserModel>(
      `${ApiEndpoints.users}/${id}/role`,
      { role },
      { requiresAuth: true }
    );
    if (!res.data) throw new Error("Gagal memperbarui role pengguna.");
    return res.data;
  }

  /**
   * PATCH /api/v1/users/:id/lapak
   * Dedicated lapak assignment update operation (Admin/Owner only)
   */
  async updateUserLapak(id: string, lapakId: string | null): Promise<UserModel> {
    const res = await apiClient.patch<UserModel>(
      `${ApiEndpoints.users}/${id}/lapak`,
      { lapak_id: lapakId },
      { requiresAuth: true }
    );
    if (!res.data) throw new Error("Gagal memperbarui penugasan lapak pengguna.");
    return res.data;
  }

  /**
   * PATCH /api/v1/users/:id/shift
   * Dedicated shift update operation
   */
  async updateUserShift(id: string, shift: string | null): Promise<UserModel> {
    const res = await apiClient.patch<UserModel>(
      `${ApiEndpoints.users}/${id}/shift`,
      { shift },
      { requiresAuth: true }
    );
    if (!res.data) throw new Error("Gagal memperbarui shift pengguna.");
    return res.data;
  }

  /**
   * DELETE /api/v1/users/:id
   * Delete user account with referential integrity verification
   */
  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`${ApiEndpoints.users}/${id}`, { requiresAuth: true });
  }
}

export const userService = new UserService();
