"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        try {
          // Register the sw.js service worker located in the public folder
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker registered successfully:", registration.scope);
        } catch (error) {
          console.error("Service Worker registration failed:", error);
        }
      };

      // Register SW after load to avoid impacting initial load performance
      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker);
        return () => window.removeEventListener("load", registerServiceWorker);
      }
    }
  }, []);

  return null;
}
