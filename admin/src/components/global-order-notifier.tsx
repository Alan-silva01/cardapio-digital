"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotificationSound } from "@/hooks/useNotificationSound";

/**
 * Invisible client component that listens globally for new pedidos
 * and plays a notification sound regardless of which page the admin is on.
 */
export function GlobalOrderNotifier() {
    const { playSound } = useNotificationSound();
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const channel = supabase
            .channel("global-order-sound")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "pedidos" },
                (payload: { new: { nome_pessoa?: string } }) => {
                    const isCouvert = payload.new?.nome_pessoa === "Couvert";
                    if (!isCouvert) {
                        playSound();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, playSound]);

    // Renders nothing — purely a side-effect component
    return null;
}
