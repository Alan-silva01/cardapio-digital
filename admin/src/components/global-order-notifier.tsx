"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNotificationSound } from "@/hooks/useNotificationSound";

/**
 * Invisible client component that listens globally for new pedidos
 * and plays a notification sound regardless of which page the admin is on.
 */
export function GlobalOrderNotifier() {
    const { playSound } = useNotificationSound();

    useEffect(() => {
        const channel = supabase
            .channel("global-order-sound")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "pedidos" },
                (payload: any) => {
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
    }, [playSound]);

    // Renders nothing — purely a side-effect component
    return null;
}
