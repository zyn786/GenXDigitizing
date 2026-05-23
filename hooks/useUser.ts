// @ts-nocheck
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { AuthUser, UserRole } from "@/types";

interface UseUserReturn {
  user:        AuthUser | null;
  loading:     boolean;
  error:       string | null;
  signOut:     () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const supabase = createClient();
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchProfile = useCallback(async (authUser: User) => {
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, email, full_name, role, avatar_url")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      setError("Failed to load user profile");
      setUser(null);
      return;
    }

    // Fetch extended ID based on role
    let clientId: string | undefined;
    let designerId: string | undefined;

    if (profile.role === "client") {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", authUser.id)
        .single();
      clientId = client?.id;
    }

    if (profile.role === "designer") {
      const { data: designer } = await supabase
        .from("designers")
        .select("id")
        .eq("user_id", authUser.id)
        .single();
      designerId = designer?.id;
    }

    setUser({
      id:          profile.id,
      email:       profile.email,
      full_name:   profile.full_name,
      role:        profile.role as UserRole,
      avatar_url:  profile.avatar_url ?? undefined,
      client_id:   clientId,
      designer_id: designerId,
    });
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await fetchProfile(authUser);
    }
  }, [fetchProfile, supabase]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!mounted) { return; }

        if (authUser) {
          await fetchProfile(authUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        if (mounted) {
          setError("Failed to load user");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) { return; }
        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
          setLoading(false);
        } else if (session?.user) {
          await fetchProfile(session.user);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  return { user, loading, error, signOut, refreshUser };
}
