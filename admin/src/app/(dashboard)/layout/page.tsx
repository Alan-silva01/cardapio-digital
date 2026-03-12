"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { Loader2, MapPin, Maximize2, ZoomIn, ZoomOut, RotateCcw, Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { startOfDay, endOfDay } from "date-fns";
import { useDraggable } from "@dnd-kit/core";

// ── Types ──
interface MesaLayout {
  id: string;
  numero_mesa: number;
  pos_x: number;
  pos_y: number;
  grupo_id: string | null;
}

interface ActiveMesa {
  numero_mesa: number;
  count: number;
  total: number;
}

// ── Constants ──
const MESA_SIZE = 48; // Compact size for 24 tables
const CANVAS_W = 1000;
const CANVAS_H = 700;
const WALL_COLOR = "#EC662D";
const WALL_THICKNESS = 24; // User requested 4x thicker than previous (which was 8, let's make it 24 to be safe)

// ── Draggable Mesa Component ──
function DraggableMesa({
  mesa,
  isActive,
  activeInfo,
  isGrouped,
  isDragging,
  onStartLink,
  linkMode,
}: {
  mesa: MesaLayout;
  isActive: boolean;
  activeInfo?: ActiveMesa;
  isGrouped: boolean;
  isDragging: boolean;
  onStartLink: () => void;
  linkMode: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none transition-all duration-300",
        "bg-background text-foreground", // Use theme background
        isActive
          ? "border-[3px] border-[#EC662D] shadow-[0_0_15px_#EC662D]" // Neon glow
          : "border-[3px] border-[#EC662D]/70 hover:border-[#EC662D]", // Orange borders like the reference
        isGrouped && "border-dashed",
        isDragging && "opacity-60 scale-105 shadow-2xl z-50",
        linkMode && "ring-4 ring-[#EC662D]/50 ring-offset-2 ring-offset-background z-40"
      )}
      style={{
        width: MESA_SIZE,
        height: MESA_SIZE,
        left: mesa.pos_x,
        top: mesa.pos_y,
        borderRadius: "6px",
      }}
    >
      <span className="text-[14px] font-bold leading-none tracking-tighter">
        {String(mesa.numero_mesa).padStart(2, "0")}
      </span>
      {isActive && activeInfo && (
        <span className="absolute -bottom-5 w-[200%] text-center left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#EC662D] whitespace-nowrap bg-background/80 px-1 rounded-sm">
          {activeInfo.count} ped.
        </span>
      )}
    </div>
  );
}

// ── Overlay during drag ──
function MesaOverlay({ mesa, isActive }: { mesa: MesaLayout; isActive: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border-[3px] shadow-[0_20px_25px_-5px_rgb(0_0_0_/_0.5)] z-50",
        "bg-background text-foreground",
        isActive ? "border-[#EC662D] shadow-[0_0_20px_#EC662D]" : "border-[#EC662D]/90"
      )}
      style={{ width: MESA_SIZE, height: MESA_SIZE, borderRadius: "6px" }}
    >
      <span className="text-[14px] font-bold leading-none tracking-tighter">
        {String(mesa.numero_mesa).padStart(2, "0")}
      </span>
    </div>
  );
}

// ── Wrapper that uses dnd-kit's useDraggable ──
function DraggableMesaWrapper(props: {
  mesa: MesaLayout;
  isActive: boolean;
  activeInfo?: ActiveMesa;
  isGrouped: boolean;
  isDragging: boolean;
  onStartLink: () => void;
  linkMode: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.mesa.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="z-10">
      <DraggableMesa {...props} />
    </div>
  );
}

