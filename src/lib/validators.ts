const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const PHONE_REGEX = /^\+?[0-9]{8,15}$/;

export class Validators {
  /**
   * Validates presence of login identifier (email, username, or phone).
   */
  static validateIdentifier(value?: string | null): string | null {
    if (!value || !value.trim()) {
      return "Silakan masukkan email Anda";
    }
    return null;
  }

  /**
   * Validates email format and presence.
   */
  static validateEmail(value?: string | null): string | null {
    if (!value || !value.trim()) {
      return "Silakan masukkan email Anda";
    }
    const trimmed = value.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      return "Format email tidak valid";
    }
    return null;
  }

  /**
   * Validates full name (minimum 2 characters).
   */
  static validateName(value?: string | null): string | null {
    if (!value || !value.trim()) {
      return "Silakan masukkan nama lengkap Anda";
    }
    if (value.trim().length < 2) {
      return "Nama lengkap minimal 2 karakter";
    }
    return null;
  }

  /**
   * Validates username (3-30 alphanumeric and underscore characters).
   */
  static validateUsername(value?: string | null): string | null {
    if (!value || !value.trim()) {
      return "Silakan masukkan username Anda";
    }
    const trimmed = value.trim();
    if (!USERNAME_REGEX.test(trimmed)) {
      return "Username 3-30 karakter (hanya huruf, angka, dan _)";
    }
    return null;
  }

  /**
   * Validates optional phone number (8-15 digits if provided).
   */
  static validatePhone(value?: string | null): string | null {
    if (!value || !value.trim()) {
      return null; // Phone is optional
    }
    const trimmed = value.trim();
    if (!PHONE_REGEX.test(trimmed)) {
      return "Nomor handphone tidak valid (8-15 digit)";
    }
    return null;
  }

  /**
   * Validates password presence and minimum length (6).
   */
  static validatePassword(value?: string | null): string | null {
    if (!value || !value.trim()) {
      return "Silakan masukkan password Anda";
    }
    if (value.length < 6) {
      return "Password minimal 6 karakter";
    }
    return null;
  }

  /**
   * Validates password confirmation matches original password.
   */
  static validateConfirmPassword(
    confirmValue?: string | null,
    password?: string | null
  ): string | null {
    if (!confirmValue || !confirmValue.trim()) {
      return "Silakan konfirmasi password Anda";
    }
    if (confirmValue !== password) {
      return "Konfirmasi password tidak cocok";
    }
    return null;
  }

  /**
   * Helper to detect identifier type: email, phone, or username.
   */
  static parseIdentifierType(identifier: string): 'email' | 'no_hp' | 'username' {
    const trimmed = identifier.trim();
    if (EMAIL_REGEX.test(trimmed)) return 'email';
    if (PHONE_REGEX.test(trimmed)) return 'no_hp';
    return 'username';
  }
}
