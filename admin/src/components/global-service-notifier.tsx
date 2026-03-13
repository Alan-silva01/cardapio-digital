"use client";

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Invisible global component that listens for service calls (garçom / conta)
 * and plays a single notification per event.
 *
 * Design:
 * - Audio unlock happens silently on first user interaction (click/touch),
 *   exactly like the order notification sound — no banner needed.
 * - Each audio plays ONCE (no loop). A new Realtime event = a new play.
 * - Different audio files for 'garcom' vs 'conta', per mesa.
 */
export function GlobalServiceNotifier() {
    const audioAlertsRef = useRef<any[]>([]);
    const isUnlockedRef = useRef(false);
    const playingRef = useRef<Set<string>>(new Set());
    const mesasStateRef = useRef<Record<number, { garcom: boolean; conta: boolean }>>({});

    // Fetch audio URLs and initial mesa states from the database
    useEffect(() => {
        async function fetchInitialData() {
            // 1. Fetch audio alerts
            const { data: audioData } = await supabase
                .from("audio_alertas")
                .select("mesa_numero, tipo, audio_url");
            if (audioData) audioAlertsRef.current = audioData;

            // 2. Fetch initial mesas states
            // This prevents playing sounds for old alerts when a new unrelated update happens
            const { data: mesasData } = await supabase
                .from("mesas")
                .select("numero, chamando_garcom, solicitando_conta");
            if (mesasData) {
                const state: Record<number, { garcom: boolean; conta: boolean }> = {};
                mesasData.forEach((m) => {
                    state[m.numero] = {
                        garcom: !!m.chamando_garcom,
                        conta: !!m.solicitando_conta,
                    };
                });
                mesasStateRef.current = state;
            }
        }
        fetchInitialData();
    }, []);

    // Silent unlock on first interaction (same pattern as useNotificationSound)
    useEffect(() => {
        const unlock = () => {
            if (isUnlockedRef.current) return;
            const silent = new Audio(
                "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"
            );
            silent.volume = 0;
            silent
                .play()
                .then(() => {
                    silent.pause();
                    isUnlockedRef.current = true;
                })
                .catch(() => {});
        };

        document.addEventListener("click", unlock, { once: true });
        document.addEventListener("touchstart", unlock, { once: true });

        return () => {
            document.removeEventListener("click", unlock);
            document.removeEventListener("touchstart", unlock);
        };
    }, []);

    const playAlert = useCallback(
        (mesaNumero: number | string, type: "garcom" | "conta") => {
            const urlObj = audioAlertsRef.current.find(
                (a: any) =>
                    String(a.mesa_numero) === String(mesaNumero) && a.tipo === type
            );

            if (!urlObj?.audio_url) return;

            const key = `${mesaNumero}-${type}`;

            // Prevent overlapping plays for the same alert
            if (playingRef.current.has(key)) return;

            try {
                const audio = new Audio(urlObj.audio_url);
                audio.crossOrigin = "anonymous";
                audio.volume = 0.7;

                // Play ONCE — no loop
                playingRef.current.add(key);
                audio.addEventListener(
                    "ended",
                    () => {
                        playingRef.current.delete(key);
                    },
                    { once: true }
                );

                audio.play().catch(() => {
                    playingRef.current.delete(key);
                });
            } catch {
                playingRef.current.delete(key);
            }
        },
        []
    );

    // Listen for Realtime changes on mesas table
    useEffect(() => {
        const channel = supabase
            .channel("global-service-calls")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "mesas" },
                (payload) => {
                    const newMesa = payload.new;
                    const prevState = mesasStateRef.current[newMesa.numero] || {
                        garcom: false,
                        conta: false,
                    };

                    // Garçom: play only if it transitioned from false to true
                    if (newMesa.chamando_garcom && !prevState.garcom) {
                        playAlert(newMesa.numero, "garcom");
                    }

                    // Conta: play only if it transitioned from false to true
                    if (newMesa.solicitando_conta && !prevState.conta) {
                        playAlert(newMesa.numero, "conta");
                    }

                    // Update our local state tracker
                    mesasStateRef.current[newMesa.numero] = {
                        garcom: !!newMesa.chamando_garcom,
                        conta: !!newMesa.solicitando_conta,
                    };
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [playAlert]);

    // Renders nothing — purely a side-effect component
    return null;
}
