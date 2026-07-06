"use client";

/**
 * SessionSync — Bridges NextAuth session → Zustand store.
 *
 * On mount, it reads the user's email from the NextAuth session,
 * calls /api/me to resolve their role + assigned programme IDs,
 * then pushes that data into the PMO store so every component
 * (sidebar, header, portfolio) reflects the correct user identity.
 */

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePmoStore } from "@/store/use-pmo-store";
import { useRouter } from "next/navigation";

export interface MeResponse {
  email: string;
  role: string;
  person_id: string | null;
  person_db_id: number | null;
  name: string | null;
  avatar_color: string;
  assigned_programme_ids: string[] | null; // null = full access (ADMIN/PMO/PM)
}

export default function SessionSync() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated" && status !== "unauthenticated") return;

    // Redirect to signin if unauthenticated and dev mode bypass is disabled
    if (status === "unauthenticated" && process.env.NEXT_PUBLIC_BYPASS_AUTH !== "true") {
      router.push("/auth/signin");
      return;
    }

    const syncUser = async () => {
      // Get email from session (real MS Auth) OR from mock (auth.ts bypass)
      const email =
        session?.user?.email ||
        "vinayak.chouhan@dcontour.tech"; // fallback for no-auth dev mode

      // The session may already have a role set (from auth.ts mock or real callback)
      const sessionRole = (session as any)?.role as string | undefined;

      try {
        const res = await fetch(
          `http://localhost:5000/api/me?email=${encodeURIComponent(email)}`
        );
        if (!res.ok) throw new Error("Failed to fetch /api/me");
        const me: MeResponse = await res.json();

        // Use session role if set (dev mode override), else use backend-resolved role
        const resolvedRole = sessionRole || me.role;

        const store = usePmoStore.getState();

        // Update user in store
        store.setUser({
          id: "usr-1",
          username: email.split("@")[0],
          name: me.name || session?.user?.name || email,
          email,
          role: resolvedRole,
          active: true,
          avatar_color: me.avatar_color || "#1E90E8",
          person_id: me.person_id || undefined,
        });

        // Store the assigned programme IDs for portfolio filtering
        // null = full access, [] = no access, [...] = specific programmes
        store.setAssignedProgrammeIds(me.assigned_programme_ids);

      } catch (err) {
        console.error("[SessionSync] Could not resolve user from /api/me:", err);
        // Fallback: at minimum push session role into store if available
        if (sessionRole) {
          const store = usePmoStore.getState();
          const current = store.user;
          if (current) {
            store.setUser({ ...current, role: sessionRole });
          }
        }
      }
    };

    syncUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session?.user?.email, (session as any)?.role, router]);

  return null;
}
