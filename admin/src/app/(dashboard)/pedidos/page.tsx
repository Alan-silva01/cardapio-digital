"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  MoreHorizontal,
  ChevronRight,
  AlertCircle,
  Utensils,
  User,
  GripVertical,
  Loader2,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabase";

interface ItemPedido {
  quantidade: number;
  nome_produto: string;
  nome_variacao: string | null;
}

interface Pedido {
  id: string;
  numero_mesa: number;
  nome_pessoa: string | null;
  status: "recebido" | "preparando" | "pronto" | "entregue";
  total: number;
  criado_em: string;
  itens_pedido: ItemPedido[];
}

const COLUMNS = [
  { id: "recebido", label: "Recebidos", color: "bg-blue-500/10 text-blue-500" },
  { id: "preparando", label: "Preparando", color: "bg-amber-500/10 text-amber-500" },
  { id: "pronto", label: "Prontos", color: "bg-emerald-500/10 text-emerald-500" },
  { id: "entregue", label: "Histórico Hoje", color: "bg-zinc-500/10 text-zinc-500" },
];

type ColumnsState = Record<string, Pedido[]>;

function formatElapsedTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}m`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return `${hours}h${mins > 0 ? `${mins}m` : ""}`;
}

function groupByStatus(pedidos: Pedido[]): ColumnsState {
  const grouped: ColumnsState = {
    recebido: [],
    preparando: [],
    pronto: [],
    entregue: [],
  };
  pedidos.forEach((p) => {
    if (grouped[p.status]) grouped[p.status].push(p);
  });
  return grouped;
}

export default function PedidosPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<ColumnsState>({
    recebido: [],
    preparando: [],
    pronto: [],
    entregue: [],
  });

  const fetchPedidos = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("pedidos")
      .select("id, numero_mesa, nome_pessoa, status, total, criado_em, itens_pedido (quantidade, nome_produto, nome_variacao)")
      .gte("criado_em", today.toISOString())
      .order("criado_em", { ascending: true });

    if (error) {
      console.error("Erro ao buscar pedidos:", error);
      return;
    }

    if (data) {
      setColumns(groupByStatus(data as Pedido[]));
    }
    setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-vendas")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pedidos" },
        () => {
          fetchPedidos();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos" },
        () => {
          fetchPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPedidos]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update elapsed time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update time badges
      setColumns((prev) => ({ ...prev }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = [...columns[source.droppableId]];
    const destCol =
      source.droppableId === destination.droppableId
        ? sourceCol
        : [...columns[destination.droppableId]];

    const [movedItem] = sourceCol.splice(source.index, 1);

    // Optimistic UI: update local state immediately
    if (source.droppableId !== destination.droppableId) {
      movedItem.status = destination.droppableId as Pedido["status"];
    }
    destCol.splice(destination.index, 0, movedItem);

    setColumns({
      ...columns,
      [source.droppableId]: sourceCol,
      [destination.droppableId]: destCol,
    });

    // Persist to Supabase
    if (source.droppableId !== destination.droppableId) {
      const { error } = await supabase
        .from("pedidos")
        .update({ status: destination.droppableId })
        .eq("id", movedItem.id);

      if (error) {
        console.error("Erro ao atualizar status:", error);
        // Revert on error
        fetchPedidos();
      }
    }
  };

  const moveToNextColumn = async (pedido: Pedido) => {
    const order = ["recebido", "preparando", "pronto", "entregue"];
    const currentIdx = order.indexOf(pedido.status);
    if (currentIdx >= order.length - 1) return;

    const nextStatus = order[currentIdx + 1];

    // Optimistic UI
    setColumns((prev) => {
      const updated = { ...prev };
      updated[pedido.status] = prev[pedido.status].filter((p) => p.id !== pedido.id);
      updated[nextStatus] = [...prev[nextStatus], { ...pedido, status: nextStatus as Pedido["status"] }];
      return updated;
    });

    const { error } = await supabase
      .from("pedidos")
      .update({ status: nextStatus })
      .eq("id", pedido.id);

    if (error) {
      console.error("Erro ao mover pedido:", error);
      fetchPedidos();
    }
  };

  const getActionLabel = (status: string) => {
    switch (status) {
      case "recebido":
        return "Preparar →";
      case "preparando":
        return "Servir →";
      case "pronto":
        return "Concluir →";
      default:
        return null;
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalPedidos = Object.values(columns).flat().length;

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Header / Subnav */}
      <div className="h-14 border-b px-6 flex items-center justify-between bg-card z-10 shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Pedidos</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-semibold">Kanban Live</span>
          {totalPedidos > 0 && (
            <Badge variant="outline" className="ml-2 bg-muted border-none text-muted-foreground px-1.5 h-5 text-[10px]">
              {totalPedidos} hoje
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0 h-5 text-[10px] font-bold">
            REALTIME ON
          </Badge>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 p-6 overflow-x-auto min-h-0">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-[1200px] items-start pb-4">
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex-1 min-w-[280px] max-w-[320px] flex flex-col gap-4 h-full">
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {column.label}
                    </h3>
                    <Badge variant="outline" className="bg-muted border-none text-muted-foreground px-1.5 h-5 text-[10px]">
                      {columns[column.id].length}
                    </Badge>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 flex flex-col gap-3 rounded-xl p-2 border transition-colors overflow-y-auto min-h-[150px] ${snapshot.isDraggingOver ? "bg-muted/50 border-primary/20" : "bg-muted/30 border-transparent"
                        }`}
                    >
                      {columns[column.id].length === 0 && (
                        <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
                          Nenhum pedido
                        </div>
                      )}

                      {columns[column.id].map((pedido, index) => {
                        const elapsed = formatElapsedTime(pedido.criado_em);
                        const diffMin = Math.floor((Date.now() - new Date(pedido.criado_em).getTime()) / 60000);
                        const isUrgent = pedido.status === "preparando" && diffMin > 15;
                        const actionLabel = getActionLabel(pedido.status);

                        return (
                          <Draggable key={pedido.id} draggableId={pedido.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.9 : 1,
                                }}
                              >
                                <Card className={`bg-card border-border hover:border-border/80 transition-shadow cursor-grab active:cursor-grabbing group ${snapshot.isDragging ? "shadow-lg scale-[1.02] rotate-1 ring-1 ring-primary/20" : "shadow-xs"
                                  }`}>
                                  <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                                          <Utensils className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <span className="font-semibold text-sm tracking-tight text-foreground">
                                          Mesa {String(pedido.numero_mesa).padStart(2, "0")}
                                        </span>
                                      </div>
                                      <div className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border ${isUrgent ? "text-red-500 bg-red-500/10 border-red-500/20" : "text-muted-foreground bg-muted"}`}>
                                        <Clock className="h-3 w-3" />
                                        {elapsed}
                                      </div>
                                    </div>

                                    {pedido.nome_pessoa && (
                                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <User className="h-3 w-3" />
                                        {pedido.nome_pessoa}
                                      </div>
                                    )}

                                    <div className="space-y-1">
                                      {pedido.itens_pedido.map((item, idx) => (
                                        <p key={idx} className="text-xs text-muted-foreground leading-relaxed">
                                          {item.quantidade}x {item.nome_produto}
                                          {item.nome_variacao && <span className="opacity-60"> ({item.nome_variacao})</span>}
                                        </p>
                                      ))}
                                    </div>

                                    {isUrgent && (
                                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-500/10 px-2 py-1 rounded w-fit">
                                        <AlertCircle className="h-3 w-3" />
                                        ATRASADO
                                      </div>
                                    )}
                                  </CardContent>
                                  <Separator />
                                  <CardFooter className="px-3 py-2 flex justify-between items-center bg-muted/20">
                                    <div className="text-[10px] text-muted-foreground font-mono">
                                      R$ {Number(pedido.total).toFixed(2)}
                                    </div>
                                    {actionLabel && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[10px] font-bold text-primary hover:bg-primary/10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveToNextColumn(pedido);
                                        }}
                                      >
                                        {actionLabel}
                                      </Button>
                                    )}
                                    {!actionLabel && (
                                      <div className="h-6 w-6 flex items-center justify-center text-muted-foreground/30 group-hover:text-muted-foreground transition-colors">
                                        <GripVertical className="h-3.5 w-3.5" />
                                      </div>
                                    )}
                                  </CardFooter>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
