"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import {
    Home,
    UtensilsCrossed,
    LayoutDashboard,
    BookOpen,
    Package,
    BarChart3,
    QrCode,
    Users,
    Clock,
    Settings,
    Menu,
    Pin,
    PinOff,
    LogOut,
    Megaphone,
} from "lucide-react";

interface SidebarItem {
    icon: React.ElementType;
    label: string;
    href: string;
}

interface SidebarGroup {
    label: string;
    items: SidebarItem[];
}

const navigationGroups: SidebarGroup[] = [
    {
        label: "OPERACIONAL",
        items: [
            { icon: Home, label: "Dashboard", href: "/" },
            { icon: UtensilsCrossed, label: "Pedidos", href: "/pedidos" },
            { icon: LayoutDashboard, label: "Mesas", href: "/mesas" },
            { icon: Menu, label: "Layout Visual", href: "/layout" },
        ]
    },
    {
        label: "GERENCIAMENTO",
        items: [
            { icon: BookOpen, label: "Cardápio", href: "/cardapio" },
            { icon: Package, label: "Estoque", href: "/estoque" },
            { icon: Megaphone, label: "Destaques", href: "/promocoes" },
        ]
    },
    {
        label: "SISTEMA",
        items: [
            { icon: BarChart3, label: "Relatórios", href: "/relatorios" },
            { icon: QrCode, label: "QR Codes", href: "/qrcodes" },
            { icon: Users, label: "Equipe", href: "/equipe" },
            { icon: Clock, label: "Horários", href: "/horarios" },
            { icon: Settings, label: "Ajustes", href: "/configuracoes" },
        ]
    }
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isPinned, setIsPinned] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLoggingOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    }, [router]);

    const isExpanded = isPinned || isHovered;

    const renderNavItems = (items: SidebarItem[]) => (
        <div className="flex flex-col gap-0.5 w-full">
            {items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                    <div key={item.href} className="relative w-full group flex items-center h-9">
                        {/* Active Indicator */}
                        {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] bg-[#ff5e1e] rounded-r-full z-20" />
                        )}

                        <Link
                            href={item.href}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "flex items-center rounded-md transition-colors duration-200 overflow-hidden w-full h-9 mx-1",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                        >
                            {/* Icon Container - FIXED width so icon never moves */}
                            <div className="w-[40px] h-9 shrink-0 flex items-center justify-center">
                                <Icon
                                    className={cn(
                                        "h-[18px] w-[18px]",
                                        !isExpanded && "group-hover:scale-105"
                                    )}
                                    strokeWidth={1.5}
                                />
                            </div>

                            {/* Label - only fades in, no width/position animation */}
                            <span className={cn(
                                "text-[12px] whitespace-nowrap transition-opacity duration-300 ease-out",
                                isActive ? "font-medium" : "font-normal",
                                isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    </div>
                );
            })}
        </div>
    );

    return (
        <>
            {/* Spacer - Only pushes content when PINNED, stays 48px on hover */}
            <div className={cn(
                "hidden sm:block flex-shrink-0 transition-all duration-300 ease-out",
                isPinned ? "w-[260px]" : "w-[48px]"
            )} />

            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={() => setIsPinned(!isPinned)}
                className={cn(
                    "fixed inset-y-0 left-0 z-40 mt-11 flex flex-col border-r bg-sidebar border-sidebar-border transition-all duration-300 ease-out overflow-hidden cursor-pointer",
                    isExpanded ? "w-[260px]" : "w-[48px]",
                    !isPinned && isHovered ? "shadow-[10px_0_30px_-10px_rgba(0,0,0,0.5)]" : "shadow-none"
                )}
            >
                {/* Nav Links */}
                <ScrollArea className="flex-1 cursor-default" onClick={(e) => {
                    // Clicks here bubble up to aside to toggle pin, but cursor is default
                }}>
                    <nav className="flex flex-col items-start pt-6 pb-4 w-full">
                        {navigationGroups.map((group) => (
                            <div key={group.label} className="w-full mb-4 cursor-default">
                                {/* Section header - keeps its height when collapsed so icons don't jump */}
                                <h3 className={cn(
                                    "text-[10px] font-bold text-sidebar-foreground/70 tracking-widest transition-all duration-300 ease-out uppercase mb-2 h-4 flex items-center",
                                    isExpanded ? "opacity-100 px-4" : "opacity-0 px-2 pointer-events-none"
                                )}>
                                    {group.label}
                                </h3>
                                {renderNavItems(group.items)}
                            </div>
                        ))}
                    </nav>
                </ScrollArea>

                {/* Footer */}
                <div className="flex flex-col gap-1 border-t border-sidebar-border px-1 py-2 bg-sidebar cursor-default">
                    {/* Pin Menu */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsPinned(!isPinned);
                        }}
                        className={cn(
                            "flex h-9 w-full items-center rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground hover:text-sidebar-accent-foreground cursor-pointer",
                        )}
                    >
                        <div className="w-[40px] h-9 shrink-0 flex items-center justify-center">
                            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </div>
                        <span className={cn(
                            "text-[12px] font-medium whitespace-nowrap transition-opacity duration-300 ease-out",
                            isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}>
                            {isPinned ? "Desafixar Menu" : "Fixar Menu"}
                        </span>
                    </button>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex h-9 w-full items-center rounded-md hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500 cursor-pointer group"
                    >
                        <div className="w-[40px] h-9 shrink-0 flex items-center justify-center">
                            <LogOut className="h-4 w-4" />
                        </div>
                        <span className={cn(
                            "text-[12px] font-medium whitespace-nowrap transition-opacity duration-300 ease-out",
                            isExpanded ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}>
                            {isLoggingOut ? "Saindo..." : "Sair"}
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}
