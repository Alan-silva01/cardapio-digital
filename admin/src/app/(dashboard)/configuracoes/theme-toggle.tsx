"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch by only rendering after mount
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return <div className="flex items-center p-1 bg-muted rounded-md w-[200px] h-9"></div>;
    }

    return (
        <div className="flex items-center p-1 bg-muted rounded-md border text-muted-foreground">
            <button
                onClick={() => setTheme("light")}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-medium transition-all duration-200",
                    theme === "light" ? "bg-background text-foreground shadow-xs ring-1 ring-border" : "hover:text-foreground hover:bg-background/50"
                )}
            >
                <Sun className="h-3.5 w-3.5" />
                Claro
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-medium transition-all duration-200",
                    theme === "dark" ? "bg-background text-foreground shadow-xs ring-1 ring-border" : "hover:text-foreground hover:bg-background/50"
                )}
            >
                <Moon className="h-3.5 w-3.5" />
                Escuro
            </button>
            <button
                onClick={() => setTheme("system")}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-medium transition-all duration-200",
                    theme === "system" ? "bg-background text-foreground shadow-xs ring-1 ring-border" : "hover:text-foreground hover:bg-background/50"
                )}
            >
                <Monitor className="h-3.5 w-3.5" />
                Sistema
            </button>
        </div>
    );
}
