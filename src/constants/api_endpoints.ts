export const ApiEndpoints = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    googleLogin: "/auth/google",
    me: "/auth/me",
  },
  lapak: "/lapak",
  absensi: "/absensi",
  penjualan: "/penjualan",
  pengiriman: "/pengiriman",
  stokLapak: "/stok-lapak",
  closing: "/closing",
} as const;

export type ApiEndpoints = typeof ApiEndpoints;
