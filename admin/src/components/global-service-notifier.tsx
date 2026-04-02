"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * HIGH-PERFORMANCE Global Service Notifier (v2 — Lazy + Background Preload)
 *
 * Strategy:
 * 1. On Realtime event → check if AudioBuffer is cached in RAM
 *    - YES → play instantly from memory (~0.1ms)
 *    - NO  → play via HTMLAudioElement (fallback) + cache the buffer for next time
 * 2. Background preload starts AFTER 5s delay, downloads in small batches of 3
 *    so it never saturates the browser's 6-connection-per-domain limit.
 *
 * This means:
 * - ZERO impact on initial page load
 * - First play of an uncached audio uses HTMLAudioElement (works but may have small delay)
 * - All subsequent plays are instant from memory
 * - After ~15-30s all audios are in RAM anyway
 */

const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 800;
const PRELOAD_START_DELAY_MS = 5000;

interface AudioAlert {
    mesa_numero: number;
    tipo: string;
    audio_url: string;
}

interface MesaRow {
    numero: number;
    chamando_garcom: boolean;
    solicitando_conta: boolean;
}

export function GlobalServiceNotifier() {
    const supabase = useMemo(() => createClient(), []);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const buffersRef = useRef<Map<string, AudioBuffer>>(new Map());
    const isUnlockedRef = useRef(false);
    const playingRef = useRef<Set<string>>(new Set());
    const mesasStateRef = useRef<Record<number, { garcom: boolean; conta: boolean }>>({});
    const alertsRawRef = useRef<AudioAlert[]>([]);

    // ── Helpers ──────────────────────────────────────────────────────────

    const getAudioContext = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioCtxRef.current;
    }, []);

    const cacheKey = (mesa: number | string, tipo: string) => `${mesa}-${tipo}`;

    /** Download + decode a single audio file into an AudioBuffer (silent fail) */
    const fetchAndDecode = useCallback(
        async (url: string): Promise<AudioBuffer | null> => {
            try {
                const ctx = getAudioContext();
                const response = await fetch(url, { mode: "cors" });
                if (!response.ok) return null;
                const arrayBuffer = await response.arrayBuffer();
                return await ctx.decodeAudioData(arrayBuffer);
            } catch {
                return null;
            }
        },
        [getAudioContext]
    );

    /** Background preload: batches of BATCH_SIZE with delays between each batch */
    const backgroundPreload = useCallback(
        async (alerts: AudioAlert[]) => {
            const uncached = alerts.filter(
                (a) => !buffersRef.current.has(cacheKey(a.mesa_numero, a.tipo))
            );
            if (uncached.length === 0) return;

            for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
                const batch = uncached.slice(i, i + BATCH_SIZE);
                await Promise.allSettled(
                    batch.map(async (alert) => {
                        const key = cacheKey(alert.mesa_numero, alert.tipo);
                        if (buffersRef.current.has(key)) return;
                        const buffer = await fetchAndDecode(alert.audio_url);
                        if (buffer) buffersRef.current.set(key, buffer);
                    })
                );
                // Wait between batches to avoid saturating connections
                if (i + BATCH_SIZE < uncached.length) {
                    await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
                }
            }
        },
        [fetchAndDecode]
    );

    // ── Robust AudioContext Unlock ──────────────────────────────────────

    useEffect(() => {
        const unlock = async () => {
            if (isUnlockedRef.current) return;
            try {
                const ctx = getAudioContext();
                if (ctx.state === "suspended") await ctx.resume();
                const silentBuffer = ctx.createBuffer(1, 1, ctx.sampleRate);
                const source = ctx.createBufferSource();
                source.buffer = silentBuffer;
                source.connect(ctx.destination);
                source.start(0);
                isUnlockedRef.current = true;
                document.removeEventListener("click", unlock);
                document.removeEventListener("touchstart", unlock);
                document.removeEventListener("keydown", unlock);
            } catch { /* retry on next interaction */ }
        };

        document.addEventListener("click", unlock);
        document.addEventListener("touchstart", unlock);
        document.addEventListener("keydown", unlock);

        return () => {
            document.removeEventListener("click", unlock);
            document.removeEventListener("touchstart", unlock);
            document.removeEventListener("keydown", unlock);
        };
    }, [getAudioContext]);

    // ── Fetch Alerts + Initial State ────────────────────────────────────

    useEffect(() => {
        let preloadTimer: ReturnType<typeof setTimeout>;

        async function fetchAudioAlerts() {
            const { data } = await supabase
                .from("audio_alertas")
                .select("mesa_numero, tipo, audio_url");
            if (data) alertsRawRef.current = data;
            return data;
        }

        async function fetchInitialData() {
            const audioData = await fetchAudioAlerts();

            const { data: mesasData } = await supabase
                .from("mesas")
                .select("numero, chamando_garcom, solicitando_conta");
            if (mesasData) {
                const state: Record<number, { garcom: boolean; conta: boolean }> = {};
                (mesasData as MesaRow[]).forEach((m) => {
                    state[m.numero] = {
                        garcom: !!m.chamando_garcom,
                        conta: !!m.solicitando_conta,
                    };
                });
                mesasStateRef.current = state;
            }

            // Start background preload AFTER a delay — zero impact on page load
            if (audioData && audioData.length > 0) {
                preloadTimer = setTimeout(() => {
                    backgroundPreload(audioData);
                }, PRELOAD_START_DELAY_MS);
            }
        }

        fetchInitialData();

        const audioChannel = supabase
            .channel("global-audio-alerts")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "audio_alertas" },
                () => { fetchAudioAlerts(); }
            )
            .subscribe();

        return () => {
            clearTimeout(preloadTimer);
            supabase.removeChannel(audioChannel);
        };
    }, [supabase, backgroundPreload]);

    // ── Play Logic ──────────────────────────────────────────────────────

    /** Play from cached AudioBuffer (instant, ~0.1ms) */
    const playFromBuffer = useCallback(
        (key: string, buffer: AudioBuffer) => {
            if (playingRef.current.has(key)) return;
            try {
                const ctx = getAudioContext();
                if (ctx.state === "suspended") ctx.resume();

                const source = ctx.createBufferSource();
                source.buffer = buffer;
                const gainNode = ctx.createGain();
                gainNode.gain.value = 1.0;
                source.connect(gainNode);
                gainNode.connect(ctx.destination);

                playingRef.current.add(key);
                source.onended = () => {
                    playingRef.current.delete(key);
                    source.disconnect();
                    gainNode.disconnect();
                };
                setTimeout(() => playingRef.current.delete(key), 15000);
                source.start(0);
            } catch {
                playingRef.current.delete(key);
            }
        },
        [getAudioContext]
    );

    /** Fallback: play via HTMLAudioElement when buffer isn't cached yet */
    const playFallback = useCallback(
        (key: string, url: string) => {
            if (playingRef.current.has(key)) return;
            try {
                const audio = new Audio(url);
                audio.volume = 1.0;
                playingRef.current.add(key);

                audio.addEventListener("ended", () => {
                    playingRef.current.delete(key);
                }, { once: true });

                setTimeout(() => playingRef.current.delete(key), 15000);

                audio.play().catch(() => {
                    playingRef.current.delete(key);
                });

                // Cache the buffer in background for next time
                fetchAndDecode(url).then((buf) => {
                    if (buf) buffersRef.current.set(key, buf);
                });
            } catch {
                playingRef.current.delete(key);
            }
        },
        [fetchAndDecode]
    );

    const playAlert = useCallback(
        (mesaNumero: number | string, type: "garcom" | "conta") => {
            const key = cacheKey(mesaNumero, type);
            if (playingRef.current.has(key)) return;

            const buffer = buffersRef.current.get(key);
            if (buffer) {
                // ✅ Cached — instant play from memory
                playFromBuffer(key, buffer);
                return;
            }

            // ⚡ Not cached yet — use HTMLAudioElement fallback + cache for next time
            const alert = alertsRawRef.current.find(
                (a) => String(a.mesa_numero) === String(mesaNumero) && a.tipo === type
            );
            if (alert?.audio_url) {
                playFallback(key, alert.audio_url);
            }
        },
        [playFromBuffer, playFallback]
    );

    // ── Realtime Listener ───────────────────────────────────────────────

    useEffect(() => {
        const channel = supabase
            .channel("global-service-calls")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "mesas" },
                (payload: { new: Record<string, unknown> }) => {
                    const newMesa = payload.new as unknown as MesaRow;
                    const prevState = mesasStateRef.current[newMesa.numero] || {
                        garcom: false,
                        conta: false,
                    };

                    if (newMesa.chamando_garcom && !prevState.garcom) {
                        playAlert(newMesa.numero, "garcom");
                    }
                    if (newMesa.solicitando_conta && !prevState.conta) {
                        playAlert(newMesa.numero, "conta");
                    }

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
    }, [supabase, playAlert]);

    return null;
}
