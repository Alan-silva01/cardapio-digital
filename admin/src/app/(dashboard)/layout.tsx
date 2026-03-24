import { Sidebar } from "@/components/sidebar";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import logoImage from "@/assets/images/logo.png";
import { GlobalOrderNotifier } from "@/components/global-order-notifier";
import { GlobalServiceNotifier } from "@/components/global-service-notifier";
import { NotificationBell } from "@/components/notification-bell";
import { Toaster } from "sonner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
            <Toaster theme="dark" position="bottom-right" richColors />
            {/* Global sound listener for new orders - works on ALL pages */}
            <GlobalOrderNotifier />
            {/* Global sound and visual listener for table service calls */}
            <GlobalServiceNotifier />
            {/* Supabase-style Top Bar */}
            <header className="h-11 border-b bg-card flex items-center shrink-0 w-full z-50">
                {/* Fixed Logo Area - Always 48px */}
                <div className="w-[48px] h-11 flex items-center justify-center shrink-0 border-r">
                    <div className="h-[34px] w-[34px] relative">
                        <Image
                            src={logoImage}
                            alt="Logo IntelFlux"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* Breadcrumbs and Actions */}
                <div className="flex-1 flex items-center justify-between px-4 h-full">
                    <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground">
                        <span className="text-foreground hover:opacity-80 cursor-pointer transition-opacity">Intelflux</span>
                        <ChevronRight className="h-3 w-3 opacity-50" />
                        <span>Seu Manel</span>
                        <ChevronRight className="h-3 w-3 opacity-50" />
                        <span>Painel Administrativo</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <div className="h-4 w-[1px] bg-border mx-1" />
                        <Avatar className="h-6 w-6 border">
                            <AvatarFallback className="bg-muted text-muted-foreground text-[8px]">AD</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
