import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type UserRole = "admin" | "doctor" | "patient";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        const role = await fetchRole(session.user.id);
        setState({
          user: session.user,
          role,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          role: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const role = await fetchRole(session.user.id);
        setState({
          user: session.user,
          role,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          role: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({
      user: null,
      role: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  return { ...state, signOut };
}

async function fetchRole(userId: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    return data.role as UserRole;
  } catch {
    return null;
  }
}
