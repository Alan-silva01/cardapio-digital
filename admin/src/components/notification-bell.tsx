"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, UtensilsCrossed, HandHelping, Receipt, X, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NotificationType = "pedido" | "garcom" | "conta";

interface Notification {
    id: string;
    type: NotificationType;
    label: string;
    href: string;
    timestamp: Date;
    read: boolean;
}

const TYPE_META: Record<NotificationType, { icon: React.ElementType; color: string }> = {
    pedido: { icon: UtensilsCrossed, color: "text-[#ff5e1e]" },
    garcom: { icon: HandHelping, color: "text-blue-400" },
    conta: { icon: Receipt, color: "text-emerald-400" },
};

export function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const mesasStateRef = useRef<Record<number, { garcom: boolean; conta: boolean }>>({});

    // Load initial mesa states to prevent stale triggers on first load
    useEffect(() => {
        async function loadMesaStates() {
            const { data } = await supabase
                .from("mesas")
                .select("numero, chamando_garcom, solicitando_conta");
            if (!data) return;
            const state: Record<number, { garcom: boolean; conta: boolean }> = {};
            data.forEach((m) => {
                state[m.numero] = {
                    garcom: !!m.chamando_garcom,
                    conta: !!m.solicitando_conta,
                };
            });
            mesasStateRef.current = state;
        }
        loadMesaStates();
    }, []);

    const addNotification = useCallback((n: Omit<Notification, "id" | "timestamp" | "read">) => {
        setNotifications((prev) => [
            {
                ...n,
                id: `${n.type}-${Date.now()}-${Math.random()}`,
                timestamp: new Date(),
                read: false,
            },
            ...prev,
        ]);
    }, []);

    // Listen for new orders (pedidos INSERT)
    useEffect(() => {
        const channel = supabase
            .channel("notif-bell-pedidos")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "pedidos" },
                (payload) => {
                    const mesa = payload.new?.mesa_numero ?? payload.new?.mesa ?? "?";
                    addNotification({
                        type: "pedido",
                        label: `Novo pedido na Mesa ${mesa}`,
                        href: "/pedidos",
                    });
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [addNotification]);

    // Listen for table service calls (mesas UPDATE)
    useEffect(() => {
        const channel = supabase
            .channel("notif-bell-mesas")
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "mesas" },
                (payload) => {
                    const mesa = payload.new;
                    const prev = mesasStateRef.current[mesa.numero] || { garcom: false, conta: false };

                    if (mesa.chamando_garcom && !prev.garcom) {
                        addNotification({
                            type: "garcom",
                            label: `Mesa ${mesa.numero} chamou o garçom`,
                            href: "/mesas",
                        });
                    }
                    if (mesa.solicitando_conta && !prev.conta) {
                        addNotification({
                            type: "conta",
                            label: `Mesa ${mesa.numero} quer fechar a conta`,
                            href: "/mesas",
                        });
                    }

                    mesasStateRef.current[mesa.numero] = {
                        garcom: !!mesa.chamando_garcom,
                        conta: !!mesa.solicitando_conta,
                    };
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [addNotification]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllRead = () =>
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const clearAll = () => setNotifications([]);

    const dismiss = (id: string) =>
        setNotifications((prev) => prev.filter((n) => n.id !== id));

    const handleView = (n: Notification) => {
        dismiss(n.id);
        setOpen(false);
        router.push(n.href);
    };

    const handleOpenChange = (val: boolean) => {
        setOpen(val);
        if (val) markAllRead();
    };

    const formatTime = (d: Date) =>
        d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    return (
        <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none"
            >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#ff5e1e] text-[9px] font-bold text-white leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-[320px] p-0 shadow-xl"
                sideOffset={6}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                        <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[13px] font-semibold">Notificações</span>
                        {notifications.length > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                                ({notifications.length})
                            </span>
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <button
                            onClick={clearAll}
                            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Limpar tudo
                        </button>
                    )}
                </div>

                {/* List */}
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                        <Bell className="h-8 w-8 opacity-20" />
                        <p className="text-[13px]">Sem notificações</p>
                    </div>
                ) : (
                    <ScrollArea className="max-h-[360px]">
                        <div className="flex flex-col divide-y divide-border">
                            {notifications.map((n) => {
                                const meta = TYPE_META[n.type];
                                const Icon = meta.icon;
                                return (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40",
                                            !n.read && "bg-muted/20"
                                        )}
                                    >
                                        {/* Icon */}
                                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                                            <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium leading-snug">
                                                {n.label}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                {formatTime(n.timestamp)}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-6 px-2 text-[11px] font-medium"
                                                onClick={() => handleView(n)}
                                            >
                                                Ver
                                                <ArrowRight className="ml-1 h-2.5 w-2.5" />
                                            </Button>
                                            <button
                                                onClick={() => dismiss(n.id)}
                                                className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
