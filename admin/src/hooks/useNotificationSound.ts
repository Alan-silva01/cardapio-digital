"use client";

import { useRef, useCallback, useState, useEffect } from "react";

const AUDIO_PATH = "/audio/notification.mp3";
const STORAGE_KEY = "notification-sound-enabled";

export function useNotificationSound() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const isUnlockedRef = useRef(false);
    const [enabled, setEnabled] = useState(true);

    // Load preference from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored !== null) setEnabled(stored === "true");
        } catch { }
    }, []);

    // Pre-load audio once
    useEffect(() => {
        const audio = new Audio(AUDIO_PATH);
        audio.preload = "auto";
        audio.volume = 0.7;
        audioRef.current = audio;

        // Unlock audio on first user interaction
        const unlock = () => {
            if (isUnlockedRef.current) return;
            const silent = audioRef.current;
            if (silent) {
                silent.volume = 0;
                silent.play().then(() => {
                    silent.pause();
                    silent.currentTime = 0;
                    silent.volume = 0.7;
                    isUnlockedRef.current = true;
                }).catch(() => { });
            }
        };

        document.addEventListener("click", unlock, { once: true });
        document.addEventListener("touchstart", unlock, { once: true });

        return () => {
            document.removeEventListener("click", unlock);
            document.removeEventListener("touchstart", unlock);
        };
    }, []);

    const playSound = useCallback(() => {
        if (!enabled || !audioRef.current) return;

        try {
            // Clone to allow overlapping plays
            const clone = audioRef.current.cloneNode() as HTMLAudioElement;
            clone.volume = 0.7;
            clone.play().catch(() => { });
            // Auto-cleanup after playback
            clone.addEventListener("ended", () => clone.remove(), { once: true });
        } catch { }
    }, [enabled]);

    const toggleSound = useCallback(() => {
        setEnabled((prev) => {
            const next = !prev;
            try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { }
            return next;
        });
    }, []);

    return { playSound, enabled, toggleSound };
}
