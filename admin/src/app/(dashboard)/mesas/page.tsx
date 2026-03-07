"use client";

import { useState } from "react";
import {
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Users,
  MessageSquare,
  DollarSign,
  Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Mesa {
  id: string;
  numero: string;
  capacidade: number;
  status: "livre" | "ocupada" | "reservada" | "chamando";
  ocupantes?: number;
  total?: string;
  tempo?: string;
}

const mockMesas: Mesa[] = [
  { id: "1", numero: "01", capacidade: 4, status: "livre" },
  { id: "2", numero: "02", capacidade: 2, status: "ocupada", ocupantes: 2, total: "R$ 145,90", tempo: "45m" },
  { id: "3", numero: "03", capacidade: 4, status: "chamando", ocupantes: 3, total: "R$ 380,00", tempo: "1h 20m" },
  { id: "4", numero: "04", capacidade: 6, status: "ocupada", ocupantes: 4, total: "R$ 212,00", tempo: "30m" },
  { id: "5", numero: "05", capacidade: 2, status: "reservada" },
  { id: "6", numero: "06", capacidade: 4, status: "livre" },
  { id: "7", numero: "07", capacidade: 8, status: "chamando", ocupantes: 7, total: "R$ 890,50", tempo: "2h" },
  { id: "8", numero: "08", capacidade: 4, status: "livre" },
  { id: "9", numero: "09", capacidade: 2, status: "ocupada", ocupantes: 1, total: "R$ 45,00", tempo: "15m" },
  { id: "10", numero: "10", capacidade: 4, status: "livre" },
];

export default function MesasPage() {
  const [search, setSearch] = useState("");

  const getStatusColor = (status: Mesa["status"]) => {
    switch (status) {
      case "livre": return "text-emerald-500 bg-emerald-500/10";
      case "ocupada": return "text-blue-500 bg-blue-500/10";
      case "chamando": return "text-red-500 bg-red-500/10 animate-pulse";
      case "reservada": return "text-amber-500 bg-amber-500/10";
      default: return "bg-[#222]";
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0D0D0D] text-[#EDEDED] min-h-screen">
      {/* Header / Subnav */}
      <div className="h-14 border-b border-[#222] px-6 flex items-center justify-between bg-[#111]">
        <div className="flex items-center gap-2 text-sm text-[#666]">
          <span>Monitoramento</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-[#EDEDED] font-medium">Mapa de Mesas</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#1A1A1A] rounded-md border border-[#222] p-0.5">
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold bg-[#2A2A2A] text-white">GRID</Button>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-[#666]">LISTA</Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-6 border-b border-[#222]/50 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666]" />
          <Input
            placeholder="Buscar mesa..."
            className="pl-10 bg-[#111] border-[#222] focus:border-[#333] h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-[#111] border-[#222] text-[#999] h-9 text-xs">
            <Filter className="h-3.5 w-3.5 mr-2" />
            Filtros
          </Button>
          <Button className="bg-[#ff5e1e] hover:bg-[#e54e15] text-white h-9 text-xs font-bold shadow-none">
            + Nova Reserva
          </Button>
        </div>
      </div>

      {/* Grid area */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {mockMesas.map((mesa) => (
            <Card key={mesa.id} className={cn(
              "bg-[#1A1A1A] border-[#2A2A2A] transition-all cursor-pointer group hover:scale-[1.02]",
              mesa.status === "chamando" && "ring-1 ring-red-500/50 scale-[1.01]"
            )}>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-[#666] tracking-widest uppercase mb-1">MESA</p>
                    <h2 className="text-3xl font-serif font-bold text-[#F9F6EE]">{mesa.numero}</h2>
                  </div>
                  <Badge className={cn("border-none text-[10px] font-bold uppercase tracking-wider h-6 py-0 px-2", getStatusColor(mesa.status))}>
                    {mesa.status}
                  </Badge>
                </div>

                {mesa.ocupantes ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#888]">
                        <Users className="h-3 w-3" />
                        {mesa.ocupantes}/{mesa.capacidade} Pessoas
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#888]">
                        <Timer className="h-3 w-3" />
                        {mesa.tempo}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[#0D0D0D] border border-[#222] flex items-center justify-between">
                      <DollarSign className="h-3 w-3 text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-500 tracking-tight">{mesa.total}</span>
                    </div>
                    {mesa.status === "chamando" && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 bg-red-500/5 p-2 rounded border border-red-500/20">
                        <MessageSquare className="h-3 w-3" />
                        GARÇOM CHAMADO!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] text-[#666]">
                    <Users className="h-3 w-3" />
                    Capacidade: {mesa.capacidade}
                  </div>
                )}

                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-[#222]">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] text-[#888] hover:text-[#ff5e1e] hover:bg-[#ff5e1e]/10">
                    Detalhes
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-[#666]">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
