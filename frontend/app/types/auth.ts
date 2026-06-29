import type { LoginPayload, MeDto } from "./api";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AuthContextValue = {
  user: MeDto | null;
  status: AuthStatus;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
};
