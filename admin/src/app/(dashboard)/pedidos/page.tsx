"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  ChevronRight,
  AlertCircle,
  Utensils,
  User,
  GripVertical,
  Loader2,
  Volume2,
  VolumeX,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/lib/supabase";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { OrderDetailModal } from "@/components/order-detail-modal";

interface ItemPedido {
  id: string;
  quantidade: number;
  nome_produto: string;
  nome_variacao: string | null;
  servido: boolean;
}

interface PedidoRaw {
  id: string;
  comanda_id: string;
  numero_pedido: number;
  numero_mesa: number;
  nome_pessoa: string | null;
  status: "recebido" | "preparando" | "pronto" | "entregue";
  total: number;
  criado_em: string;
  itens_pedido: ItemPedido[];
}

// Grouped view: one card per comanda
export interface ComandaAgrupada {
  comanda_id: string;
  numero_mesa: number;
  status: "recebido" | "preparando" | "pronto" | "entregue";
  total: number;
  criado_em: string; // earliest pedido
  pedido_ids: string[];
  numero_pedido: number; // lowest numero_pedido in the group
  pessoas: {
    nome: string;
    subtotal: number;
    itens: ItemPedido[];
  }[];
}

const STATUS_ORDER = ["recebido", "preparando", "pronto", "entregue"];

const COLUMNS = [
  { id: "recebido", label: "Recebidos", color: "bg-blue-500/10 text-blue-500" },
  { id: "preparando", label: "Preparando", color: "bg-amber-500/10 text-amber-500" },
  { id: "pronto", label: "Servido", color: "bg-emerald-500/10 text-emerald-500" },
  { id: "entregue", label: "Histórico Hoje", color: "bg-zinc-500/10 text-zinc-500" },
];

type ColumnsState = Record<string, ComandaAgrupada[]>;

function formatElapsedTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}m`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return `${hours}h${mins > 0 ? `${mins}m` : ""}`;
}

function groupPedidosByComanda(pedidos: PedidoRaw[]): ComandaAgrupada[] {
  const map = new Map<string, PedidoRaw[]>();
  pedidos.forEach((p) => {
    const existing = map.get(p.comanda_id) || [];
    existing.push(p);
    map.set(p.comanda_id, existing);
  });

  return Array.from(map.values()).map((group) => {
    // Status: use the "lowest" (earliest in pipeline) status among all pedidos
    const lowestStatusIdx = Math.min(
      ...group.map((p) => STATUS_ORDER.indexOf(p.status))
    );
    const status = STATUS_ORDER[lowestStatusIdx] as ComandaAgrupada["status"];

    const total = group.reduce((sum, p) => sum + Number(p.total), 0);
    const earliestDate = group.reduce(
      (min, p) => (p.criado_em < min ? p.criado_em : min),
      group[0].criado_em
    );
    const lowestPedidoNum = Math.min(...group.map((p) => p.numero_pedido));

    // Group items by person with subtotals
    const pessoasMap = new Map<string, { itens: ItemPedido[]; subtotal: number }>();
    group.forEach((p) => {
      const nome = p.nome_pessoa || "Cliente";
      const existing = pessoasMap.get(nome) || { itens: [], subtotal: 0 };
      existing.itens.push(...p.itens_pedido);
      existing.subtotal += Number(p.total);
      pessoasMap.set(nome, existing);
    });

    const pessoas = Array.from(pessoasMap.entries()).map(([nome, data]) => ({
      nome,
      subtotal: data.subtotal,
      itens: data.itens,
    }));

    return {
      comanda_id: group[0].comanda_id,
      numero_mesa: group[0].numero_mesa,
      status,
      total,
      criado_em: earliestDate,
      pedido_ids: group.map((p) => p.id),
      numero_pedido: lowestPedidoNum,
      pessoas,
    };
  });
}

function groupByStatus(comandas: ComandaAgrupada[]): ColumnsState {
  const grouped: ColumnsState = {
    recebido: [],
    preparando: [],
    pronto: [],
    entregue: [],
  };
  comandas.forEach((c) => {
    if (grouped[c.status]) grouped[c.status].push(c);
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
  const { playSound, enabled: soundEnabled, toggleSound } = useNotificationSound();
  const [selectedComanda, setSelectedComanda] = useState<ComandaAgrupada | null>(null);

  const fetchPedidos = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("pedidos")
      .select("id, comanda_id, numero_pedido, numero_mesa, nome_pessoa, status, total, criado_em, itens_pedido (id, quantidade, nome_produto, nome_variacao, servido)")
      .gte("criado_em", today.toISOString())
      .order("criado_em", { ascending: true });

    if (error) {
      console.error("Erro ao buscar pedidos:", error);
      return;
    }

    if (data) {
      const comandas = groupPedidosByComanda(data as PedidoRaw[]);
      setColumns(groupByStatus(comandas));
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
          playSound();
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
  }, [fetchPedidos, playSound]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update elapsed time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
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

    if (source.droppableId !== destination.droppableId) {
      movedItem.status = destination.droppableId as ComandaAgrupada["status"];
      // If moving to pronto/entregue, mark all items as served
      if (destination.droppableId === "pronto" || destination.droppableId === "entregue") {
        movedItem.pessoas = movedItem.pessoas.map((p) => ({
          ...p,
          itens: p.itens.map((item) => ({ ...item, servido: true })),
        }));
      }
    }
    destCol.splice(destination.index, 0, movedItem);

    setColumns({
      ...columns,
      [source.droppableId]: sourceCol,
      [destination.droppableId]: destCol,
    });

    // Persist status + mark items served if moving to pronto/entregue
    if (source.droppableId !== destination.droppableId) {
      const { error } = await supabase
        .from("pedidos")
        .update({ status: destination.droppableId })
        .in("id", movedItem.pedido_ids);

      if (error) {
        console.error("Erro ao atualizar status:", error);
        fetchPedidos();
        return;
      }

      // Bulk mark all items as served in DB
      if (destination.droppableId === "pronto" || destination.droppableId === "entregue") {
        const allItemIds = movedItem.pessoas.flatMap((p) => p.itens.map((i) => i.id));
        await supabase
          .from("itens_pedido")
          .update({ servido: true })
          .in("id", allItemIds);
      }
    }
  };

  const moveToNextColumn = async (comanda: ComandaAgrupada) => {
    const currentIdx = STATUS_ORDER.indexOf(comanda.status);
    if (currentIdx >= STATUS_ORDER.length - 1) return;

    const nextStatus = STATUS_ORDER[currentIdx + 1];

    // If moving to pronto/entregue, mark all items served in optimistic UI
    const updatedComanda = { ...comanda, status: nextStatus as ComandaAgrupada["status"] };
    if (nextStatus === "pronto" || nextStatus === "entregue") {
      updatedComanda.pessoas = updatedComanda.pessoas.map((p) => ({
        ...p,
        itens: p.itens.map((item) => ({ ...item, servido: true })),
      }));
    }

    setColumns((prev) => {
      const updated = { ...prev };
      updated[comanda.status] = prev[comanda.status].filter((c) => c.comanda_id !== comanda.comanda_id);
      updated[nextStatus] = [...prev[nextStatus], updatedComanda];
      return updated;
    });

    const { error } = await supabase
      .from("pedidos")
      .update({ status: nextStatus })
      .in("id", comanda.pedido_ids);

    if (error) {
      console.error("Erro ao mover pedido:", error);
      fetchPedidos();
      return;
    }

    // Bulk mark all items served in DB
    if (nextStatus === "pronto" || nextStatus === "entregue") {
      const allItemIds = comanda.pessoas.flatMap((p) => p.itens.map((i) => i.id));
      await supabase
        .from("itens_pedido")
        .update({ servido: true })
        .in("id", allItemIds);
    }
  };

  const getActionLabel = (status: string) => {
    switch (status) {
      case "recebido":
        return "Preparar →";
      case "preparando":
        return "Pronto →";
      case "pronto":
        return "Concluir →";
      default:
        return null;
    }
  };

  const toggleItemServido = async (itemId: string, currentValue: boolean) => {
    // Optimistic update
    setColumns((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].map((c) => ({
          ...c,
          pessoas: c.pessoas.map((p) => ({
            ...p,
            itens: p.itens.map((item) =>
              item.id === itemId ? { ...item, servido: !currentValue } : item
            ),
          })),
        }));
      }
      return updated;
    });

    // Update selected comanda symmetrically if open
    setSelectedComanda((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pessoas: prev.pessoas.map((p) => ({
          ...p,
          itens: p.itens.map((item) =>
            item.id === itemId ? { ...item, servido: !currentValue } : item
          ),
        })),
      };
    });

    const { error } = await supabase
      .from("itens_pedido")
      .update({ servido: !currentValue })
      .eq("id", itemId);

    if (error) {
      console.error("Erro ao marcar item:", error);
      fetchPedidos();
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

  const totalComandas = Object.values(columns).flat().length;

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Header / Subnav */}
      <div className="h-14 border-b px-6 flex items-center justify-between bg-card z-10 shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Pedidos</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-semibold">Kanban Live</span>
          {totalComandas > 0 && (
            <Badge variant="outline" className="ml-2 bg-muted border-none text-muted-foreground px-1.5 h-5 text-[10px]">
              {totalComandas} hoje
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none px-2 py-0 h-5 text-[10px] font-bold">
            REALTIME ON
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 rounded-md transition-colors ${soundEnabled
              ? "text-brand hover:bg-brand/10"
              : "text-muted-foreground hover:bg-muted"
              }`}
            onClick={toggleSound}
            title={soundEnabled ? "Desativar som" : "Ativar som"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 p-6 overflow-x-auto overflow-y-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-[1200px] items-stretch pb-4">
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex-1 min-w-[280px] max-w-[320px] flex flex-col gap-4">
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
                      className={`flex-1 flex flex-col gap-3 rounded-xl p-2 border transition-colors min-h-[150px] ${snapshot.isDraggingOver ? "bg-muted/50 border-primary/20" : "bg-muted/30 border-transparent"
                        }`}
                    >
                      {columns[column.id].length === 0 && (
                        <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
                          Nenhum pedido
                        </div>
                      )}

                      {columns[column.id].map((comanda, index) => {
                        const elapsed = formatElapsedTime(comanda.criado_em);
                        const diffMin = Math.floor((Date.now() - new Date(comanda.criado_em).getTime()) / 60000);
                        const isUrgent = comanda.status === "preparando" && diffMin > 15;
                        const actionLabel = getActionLabel(comanda.status);

                        return (
                          <Draggable key={comanda.comanda_id} draggableId={comanda.comanda_id} index={index}>
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
                                <Card
                                  className={`bg-card border-border hover:border-border/80 transition-shadow cursor-grab active:cursor-grabbing group ${snapshot.isDragging ? "shadow-lg scale-[1.02] rotate-1 ring-1 ring-primary/20" : "shadow-xs"
                                  }`}
                                  onClick={() => setSelectedComanda(comanda)}
                                >
                                  <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                                          <Utensils className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <span className="font-semibold text-sm tracking-tight text-foreground">
                                          Mesa {String(comanda.numero_mesa).padStart(2, "0")}
                                        </span>
                                      </div>
                                      <div className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border ${isUrgent ? "text-red-500 bg-red-500/10 border-red-500/20" : "text-muted-foreground bg-muted"}`}>
                                        <Clock className="h-3 w-3" />
                                        {elapsed}
                                      </div>
                                    </div>

                                    {/* Items grouped by person */}
                                    <div className="divide-y divide-border">
                                      {comanda.pessoas.map((pessoa) => (
                                        <div key={pessoa.nome} className="space-y-1 py-2 first:pt-0 last:pb-0">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px] text-brand font-semibold">
                                              <User className="h-3 w-3 shrink-0" />
                                              {pessoa.nome}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                              R$ {pessoa.subtotal.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="space-y-1 pl-[18px]">
                                            {pessoa.itens.map((item) => {
                                              const isServed = item.servido || comanda.status === "pronto" || comanda.status === "entregue";
                                              return (
                                                <div
                                                  key={item.id}
                                                  className="flex items-center gap-2 w-full text-left group/item"
                                                >
                                                  <div
                                                    role="button"
                                                    className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-all cursor-pointer ${isServed
                                                        ? "bg-emerald-500 border-emerald-500"
                                                        : "border-muted-foreground/30 hover:border-muted-foreground/60"
                                                      }`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (comanda.status !== "entregue") {
                                                        toggleItemServido(item.id, item.servido);
                                                      }
                                                    }}
                                                  >
                                                    {isServed && <Check className="h-3 w-3 text-white" />}
                                                  </div>
                                                  <span className={`text-xs leading-relaxed transition-colors ${isServed
                                                      ? "text-emerald-500 font-medium"
                                                      : "text-muted-foreground"
                                                    }`}>
                                                    {item.quantidade}x {item.nome_produto}
                                                    {item.nome_variacao && <span className="opacity-60"> ({item.nome_variacao})</span>}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
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
                                      R$ {Number(comanda.total).toFixed(2)}
                                    </div>
                                    {actionLabel && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[10px] font-bold text-primary hover:bg-primary/10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveToNextColumn(comanda);
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

      <OrderDetailModal
        comanda={selectedComanda}
        open={!!selectedComanda}
        onOpenChange={(open) => { if (!open) setSelectedComanda(null); }}
        onToggleItemServido={toggleItemServido}
      />
    </div>
  );
}
