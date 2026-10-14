import { UserModel } from "@/types/user";

const TOKEN_KEY = "pot_token";
const USER_KEY = "pot_user";
const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days matching backend JWT

export class AuthStorage {
  /**
   * Retrieves the stored JWT token from localStorage or document.cookie.
   */
  static getToken(): string | null {
    if (typeof window === "undefined") return null;

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) return token;

      // Fallback: check cookie
      const match = document.cookie.match(new RegExp(`(^|;\\s*)(${TOKEN_KEY})=([^;]*)`));
      return match ? decodeURIComponent(match[3]) : null;
    } catch {
      return null;
    }
  }

  /**
   * Persists the JWT token to both localStorage and document.cookie.
   * Cookie is required for Next.js edge middleware routing.
   */
  static saveToken(token: string): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(TOKEN_KEY, token);

      // Persist cookie with 30-day expiry
      const isSecure = window.location.protocol === "https:";
      const cookieStr = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${
        isSecure ? "; Secure" : ""
      }`;
      document.cookie = cookieStr;
    } catch (e) {
      console.warn("[AuthStorage] Failed to save token:", e);
    }
  }

  /**
   * Retrieves the cached UserModel profile from localStorage.
   * Includes one-time migration fallback for legacy pot_user cookies.
   */
  static getUser(): UserModel | null {
    if (typeof window === "undefined") return null;

    try {
      const userJson = localStorage.getItem(USER_KEY);
      if (userJson) return JSON.parse(userJson) as UserModel;

      // Graceful migration fallback: check legacy cookie once, migrate to localStorage, and clear cookie
      const match = document.cookie.match(new RegExp(`(^|;\\s*)(${USER_KEY})=([^;]*)`));
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[3])) as UserModel;
        localStorage.setItem(USER_KEY, JSON.stringify(parsed));
        document.cookie = `${USER_KEY}=; path=/; max-age=0; SameSite=Lax`;
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Persists the UserModel profile strictly to localStorage.
   * Plaintext PII is omitted from request cookies.
   */
  static saveUser(user: UserModel): void {
    if (typeof window === "undefined") return;

    try {
      const serialized = JSON.stringify(user);
      localStorage.setItem(USER_KEY, serialized);

      // Ensure any legacy pot_user cookie is cleaned up
      document.cookie = `${USER_KEY}=; path=/; max-age=0; SameSite=Lax`;
    } catch (e) {
      console.warn("[AuthStorage] Failed to save user:", e);
    }
  }

  /**
   * Clears both tokens and profile on logout.
   */
  static clear(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      // Clear cookies by setting max-age to 0
      document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `${USER_KEY}=; path=/; max-age=0; SameSite=Lax`;
    } catch (e) {
      console.warn("[AuthStorage] Failed to clear storage:", e);
    }
  }
}
