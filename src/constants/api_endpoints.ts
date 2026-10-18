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
  penerimaan: "/penerimaan",
  produk: "/produk",
  stokLapak: "/stok-lapak",
  closing: "/closing",
  kategori: "/kategori",
  satuan: "/satuan",
  users: "/users",
} as const;

export type ApiEndpoints = typeof ApiEndpoints;
