"use client";

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * HIGH-PERFORMANCE Global Service Notifier
 *
 * Uses Web Audio API instead of HTMLAudioElement for guaranteed, instant playback.
 *
 * How it works:
 * 1. On mount, fetches all audio URLs from `audio_alertas` table
 * 2. Downloads ALL audio files and decodes them into AudioBuffers (kept in RAM)
 * 3. On Realtime event, plays from memory — ZERO network latency
 * 4. AudioContext is unlocked robustly (retries on every interaction until success)
 *
 * Why this is better than `new Audio(url)`:
 * - No network request at play time (already in memory)
 * - No race conditions with browser caching
 * - No CORS issues at play time (decoded at init)
 * - Sub-millisecond playback latency
 * - AudioContext is the browser-recommended way for programmatic audio
 */
export function GlobalServiceNotifier() {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const buffersRef = useRef<Map<string, AudioBuffer>>(new Map());
    const isUnlockedRef = useRef(false);
    const playingRef = useRef<Set<string>>(new Set());
    const mesasStateRef = useRef<Record<number, { garcom: boolean; conta: boolean }>>({});
    const alertsRawRef = useRef<any[]>([]);

    // ── Helpers ──────────────────────────────────────────────────────────

    /** Get or create the singleton AudioContext */
    const getAudioContext = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioCtxRef.current;
    }, []);

    /** Build a cache key like "1-garcom" */
    const cacheKey = (mesa: number | string, tipo: string) => `${mesa}-${tipo}`;

    /** Download a single audio file and decode it into an AudioBuffer */
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

    /** Pre-cache all audio files from the alerts list */
    const preloadAllAudio = useCallback(
        async (alerts: any[]) => {
            const ctx = getAudioContext();
            const promises = alerts.map(async (alert) => {
                const key = cacheKey(alert.mesa_numero, alert.tipo);
                // Skip if already cached
                if (buffersRef.current.has(key)) return;
                const buffer = await fetchAndDecode(alert.audio_url);
                if (buffer) {
                    buffersRef.current.set(key, buffer);
                }
            });
            await Promise.allSettled(promises);
        },
        [getAudioContext, fetchAndDecode]
    );

    // ── Robust AudioContext Unlock ──────────────────────────────────────

    useEffect(() => {
        const unlock = async () => {
            if (isUnlockedRef.current) return;
            try {
                const ctx = getAudioContext();
                // Resume if suspended (browser policy)
                if (ctx.state === "suspended") {
                    await ctx.resume();
                }
                // Play a silent buffer to fully unlock
                const silentBuffer = ctx.createBuffer(1, 1, ctx.sampleRate);
                const source = ctx.createBufferSource();
                source.buffer = silentBuffer;
                source.connect(ctx.destination);
                source.start(0);
                isUnlockedRef.current = true;

                // Remove listeners once unlocked
                document.removeEventListener("click", unlock);
                document.removeEventListener("touchstart", unlock);
                document.removeEventListener("keydown", unlock);
            } catch {
                // Will retry on next interaction
            }
        };

        // Listen on multiple events — retry until success (no { once: true })
        document.addEventListener("click", unlock);
        document.addEventListener("touchstart", unlock);
        document.addEventListener("keydown", unlock);

        return () => {
            document.removeEventListener("click", unlock);
            document.removeEventListener("touchstart", unlock);
            document.removeEventListener("keydown", unlock);
        };
    }, [getAudioContext]);

    // ── Fetch Alerts + Initial State + Preload Audio ────────────────────

    useEffect(() => {
        async function fetchAudioAlerts() {
            const { data } = await supabase
                .from("audio_alertas")
                .select("mesa_numero, tipo, audio_url");
            if (data) {
                alertsRawRef.current = data;
                // Pre-cache all audio files in background
                preloadAllAudio(data);
            }
        }

        async function fetchInitialData() {
            await fetchAudioAlerts();

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

        // Listen to audio_alertas changes (new uploads, etc.)
        const audioChannel = supabase
            .channel("global-audio-alerts")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "audio_alertas" },
                () => {
                    fetchAudioAlerts();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(audioChannel);
        };
    }, [preloadAllAudio]);

    // ── Play from Memory ────────────────────────────────────────────────

    const playAlert = useCallback(
        (mesaNumero: number | string, type: "garcom" | "conta") => {
            const key = cacheKey(mesaNumero, type);

            // Prevent overlapping plays for the same alert
            if (playingRef.current.has(key)) return;

            const buffer = buffersRef.current.get(key);

            if (!buffer) {
                // Buffer not cached yet — try to fetch on-demand as fallback
                const alert = alertsRawRef.current.find(
                    (a) => String(a.mesa_numero) === String(mesaNumero) && a.tipo === type
                );
                if (alert?.audio_url) {
                    fetchAndDecode(alert.audio_url).then((buf) => {
                        if (buf) {
                            buffersRef.current.set(key, buf);
                            // Retry play after decode
                            playFromBuffer(key, buf);
                        }
                    });
                }
                return;
            }

            playFromBuffer(key, buffer);
        },
        [fetchAndDecode]
    );

    /** Actually play an AudioBuffer through Web Audio API */
    const playFromBuffer = useCallback(
        (key: string, buffer: AudioBuffer) => {
            if (playingRef.current.has(key)) return;

            try {
                const ctx = getAudioContext();

                // Ensure context is running
                if (ctx.state === "suspended") {
                    ctx.resume();
                }

                const source = ctx.createBufferSource();
                source.buffer = buffer;

                // Gain node for volume control
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

                // Fallback timeout (in case onended never fires)
                setTimeout(() => {
                    playingRef.current.delete(key);
                }, 15000);

                source.start(0);
            } catch {
                playingRef.current.delete(key);
            }
        },
        [getAudioContext]
    );

    // ── Realtime Listener ───────────────────────────────────────────────

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

                    // Garçom: play only if transitioned false → true
                    if (newMesa.chamando_garcom && !prevState.garcom) {
                        playAlert(newMesa.numero, "garcom");
                    }

                    // Conta: play only if transitioned false → true
                    if (newMesa.solicitando_conta && !prevState.conta) {
                        playAlert(newMesa.numero, "conta");
                    }

                    // Update local state tracker
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

    return null;
}
