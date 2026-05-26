import { useAuth } from "./useAuth";

export function useIsAdmin() {
  const { role, isLoading } = useAuth();
  return { isAdmin: role === "admin", isLoading };
}
