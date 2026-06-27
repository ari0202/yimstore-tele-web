"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Supabase client instance for realtime subscriptions on the client side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function RealtimeCatalogRefresh() {
  const router = useRouter();

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) return;

    // Listen for any changes on relevant catalog tables
    const channel = supabase
      .channel("catalog-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        router.refresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // Komponen ini tidak me-render apapun di UI (headless)
  return null;
}
