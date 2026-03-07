"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  MoreHorizontal,
  ChevronRight,
  AlertCircle,
  Utensils,
  User,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

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

type ColumnsState = Record<string, Pedido[]>;

export default function PedidosPage() {
  const [mounted, setMounted] = useState(false);

  // Initialize columns state grouped by status
  const [columns, setColumns] = useState<ColumnsState>(() => {
    const initial: ColumnsState = {
      recebido: [],
      preparando: [],
      pronto: [],
      entregue: []
    };
    mockPedidos.forEach(p => {
      if (initial[p.status]) initial[p.status].push(p);
    });
    return initial;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceCol = [...columns[source.droppableId]];
    const destCol = source.droppableId === destination.droppableId ? sourceCol : [...columns[destination.droppableId]];

    const [movedItem] = sourceCol.splice(source.index, 1);

    // Update status if moved to a different column
    if (source.droppableId !== destination.droppableId) {
      movedItem.status = destination.droppableId as any;
    }

    destCol.splice(destination.index, 0, movedItem);

    setColumns({
      ...columns,
      [source.droppableId]: sourceCol,
      [destination.droppableId]: destCol,
    });
  };

  if (!mounted) {
    return null; // Prevents hydration mismatch with dnd-kit/react-beautiful-dnd in Next.js
  }

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground min-h-screen">
      {/* Header / Subnav */}
      <div className="h-14 border-b px-6 flex items-center justify-between bg-card z-10 shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Pedidos</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-semibold">Kanban Live</span>
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
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
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
                      {columns[column.id].map((pedido, index) => (
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
                                      <span className="font-semibold text-sm tracking-tight text-foreground">{pedido.mesa}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium bg-muted px-2 py-1 rounded-full border">
                                      <Clock className="h-3 w-3" />
                                      {pedido.tempo}
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    {pedido.itens.map((item, idx) => (
                                      <p key={idx} className="text-xs text-muted-foreground leading-relaxed">
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
                                <Separator />
                                <CardFooter className="px-3 py-2 flex justify-between items-center bg-muted/20">
                                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    #{pedido.id.padStart(4, '0')}
                                  </div>
                                  <div className="h-6 w-6 flex items-center justify-center text-muted-foreground/30 group-hover:text-muted-foreground transition-colors">
                                    <GripVertical className="h-3.5 w-3.5" />
                                  </div>
                                </CardFooter>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      <Button variant="ghost" className="w-full border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/50 h-10 text-xs mt-1 shrink-0">
                        + Adicionar Pedido
                      </Button>
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
