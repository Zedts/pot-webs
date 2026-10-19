import { ApiResponse, ApiError } from "@/types/api";
import { AuthStorage } from "./auth-storage";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Sanitizes technical error messages and raw database identifiers into
 * friendly, readable Indonesian messages.
 */
function sanitizeErrorMessage(msg?: string): string {
  if (!msg || typeof msg !== "string") {
    return "Terjadi kesalahan saat memproses data.";
  }

  let text = msg.trim();

  // 1. Specific known error mappings
  if (/validation failed for create produk/i.test(text)) {
    return "Validasi data produk gagal. Silakan periksa kembali input Anda.";
  }
  if (/validation failed for update produk/i.test(text)) {
    return "Validasi pembaruan produk gagal. Silakan periksa kembali input Anda.";
  }
  if (/validation failed for create lapak/i.test(text)) {
    return "Validasi data outlet lapak gagal. Silakan periksa kelengkapan formulir.";
  }
  if (/validation failed for update lapak/i.test(text)) {
    return "Validasi pembaruan outlet lapak gagal. Silakan periksa kelengkapan formulir.";
  }
  if (/field ['"]is_active['"] must be one of/i.test(text)) {
    return "Status produk harus berupa aktif atau nonaktif.";
  }
  if (/field ['"]harga_satuan['"] must be/i.test(text)) {
    return "Harga satuan harus berupa angka nominal yang valid.";
  }
  if (/field ['"]stok_minimum['"] must be/i.test(text)) {
    return "Stok minimum harus berupa angka bulat tidak negatif.";
  }
  if (/category with name ['"].*['"] already exists/i.test(text)) {
    return "Kategori dengan nama tersebut sudah terdaftar di sistem.";
  }
  if (/unit with name ['"].*['"] already exists/i.test(text)) {
    return "Satuan dengan nama tersebut sudah terdaftar di sistem.";
  }
  if (/cannot delete category: it is currently referenced by (\d+) product/i.test(text)) {
    const match = text.match(/by (\d+) product/i);
    const count = match ? match[1] : "";
    return `Kategori tidak dapat dihapus karena masih digunakan oleh ${count} produk.`;
  }
  if (/cannot delete unit: it is currently referenced by (\d+) product/i.test(text)) {
    const match = text.match(/by (\d+) product/i);
    const count = match ? match[1] : "";
    return `Satuan tidak dapat dihapus karena masih digunakan oleh ${count} produk.`;
  }
  if (/cannot delete product: it is currently referenced by (\d+) shipment/i.test(text)) {
    return "Produk tidak dapat dihapus karena masih terhubung dengan riwayat pengiriman.";
  }
  if (/cannot delete product: it is currently referenced by (\d+) inventory/i.test(text)) {
    return "Produk tidak dapat dihapus karena masih memiliki catatan stok di lapak.";
  }
  if (/cannot delete lapak.*referenced in active shipments/i.test(text)) {
    return "Outlet lapak tidak dapat dihapus karena masih terhubung dengan pengiriman aktif.";
  }
  if (/cannot delete lapak.*active stock inventory/i.test(text)) {
    return "Outlet lapak tidak dapat dihapus karena masih memiliki inventaris stok.";
  }

  // 2. Duplicate stock tracking fallback
  if (/stock tracking for lapak .* and produk .* already exists/i.test(text)) {
    return "Pencatatan stok untuk lapak dan produk tersebut sudah terdaftar di sistem.";
  }

  // 3. Entity not found fallbacks without raw IDs
  if (/user with id .* was not found/i.test(text)) {
    return "Pengguna yang dipilih tidak ditemukan di sistem.";
  }
  if (/lapak with id .* was not found/i.test(text)) {
    return "Data outlet lapak tidak ditemukan.";
  }
  if (/produk with id .* was not found/i.test(text)) {
    return "Data produk tidak ditemukan.";
  }
  if (/stock record with id .* was not found/i.test(text)) {
    return "Data pencatatan stok lapak tidak ditemukan.";
  }

  // 4. Scrub raw alphanumeric database IDs (15+ chars)
  text = text.replace(/['"][a-zA-Z0-9_-]{15,}['"]/g, "");
  text = text.replace(/\b[a-zA-Z0-9_-]{18,}\b/g, "");

  // Clean double spaces & leftover punctuation
  text = text.replace(/\s+/g, " ").trim();

  return text || "Terjadi kesalahan saat memproses data.";
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
    // If specific validation errors exist, sanitize and return the first one
    if (errors && errors.length > 0) {
      const sanitized = sanitizeErrorMessage(errors[0]);
      if (sanitized) return sanitized;
    }

    if (statusCode === 400) {
      return sanitizeErrorMessage(rawMessage) || "Permintaan tidak valid.";
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
      return sanitizeErrorMessage(rawMessage) || "Data tidak ditemukan.";
    }
    if (statusCode === 409) {
      return sanitizeErrorMessage(rawMessage) || "Data sudah terdaftar di sistem.";
    }
    if (statusCode >= 500) {
      return "Terjadi kesalahan sistem. Silakan coba lagi nanti.";
    }
    return sanitizeErrorMessage(rawMessage) || "Terjadi kesalahan saat memproses permintaan.";
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { requiresAuth = false, headers = {}, ...rest } = options;

    const fullUrl = endpoint.startsWith("http")
      ? endpoint
      : `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;

    const requestHeaders: Record<string, string> = {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
