import { ApiResponse, ApiError } from "@/types/api";
import { AuthStorage } from "./auth-storage";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    let url =
      baseUrl ||
      process.env.NEXT_PUBLIC_API_BASE_URL!;

    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    this.baseUrl = url;
  }

  private mapUserMessage(
    statusCode: number,
    rawMessage: string,
    errors?: string[],
    requiresAuth?: boolean
  ): string {
    if (errors && errors.length > 0) {
      return errors[0];
    }

    if (statusCode === 400) {
      return rawMessage || "Permintaan tidak valid.";
    }
    if (statusCode === 401) {
      if (rawMessage && rawMessage.toLowerCase().includes("inactive")) {
        return "Akun Anda dinonaktifkan. Silakan hubungi admin HRD.";
      }
      if (requiresAuth) {
        AuthStorage.clear();
        return "Sesi Anda telah kedaluwarsa. Silakan masuk kembali.";
      }
      return "Email, username, atau password salah.";
    }
    if (statusCode === 403) {
      return "Anda tidak memiliki akses ke fitur ini.";
    }
    if (statusCode === 404) {
      return "Data tidak ditemukan.";
    }
    if (statusCode === 409) {
      return rawMessage || "Data sudah terdaftar di sistem.";
    }
    if (statusCode >= 500) {
      return "Terjadi kesalahan sistem. Silakan coba lagi nanti.";
    }
    return rawMessage || "Terjadi kesalahan saat memproses permintaan.";
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { requiresAuth = false, headers = {}, ...rest } = options;

    const fullUrl = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(headers as Record<string, string>),
    };

    if (requiresAuth) {
      const token = AuthStorage.getToken();
      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(fullUrl, {
        ...rest,
        headers: requestHeaders,
      });

      let json: ApiResponse<T>;
      try {
        json = await response.json();
      } catch {
        json = {
          success: response.ok,
          message: response.statusText,
        };
      }

      if (!response.ok) {
        const userMsg = this.mapUserMessage(
          response.status,
          json.message,
          json.errors,
          requiresAuth
        );
        throw new ApiError(response.status, json.message || "Request failed", json.errors, userMsg);
      }

      return json;
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      // Network or fetch failure
      throw new ApiError(
        503,
        (err as Error).message || "Network Error",
        undefined,
        "Gagal terhubung ke server. Pastikan koneksi atau backend aktif."
      );
    }
  }

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
