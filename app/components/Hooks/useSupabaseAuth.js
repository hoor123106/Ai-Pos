"use client";
import { useState, useEffect } from "react";
import {supabase} from "../../../app/utils/supabase/client"
import { useRouter } from "next/navigation";

export function useSupabaseAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === "SIGNED_OUT") {
          router.push("/sign-in");
        }
        if (event === "SIGNED_IN" && window.location.pathname === "/sign-in") {
          router.push("/dashboard");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isSignedIn = !!user;

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  return { user, loading, isSignedIn, signOut };
}
