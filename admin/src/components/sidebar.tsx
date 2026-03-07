"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    PinOff
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
        ]
    },
    {
        label: "SISTEMA",
        items: [
            { icon: BarChart3, label: "Relatórios", href: "/relatorios" },
            { icon: QrCode, label: "QR Codes", href: "/qrcodes" },
            { icon: Users, label: "Equipe", href: "/equipe" },
            { icon: Clock, label: "Horários", href: "/horarios" },
            { icon: Settings, label: "Configurações", href: "/configuracoes" },
        ]
    }
];

export function Sidebar() {
    const pathname = usePathname();
    const [isPinned, setIsPinned] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const isExpanded = isPinned || isHovered;

    const renderNavItems = (items: SidebarItem[]) => (
        <div className="flex flex-col gap-0.5 w-full">
            {items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                    <div key={item.href} className="relative w-full group flex items-center h-8">
                        {/* Active Indicator - Stationary on the left edge */}
                        {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[1.5px] bg-[#ff5e1e] rounded-r-full z-20" />
                        )}

                        <Link
                            href={item.href}
                            className={cn(
                                "flex items-center rounded-md transition-colors duration-200 overflow-hidden mx-2 h-8 w-full",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                        >
                            {/* Icon Container - Always 32px and centered to stay stationary */}
                            <div className="w-8 h-8 shrink-0 flex items-center justify-center transition-transform duration-200">
                                <Icon
                                    className={cn(
                                        "h-[18px] w-[18px]",
                                        !isExpanded && "group-hover:scale-105"
                                    )}
                                    strokeWidth={1.2}
                                />
                            </div>

                            {/* Label - Only transitions in opacity and width, no horizontal movement for the icon */}
                            <span className={cn(
                                "text-[13px] font-medium whitespace-nowrap transition-all duration-150 ease-out pl-2",
                                isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none w-0"
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
                "hidden sm:block flex-shrink-0 transition-all duration-150 ease-out",
                isPinned ? "w-48" : "w-[48px]"
            )} />

            <aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    "fixed inset-y-0 left-0 z-40 mt-11 flex flex-col border-r bg-sidebar border-sidebar-border transition-all duration-150 ease-out shadow-2xl overflow-hidden",
                    isExpanded ? "w-48 shadow-[10px_0_30px_-10px_rgba(0,0,0,0.5)]" : "w-[48px]"
                )}
            >
                {/* Nav Links */}
                <ScrollArea className="flex-1">
                    <nav className="flex flex-col items-start pt-6 pb-4 w-full">
                        {navigationGroups.map((group) => (
                            <div key={group.label} className="w-full mb-6">
                                <h3 className={cn(
                                    "px-4 text-[10px] font-bold text-sidebar-foreground/70 tracking-widest transition-all duration-150 ease-out uppercase mb-2",
                                    isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                                )}>
                                    {group.label}
                                </h3>
                                {renderNavItems(group.items)}
                            </div>
                        ))}
                    </nav>
                </ScrollArea>

                {/* Footer */}
                <div className="flex flex-col gap-1 border-t border-sidebar-border p-1 bg-sidebar">
                    {/* Pin Menu */}
                    <button
                        onClick={() => setIsPinned(!isPinned)}
                        className={cn(
                            "flex h-8 items-center rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground hover:text-sidebar-accent-foreground mx-2",
                        )}
                    >
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                            {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </div>
                        <span className={cn(
                            "text-[12px] font-medium whitespace-nowrap transition-all duration-200 ease-out pl-2",
                            isExpanded ? "opacity-100" : "opacity-0 w-0"
                        )}>
                            {isPinned ? "Desafixar Menu" : "Fixar Menu"}
                        </span>
                    </button>

                    {/* Admin Status */}
                    <div className={cn(
                        "flex h-8 items-center transition-all duration-200 mx-2",
                    )}>
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center">
                            <Avatar className="h-5 w-5 border border-sidebar-border">
                                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-[8px]">AD</AvatarFallback>
                            </Avatar>
                        </div>
                        <span className={cn(
                            "text-[11px] text-sidebar-foreground font-medium pl-2 transition-all duration-200",
                            isExpanded ? "opacity-100" : "opacity-0 w-0"
                        )}>
                            Admin v0.1
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
}
