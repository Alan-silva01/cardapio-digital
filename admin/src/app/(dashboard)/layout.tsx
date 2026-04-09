import { Sidebar } from "@/components/sidebar";
import { Hexagon, ChevronsUpDown } from "lucide-react";
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
            <Toaster 
                theme="dark" 
                position="top-center" 
                toastOptions={{
                    style: {
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '24px',
                        color: 'white',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    },
                    className: 'font-sans font-medium',
                }}
            />
            {/* Global sound listener for new orders - works on ALL pages */}
            <GlobalOrderNotifier />
            {/* Global sound and visual listener for table service calls */}
            <GlobalServiceNotifier />
            {/* Supabase-style Top Bar */}
            <header className="h-11 border-b bg-card flex items-center shrink-0 w-full z-50">
                {/* Fixed Logo Area - Always 48px */}
                <div className="w-[48px] h-11 flex items-center justify-center shrink-0 border-r">
                    <div className="h-[24px] w-[24px] relative">
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
                    <div className="flex items-center text-[13px] font-normal text-foreground">
                        {/* 1. Nome principal / Organização */}
                        <div className="flex items-center hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1.5 rounded-md cursor-pointer transition-colors">
                            <span>Intelflux</span>
                        </div>
                        
                        {/* Separador / */}
                        <span className="text-muted-foreground/30 font-light text-xl px-0.5 leading-none translate-y-[-1px]">/</span>
                        
                        {/* 2. Projeto / Sistema */}
                        <div className="flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1.5 rounded-md cursor-pointer transition-colors">
                            <Hexagon className="h-[15px] w-[15px] text-muted-foreground" strokeWidth={1.5} />
                            <span>Seu Manel</span>
                            <span className="h-5 flex items-center px-2 border border-border bg-card rounded-full text-[10px] font-medium text-foreground tracking-wider ml-1">FREE</span>
                            <ChevronsUpDown className="h-3 w-3 text-muted-foreground/70" strokeWidth={2} />
                        </div>

                        {/* Separador / */}
                        <span className="text-muted-foreground/30 font-light text-xl px-0.5 leading-none translate-y-[-1px]">/</span>

                        {/* 3. Módulo / App */}
                        <div className="flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1.5 rounded-md cursor-pointer transition-colors">
                            <Hexagon className="h-[15px] w-[15px] text-muted-foreground" strokeWidth={1.5} />
                            <span>Painel Administrativo</span>
                            <ChevronsUpDown className="h-3 w-3 text-muted-foreground/70" strokeWidth={2} />
                        </div>
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
