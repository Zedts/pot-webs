import { auth, GoogleAuthProvider } from "@/lib/firebase";
import { signInWithPopup, signOut as fbSignOut } from "firebase/auth";
import { ApiError } from "@/types/api";

export class GoogleAuthService {
  /**
   * Triggers the Google Sign-In popup and retrieves a verified Firebase Auth ID Token.
   * Returns null if user cancelled the popup.
   */
  static async signIn(): Promise<string | null> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken(true);

      if (!idToken) {
        throw new ApiError(
          401,
          "No ID Token returned from Google Sign-In",
          undefined,
          "Gagal memperoleh token verifikasi akun Google."
        );
      }

      return idToken;
    } catch (err: unknown) {
      const fbError = err as { code?: string; message?: string };

      if (fbError.code === "auth/popup-closed-by-user") {
        return null;
      }
      if (fbError.code === "auth/popup-blocked") {
        throw new ApiError(
          400,
          "Popup blocked",
          undefined,
          "Pop-up Google Login diblokir oleh browser. Silakan izinkan pop-up pada peramban Anda."
        );
      }
      if (fbError.code === "auth/cancelled-popup-request") {
        return null;
      }

      console.error("[GoogleAuthService] Sign-in error:", err);
      throw new ApiError(
        500,
        fbError.message || "Google Sign-In failure",
        undefined,
        "Gagal menghubungkan autentikasi Akun Google. Silakan coba lagi."
      );
    }
  }

  static async signOut(): Promise<void> {
    try {
      await fbSignOut(auth);
    } catch {
      // Ignore signOut errors
    }
  }
}