// ── Main Component ──
export default function LayoutPage() {
  const supabase = useMemo(() => createClient(), []);
  const [mesas, setMesas] = useState<MesaLayout[]>([]);
  const [activeMesas, setActiveMesas] = useState<ActiveMesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkSource, setLinkSource] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  );

  // ── Fetch layout + active orders ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const todayStart = startOfDay(now).toISOString();
    const todayEnd = endOfDay(now).toISOString();

    const [layoutRes, pedidosRes] = await Promise.all([
      supabase
        .from("mesa_layout")
        .select("id, numero_mesa, pos_x, pos_y, grupo_id")
        .order("numero_mesa"),
      supabase
        .from("pedidos")
        .select("numero_mesa, total")
        .gte("criado_em", todayStart)
        .lte("criado_em", todayEnd)
        .not("status", "in", '("cancelado","entregue")'),
    ]);

    if (layoutRes.data) setMesas(layoutRes.data);

    if (pedidosRes.data) {
      const map = new Map<number, { count: number; total: number }>();
      pedidosRes.data.forEach((p: any) => {
        const existing = map.get(p.numero_mesa) || { count: 0, total: 0 };
        existing.count++;
        existing.total += Number(p.total);
        map.set(p.numero_mesa, existing);
      });
      setActiveMesas(
        Array.from(map.entries()).map(([numero_mesa, data]) => ({
          numero_mesa,
          ...data,
        }))
      );
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Drag handlers ──
  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggingId(null);
    const { active, delta } = event;
    const mesaId = active.id as string;

    setMesas((prev) =>
      prev.map((m) => {
        if (m.id !== mesaId) return m;
        const newX = Math.max(0, Math.min(CANVAS_W - MESA_SIZE, m.pos_x + delta.x / zoom));
        const newY = Math.max(0, Math.min(CANVAS_H - MESA_SIZE, m.pos_y + delta.y / zoom));
        const updated = { ...m, pos_x: newX, pos_y: newY };

        // Persist to Supabase
        supabase
          .from("mesa_layout")
          .update({ pos_x: newX, pos_y: newY })
          .eq("id", mesaId)
          .then();

        return updated;
      })
    );
  };

  // ── Link/unlink mesas ──
  const handleMesaClick = async (mesaId: string) => {
    if (!linkMode) return;

    if (!linkSource) {
      setLinkSource(mesaId);
      return;
    }

    if (linkSource === mesaId) {
      setLinkSource(null);
      return;
    }

    // Link the two mesas with a shared grupo_id
    const sourceMesa = mesas.find((m) => m.id === linkSource);
    const targetMesa = mesas.find((m) => m.id === mesaId);
    if (!sourceMesa || !targetMesa) return;

    const grupoId = sourceMesa.grupo_id || targetMesa.grupo_id || crypto.randomUUID();

    await supabase
      .from("mesa_layout")
      .update({ grupo_id: grupoId })
      .in("id", [linkSource, mesaId]);

    setMesas((prev) =>
      prev.map((m) =>
        m.id === linkSource || m.id === mesaId
          ? { ...m, grupo_id: grupoId }
          : m
      )
    );

    setLinkSource(null);
    setLinkMode(false);
  };

  const handleUnlinkMesa = async (mesaId: string) => {
    const mesa = mesas.find((m) => m.id === mesaId);
    if (!mesa?.grupo_id) return;

    await supabase
      .from("mesa_layout")
      .update({ grupo_id: null })
      .eq("id", mesaId);

    setMesas((prev) =>
      prev.map((m) => (m.id === mesaId ? { ...m, grupo_id: null } : m))
    );
  };

  const handleResetPositions = async () => {
    // Put them all neatly in the center of the main room so they are visible!
    const promises = mesas.map((m, index) => {
      // 24 tables grid in the main hall
      const col = index % 8; // 8 per row
      const row = Math.floor(index / 8); // 3 rows
      const startX = 250; // Start inside the main hall
      const startY = 300; 
      const x = startX + col * 80;
      const y = startY + row * 80;

      return supabase
        .from("mesa_layout")
        .update({ pos_x: x, pos_y: y, grupo_id: null })
        .eq("id", m.id);
    });

    await Promise.all(promises);
    fetchData();
  };

  // ── Derived data ──
  const activeSet = useMemo(
    () => new Set(activeMesas.map((a) => a.numero_mesa)),
    [activeMesas]
  );

  const activeMap = useMemo(
    () => new Map(activeMesas.map((a) => [a.numero_mesa, a])),
    [activeMesas]
  );

  const draggingMesa = useMemo(
    () => mesas.find((m) => m.id === draggingId),
    [mesas, draggingId]
  );

  // ── Group lines (SVG connections between grouped mesas) ──
  const groupLines = useMemo(() => {
    const groups = new Map<string, MesaLayout[]>();
    mesas.forEach((m) => {
      if (m.grupo_id) {
        const group = groups.get(m.grupo_id) || [];
        group.push(m);
        groups.set(m.grupo_id, group);
      }
    });

    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    groups.forEach((members) => {
      for (let i = 0; i < members.length - 1; i++) {
        for (let j = i + 1; j < members.length; j++) {
          lines.push({
            x1: members[i].pos_x + MESA_SIZE / 2,
            y1: members[i].pos_y + MESA_SIZE / 2,
            x2: members[j].pos_x + MESA_SIZE / 2,
            y2: members[j].pos_y + MESA_SIZE / 2,
          });
        }
      }
    });
    return lines;
  }, [mesas]);

  // ── Active mesa stats ──
  const totalActive = activeMesas.length > 0 ? activeMesas.reduce((s, a) => s + a.count, 0) : 0;
  const mesasOcupadas = activeSet.size;

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2.75rem)] w-full overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between border-b border-border shadow-sm z-10 bg-card gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            Planta Baixa (24 Mesas)
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-medium">
            {mesasOcupadas} mesa{mesasOcupadas !== 1 ? "s" : ""} ocupada{mesasOcupadas !== 1 ? "s" : ""} · {totalActive} pedido{totalActive !== 1 ? "s" : ""} ativo{totalActive !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={linkMode ? "default" : "outline"}
            size="sm"
            className={cn("h-9 text-xs gap-1.5 font-semibold transition-all", linkMode && "bg-[#EC662D] hover:bg-[#EC662D]/90 text-white shadow-md")}
            onClick={() => {
              setLinkMode(!linkMode);
              setLinkSource(null);
            }}
          >
            <Link2 className="h-4 w-4" />
            {linkMode ? "Selecione a 2ª Mesa..." : "Juntar Mesas"}
          </Button>
          <div className="flex items-center gap-0.5 bg-muted/30 rounded-md border border-border p-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-background/80" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] font-mono font-medium text-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-background/80" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 font-semibold" onClick={() => setZoom(1)}>
            <Maximize2 className="h-3.5 w-3.5" />
            Ajustar
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 font-semibold text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleResetPositions}>
            <RotateCcw className="h-3.5 w-3.5" />
            Resetar
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-2.5 flex flex-wrap items-center gap-5 text-[12px] font-medium text-muted-foreground border-b border-border/50 shrink-0 bg-muted/10 z-10">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[4px] border-2 border-[#EC662D]/70 bg-card" />
          <span>Livre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[4px] border-[2px] border-[#EC662D] bg-card shadow-[0_0_8px_#EC662D]" />
          <span className="text-foreground">Com pedidos</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[4px] border-2 border-dashed border-[#EC662D]/70 bg-card" />
          <span>Juntas</span>
        </div>
        {linkMode && (
          <Badge className="bg-[#EC662D]/10 text-[#EC662D] border-[#EC662D]/30 text-[11px] animate-pulse">
            Selecione 2 mesas para agrupar (Duplo-clique para soltar)
          </Badge>
        )}
      </div>

      {/* Canvas Area - Themed background */}
      <div className="flex-1 overflow-auto bg-background flex items-center justify-center p-8 relative" ref={canvasRef}>
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div
            className="relative rounded-sm overflow-hidden"
            style={{
              width: CANVAS_W * zoom,
              height: CANVAS_H * zoom,
              background: "transparent",
            }}
          >
            {/* SVG layer: Thick blueprint walls like the reference */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={CANVAS_W * zoom}
              height={CANVAS_H * zoom}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            >
              <defs>
                <filter id="wallShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.4"/>
                </filter>
              </defs>

              {/* Group connection lines (drawn below tables) */}
              {groupLines.map((line, i) => (
                <line
                  key={i}
                  x1={line.x1} y1={line.y1}
                  x2={line.x2} y2={line.y2}
                  stroke={WALL_COLOR}
                  strokeWidth="4"
                  strokeDasharray="8 6"
                  opacity="0.8"
                />
              ))}

              {/* Blueprint Walls Structure - styled like the reference image */}
              <g filter="url(#wallShadow)">
                {/* Outer perimeter with openings for entrance and patio */}
                <path 
                  d={`M 40,40 L ${CANVAS_W - 40},40 L ${CANVAS_W - 40},${CANVAS_H - 40} L 40,${CANVAS_H - 40} Z`} 
                  fill="none" 
                  stroke={WALL_COLOR} 
                  strokeWidth={WALL_THICKNESS} 
                  strokeDasharray={`${CANVAS_W-80} 0 0 0 0 0 ${CANVAS_W/2 - 100} 100 1000`} /* Creates a gap for entrance at the bottom */
                />

                {/* Left side rooms (Kitchen and Work Area) */}
                <path d="M 40,300 L 250,300 L 250,40" fill="none" stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                <path d="M 40,150 L 150,150 L 150,40" fill="none" stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                
                {/* Bar area (Top Right) */}
                <path d={`M ${CANVAS_W - 250},40 L ${CANVAS_W - 250},180 L ${CANVAS_W - 40},180`} fill="none" stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                
                {/* Toilets (Bottom Right) */}
                <path d={`M ${CANVAS_W - 200},${CANVAS_H - 40} L ${CANVAS_W - 200},${CANVAS_H - 180} L ${CANVAS_W - 40},${CANVAS_H - 180}`} fill="none" stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                <path d={`M ${CANVAS_W - 120},${CANVAS_H - 40} L ${CANVAS_W - 120},${CANVAS_H - 180}`} fill="none" stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                
                {/* Middle partitions / columns */}
                <line x1={400} y1={40} x2={400} y2={100} stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                <line x1={400} y1={250} x2={400} y2={350} stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                <line x1={400} y1={500} x2={400} y2={CANVAS_H - 40} stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
              </g>

              {/* Room Labels */}
              <text x="145" y="230" textAnchor="middle" fill="#EC662D" opacity="0.4" fontSize="16" fontWeight="bold" letterSpacing="2">COZINHA</text>
              <text x="95" y="105" textAnchor="middle" fill="#EC662D" opacity="0.4" fontSize="12" fontWeight="bold" letterSpacing="1">PREPARO</text>
              <text x={CANVAS_W - 145} y="115" textAnchor="middle" fill="#EC662D" opacity="0.4" fontSize="16" fontWeight="bold" letterSpacing="2">BAR</text>
              <text x={CANVAS_W - 80} y={CANVAS_H - 105} textAnchor="middle" fill="#EC662D" opacity="0.4" fontSize="14" fontWeight="bold" letterSpacing="1">WC FEM</text>
              <text x={CANVAS_W - 160} y={CANVAS_H - 105} textAnchor="middle" fill="#EC662D" opacity="0.4" fontSize="14" fontWeight="bold" letterSpacing="1">WC MASC</text>
              <text x={CANVAS_W / 2} y={CANVAS_H - 55} textAnchor="middle" fill="#EC662D" opacity="0.4" fontSize="16" fontWeight="bold" letterSpacing="4">ENTRADA PRINCIPAL</text>
              <text x={CANVAS_W / 2 + 50} y={CANVAS_H / 2} textAnchor="middle" fill="#EC662D" opacity="0.15" fontSize="36" fontWeight="bold" letterSpacing="8">SALÃO PRINCIPAL</text>
            </svg>

            {/* Mesas layer */}
            <div
              className="absolute inset-0"
              style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
            >
              {mesas.map((mesa) => {
                const isActive = activeSet.has(mesa.numero_mesa);
                const isGrouped = !!mesa.grupo_id;

                return (
                  <div
                    key={mesa.id}
                    data-id={mesa.id}
                    onClick={() => handleMesaClick(mesa.id)}
                    onDoubleClick={() => handleUnlinkMesa(mesa.id)}
                    className="absolute z-10"
                    style={{ left: mesa.pos_x, top: mesa.pos_y }} // Added absolute pos wrapper for draggable reset issues sometimes
                  >
                    <DraggableMesaWrapper
                      mesa={{...mesa, pos_x: 0, pos_y: 0}} // Draggable hook handles transform from 0,0 locally
                      isActive={isActive}
                      activeInfo={activeMap.get(mesa.numero_mesa)}
                      isGrouped={isGrouped}
                      isDragging={draggingId === mesa.id}
                      onStartLink={() => handleMesaClick(mesa.id)}
                      linkMode={linkMode && linkSource === mesa.id}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drag overlay for smooth drag animation */}
          <DragOverlay>
            {draggingMesa && (
              <MesaOverlay
                mesa={{...draggingMesa, pos_x: 0, pos_y: 0}}
                isActive={activeSet.has(draggingMesa.numero_mesa)}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
