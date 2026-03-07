"use client";

import { useState } from "react";
import {
  Clock,
  MoreHorizontal,
  ChevronRight,
  AlertCircle,
  Utensils,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Pedido {
  id: string;
  mesa: string;
  itens: string[];
  tempo: string;
  status: "recebido" | "preparando" | "pronto" | "entregue";
  urgente?: boolean;
}

const mockPedidos: Pedido[] = [
  { id: "1", mesa: "Mesa 04", itens: ["2x Chopp", "1x Picanha"], tempo: "2m", status: "recebido" },
  { id: "2", mesa: "Mesa 12", itens: ["1x Caipirinha"], tempo: "5m", status: "preparando" },
  { id: "3", mesa: "Mesa 02", itens: ["1x Pastel Queijo"], tempo: "12m", status: "pronto" },
  { id: "4", mesa: "Mesa 07", itens: ["3x Burger", "1x Fritas"], tempo: "1m", status: "recebido", urgente: true },
];

const COLUMNS = [
  { id: "recebido", label: "Recebidos", color: "bg-blue-500/10 text-blue-500" },
  { id: "preparando", label: "Preparando", color: "bg-amber-500/10 text-amber-500" },
  { id: "pronto", label: "Prontos", color: "bg-emerald-500/10 text-emerald-500" },
  { id: "entregue", label: "Histórico Hoje", color: "bg-zinc-500/10 text-zinc-500" },
];

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>(mockPedidos);

  const getColumnPedidos = (status: string) => pedidos.filter(p => p.status === status);

  return (
    <div className="flex-1 flex flex-col bg-[#0D0D0D] text-[#EDEDED] min-h-screen">
      {/* Header / Subnav */}
      <div className="h-14 border-b border-[#222] px-6 flex items-center justify-between bg-[#111]">
        <div className="flex items-center gap-2 text-sm text-[#666]">
          <span>Pedidos</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-[#EDEDED] font-medium">Kanban Live</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0 h-5 text-[10px] font-bold">
            REALTIME ON
          </Badge>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 p-6 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-[1200px]">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex-1 min-w-[280px] flex flex-col gap-4">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#666]">
                    {column.label}
                  </h3>
                  <Badge variant="outline" className="bg-[#222] border-none text-[#999] px-1.5 h-5 text-[10px]">
                    {getColumnPedidos(column.id).length}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-[#666] hover:text-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              {/* Cards Container */}
              <div className="flex-1 flex flex-col gap-3 rounded-xl bg-[#161616]/50 p-2 border border-[#222]/50">
                {getColumnPedidos(column.id).map((pedido) => (
                  <Card key={pedido.id} className="bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#333] transition-colors cursor-pointer group">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-md bg-[#222] flex items-center justify-center">
                            <Utensils className="h-4 w-4 text-[#888]" />
                          </div>
                          <span className="font-bold text-sm tracking-tight text-[#F9F6EE]">{pedido.mesa}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#666] font-medium bg-[#0D0D0D] px-2 py-1 rounded-full border border-[#222]">
                          <Clock className="h-3 w-3" />
                          {pedido.tempo}
                        </div>
                      </div>

                      <div className="space-y-1">
                        {pedido.itens.map((item, idx) => (
                          <p key={idx} className="text-xs text-[#a1a1aa] leading-relaxed">
                            {item}
                          </p>
                        ))}
                      </div>

                      {pedido.urgente && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#ff5e1e] uppercase tracking-wider bg-[#ff5e1e]/10 px-2 py-1 rounded w-fit">
                          <AlertCircle className="h-3 w-3" />
                          PRIORIDADE ALTA
                        </div>
                      )}
                    </CardContent>
                    <Separator className="bg-[#222]" />
                    <CardFooter className="px-4 py-3 flex justify-between items-center group-hover:bg-[#222]/30 transition-colors">
                      <div className="flex items-center gap-2 text-[10px] text-[#666]">
                        <User className="h-3 w-3" />
                        #8129
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-blue-500 hover:text-blue-400 hover:bg-blue-500/10">
                        Mover Próximo <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}

                <Button variant="ghost" className="w-full border border-dashed border-[#222] text-[#666] hover:text-[#999] hover:bg-transparent h-10 text-xs">
                  + Adicionar Pedido Manual
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
