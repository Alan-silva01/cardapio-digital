import { Sidebar } from "@/components/sidebar";
import { ChevronRight, Bell, Search, HelpCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import logoImage from "@/assets/images/logo.png";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col h-screen bg-[#0D0D0D] text-[#EDEDED] overflow-hidden">
            {/* Supabase-style Top Bar */}
            <header className="h-11 border-b border-[#222] bg-[#111] flex items-center shrink-0 w-full z-50">
                {/* Fixed Logo Area - Always 48px */}
                <div className="w-[48px] h-11 flex items-center justify-center shrink-0 border-r border-[#222]">
                    <div className="h-6 w-6 relative">
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
                    <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide">
                        <span className="text-[#F9F6EE] hover:text-white cursor-pointer transition-colors">Intelflux</span>
                        <ChevronRight className="h-3 w-3 text-[#444]" />
                        <span className="text-[#666]">Seu Manel</span>
                        <ChevronRight className="h-3 w-3 text-[#444]" />
                        <span className="text-[#666]">Painel Administrativo</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#666] hover:text-[#999] hover:bg-[#1A1A1A]">
                            <Search className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#666] hover:text-[#999] hover:bg-[#1A1A1A]">
                            <Bell className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#666] hover:text-[#999] hover:bg-[#1A1A1A]">
                            <HelpCircle className="h-4 w-4" />
                        </Button>
                        <div className="h-4 w-[1px] bg-[#222] mx-1" />
                        <Avatar className="h-6 w-6 border border-[#222]">
                            <AvatarFallback className="bg-[#1A1A1A] text-[#666] text-[8px]">AD</AvatarFallback>
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
