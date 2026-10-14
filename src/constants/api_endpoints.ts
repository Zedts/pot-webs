/**
 * API Endpoints used across the POT Web application.
 */
export const ApiEndpoints = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    googleLogin: "/auth/google",
    me: "/auth/me",
  },
} as const;

export type ApiEndpoints = typeof ApiEndpoints;
