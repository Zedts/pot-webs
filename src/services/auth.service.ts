import { apiClient } from "@/lib/api-client";
import { AuthStorage } from "@/lib/auth-storage";
import { Validators } from "@/lib/validators";
import { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth";
import { UserModel } from "@/types/user";
import { GoogleAuthService } from "./google-auth.service";

export class AuthService {
  /**
   * Logs in with identifier (email, username, or phone) and password.
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { identifier, password } = payload;
    const type = Validators.parseIdentifierType(identifier);

    const body: Record<string, string> = {
      password,
    };

    if (type === "email") {
      body.email = identifier.trim().toLowerCase();
    } else if (type === "no_hp") {
      body.no_hp = identifier.trim();
    } else {
      body.username = identifier.trim();
    }

    const response = await apiClient.post<AuthResponse>("/auth/login", body, {
      requiresAuth: false,
    });

    const data = response.data;
    if (!data || !data.token) {
      throw new Error("Gagal memproses sesi login.");
    }

    AuthStorage.saveToken(data.token);
    AuthStorage.saveUser(data.user);

    return data;
  }

  /**
   * Registers a new user with nama, username, email, password, and optional no_hp.
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const body: Record<string, string> = {
      nama: payload.nama.trim(),
      username: payload.username.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
    };

    if (payload.no_hp && payload.no_hp.trim()) {
      body.no_hp = payload.no_hp.trim();
    }

    const response = await apiClient.post<AuthResponse>("/auth/register", body, {
      requiresAuth: false,
    });

    const data = response.data;
    if (!data || !data.token) {
      throw new Error("Gagal memproses sesi pendaftaran.");
    }

    AuthStorage.saveToken(data.token);
    AuthStorage.saveUser(data.user);

    return data;
  }

  /**
   * Authenticates with Google Firebase ID Token.
   */
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/google",
      { idToken },
      { requiresAuth: false }
    );

    const data = response.data;
    if (!data || !data.token) {
      throw new Error("Gagal memproses sesi Google login.");
    }

    AuthStorage.saveToken(data.token);
    AuthStorage.saveUser(data.user);

    return data;
  }

  /**
   * Retrieves profile of currently authenticated user.
   */
  async getProfile(): Promise<UserModel> {
    const response = await apiClient.get<UserModel>("/auth/me", {
      requiresAuth: true,
    });

    const user = response.data;
    if (!user) {
      throw new Error("Profil pengguna tidak ditemukan.");
    }

    AuthStorage.saveUser(user);
    return user;
  }

  /**
   * Clears session across storage and Firebase.
   */
  async logout(): Promise<void> {
    AuthStorage.clear();
    await GoogleAuthService.signOut();
  }
}

export const authService = new AuthService();
