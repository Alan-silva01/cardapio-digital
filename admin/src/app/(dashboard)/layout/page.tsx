"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
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

interface VisualGroup {
  id: string; // group_id or mesa_id
  mesas: MesaLayout[];
  x: number;
  y: number;
  capacity: number;
  label: string;
  activeCount: number;
}

// ── Constants ──
const CANVAS_W = 1200;
const CANVAS_H = 800;
const WALL_COLOR = "#EC662D";
const WALL_THICKNESS = 21; // 2.6x thick

function getCapacity(numeroMesa: number) {
  // 6 mesas com 6 lugares, restante 4 lugares
  return numeroMesa <= 6 ? 6 : 4;
}

// ── Draggable Merged Table Component ──
function TableEntity({
  group,
  isActive,
  isDragging,
  linkMode,
  isLinkTarget,
}: {
  group: VisualGroup;
  isActive: boolean;
  isDragging: boolean;
  linkMode: boolean;
  isLinkTarget: boolean;
}) {
  const sideSeats = 2; // Always 1 left, 1 right
  const remainingSeats = Math.max(0, group.capacity - sideSeats);
  const topSeats = Math.ceil(remainingSeats / 2);
  const bottomSeats = remainingSeats - topSeats;
  
  // Base width on topSeats (24px per seat + padding). Minimum table size is 56px to fit numbers nicely.
  const tableWidth = Math.max(56, topSeats * 28 + 16);

  return (
    <div
      className={cn(
        "absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none transition-all duration-300",
        isDragging && "opacity-60 scale-105 z-50",
        linkMode && "z-40"
      )}
      style={{
        left: group.x,
        top: group.y,
        // Center alignment offset handled by wrapper, this is the top-left of the group
      }}
    >
      {/* Top Chairs */}
      <div className="flex justify-center gap-[6px] mb-[-4px] z-0 px-3">
        {Array.from({ length: topSeats }).map((_, i) => (
          <div
            key={`top-${i}`}
            className={cn(
              "w-4 h-3.5 rounded-t-md border-t-2 border-l-2 border-r-2 border-b-0",
              isActive ? "border-[#EC662D]/80 bg-[#EC662D]/10" : "border-muted-foreground/40 bg-card"
            )}
          />
        ))}
      </div>

      <div className="relative flex items-center justify-center">
        {/* Left Chair - Same dimension as top/bottom but rotated visually */}
        <div 
          className={cn(
            "absolute left-[-4px] top-1/2 -translate-y-1/2 w-4 h-[14px] rounded-l-md border-l-2 border-t-2 border-b-2 border-r-0 z-0",
            isActive ? "border-[#EC662D]/80 bg-[#EC662D]/10" : "border-muted-foreground/40 bg-card"
          )} 
        />

        {/* Table Body */}
        <div
          className={cn(
            "relative flex flex-col items-center justify-center rounded-md z-10 transition-colors shadow-sm",
            "bg-card text-foreground", // Themed backgrounds
            isActive
              ? "border-[3px] border-[#EC662D] shadow-[0_0_15px_#EC662D60]" // Neon glow
              : "border-[3px] border-[#EC662D]/60 hover:border-[#EC662D]", // Orange borders
            isLinkTarget && "ring-4 ring-[#EC662D]/50 ring-offset-2 ring-offset-background"
          )}
          style={{ width: tableWidth, height: 48 }}
        >
          <span className="text-[14px] font-bold leading-none tracking-tight whitespace-nowrap overflow-hidden px-2 text-ellipsis max-w-full">
            {group.label}
          </span>
          {isActive && group.activeCount > 0 && (
            <span className="absolute -bottom-6 text-[10px] font-bold text-[#EC662D] whitespace-nowrap bg-background/90 px-1.5 py-0.5 rounded shadow-sm border border-[#EC662D]/30">
              {group.activeCount} ped.
            </span>
          )}
        </div>

        {/* Right Chair - Same dimension as top/bottom but rotated visually */}
        <div 
          className={cn(
            "absolute right-[-4px] top-1/2 -translate-y-1/2 w-4 h-[14px] rounded-r-md border-r-2 border-t-2 border-b-2 border-l-0 z-0",
            isActive ? "border-[#EC662D]/80 bg-[#EC662D]/10" : "border-muted-foreground/40 bg-card"
          )} 
        />
      </div>

      {/* Bottom Chairs */}
      <div className="flex justify-center gap-[6px] mt-[-4px] z-0 px-3">
        {Array.from({ length: bottomSeats }).map((_, i) => (
          <div
            key={`bot-${i}`}
            className={cn(
              "w-4 h-3.5 rounded-b-md border-b-2 border-l-2 border-r-2 border-t-0",
              isActive ? "border-[#EC662D]/80 bg-[#EC662D]/10" : "border-muted-foreground/40 bg-card"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ── Overlay during drag ──
function TableOverlay({ group, isActive }: { group: VisualGroup; isActive: boolean }) {
  const sideSeats = 2; // Always 1 left, 1 right
  const remainingSeats = Math.max(0, group.capacity - sideSeats);
  const topSeats = Math.ceil(remainingSeats / 2);
  const tableWidth = Math.max(56, topSeats * 28 + 16);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center z-50",
        "shadow-[0_20px_25px_-5px_rgb(0_0_0_/_0.5)] scale-105"
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-md border-[3px]",
          "bg-card text-foreground",
          isActive ? "border-[#EC662D] shadow-[0_0_20px_#EC662D]" : "border-[#EC662D]/90"
        )}
        style={{ width: tableWidth, height: 48 }}
      >
        <span className="text-[14px] font-bold leading-none tracking-tight">{group.label}</span>
      </div>
    </div>
  );
}

// ── Wrapper that uses dnd-kit's useDraggable ──
function DraggableGroupWrapper(props: {
  group: VisualGroup;
  isActive: boolean;
  isDragging: boolean;
  linkMode: boolean;
  isLinkTarget: boolean;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: props.group.id,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : {};

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="z-10 absolute outline-none"
         style={{ left: props.group.x, top: props.group.y, ...style }}
         onClick={(e) => {
           // Prevent duplicate click events if bubbling
           e.stopPropagation();
           if (props.onClick) props.onClick();
         }}>
      {/* We pass a cloned group with 0,0 locally because wrapper handles positioning */}
      <TableEntity {...props} group={{ ...props.group, x: 0, y: 0 }} />
    </div>
  );
}

// ── Main Component ──
export default function LayoutPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mesas, setMesas] = useState<MesaLayout[]>([]);
  const [activeMesas, setActiveMesas] = useState<ActiveMesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkSourceId, setLinkSourceId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
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

    // ── Setup Realtime Subscription for Pedidos ──
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'pedidos',
        },
        () => {
          // Whenever a pedido changes, refetch the data to update active counts and glow
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, supabase]);

  // ── Compute Visual Groups ──
  const activeMap = useMemo(
    () => new Map(activeMesas.map((a) => [a.numero_mesa, a])),
    [activeMesas]
  );

  const visualGroups = useMemo<VisualGroup[]>(() => {
    const map = new Map<string, MesaLayout[]>();
    
    mesas.forEach(m => {
      const key = m.grupo_id || `single-${m.id}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });

    return Array.from(map.entries()).map(([key, groupMesas]) => {
      // Sort to have consistent label like "10 + 11"
      groupMesas.sort((a, b) => a.numero_mesa - b.numero_mesa);
      
      const capacity = groupMesas.reduce((sum, m) => sum + getCapacity(m.numero_mesa), 0);
      const label = groupMesas.map(m => String(m.numero_mesa).padStart(2, '0')).join(" + ");
      
      let activeCount = 0;
      groupMesas.forEach(m => {
        const a = activeMap.get(m.numero_mesa);
        if (a) activeCount += a.count;
      });

      // Position is based on the first mesa in the sorted group
      return {
        id: key,
        mesas: groupMesas,
        x: groupMesas[0].pos_x,
        y: groupMesas[0].pos_y,
        capacity,
        label,
        activeCount
      };
    });
  }, [mesas, activeMap]);

  // ── Drag handlers ──
  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggingId(null);
    const { active, delta } = event;
    const groupId = active.id as string;
    
    const group = visualGroups.find(g => g.id === groupId);
    if (!group) return;

    // We only update the position of the first mesa in the group to anchor it
    const anchorMesa = group.mesas[0];
    const newX = Math.max(0, Math.min(CANVAS_W - 100, anchorMesa.pos_x + delta.x / zoom));
    const newY = Math.max(0, Math.min(CANVAS_H - 100, anchorMesa.pos_y + delta.y / zoom));

    setMesas(prev => 
      prev.map(m => m.id === anchorMesa.id ? { ...m, pos_x: newX, pos_y: newY } : m)
    );

    await supabase
      .from("mesa_layout")
      .update({ pos_x: newX, pos_y: newY })
      .eq("id", anchorMesa.id);
  };

  // ── Link/unlink mesas ──
  const handleGroupClick = async (groupId: string) => {
    if (!linkMode) return;

    if (!linkSourceId) {
      setLinkSourceId(groupId);
      return;
    }

    if (linkSourceId === groupId) {
      setLinkSourceId(null);
      return;
    }

    // Merge the two groups
    const sourceGroup = visualGroups.find(g => g.id === linkSourceId);
    const targetGroup = visualGroups.find(g => g.id === groupId);
    
    if (!sourceGroup || !targetGroup) return;

    // Use existing group_id if one already exists, else create new
    const finalGrupoId = sourceGroup.mesas[0].grupo_id || targetGroup.mesas[0].grupo_id || crypto.randomUUID();
    
    const allMesasToUpdate = [...sourceGroup.mesas, ...targetGroup.mesas];
    const mesaIds = allMesasToUpdate.map(m => m.id);

    // Anchor position to the target group
    const anchor = targetGroup.mesas[0];

    // Optimistic UI update
    setMesas(prev => prev.map(m => {
      if (mesaIds.includes(m.id)) {
        return { 
          ...m, 
          grupo_id: finalGrupoId,
          pos_x: m.id === anchor.id ? anchor.pos_x : m.pos_x, // Only anchor really matters 
          pos_y: m.id === anchor.id ? anchor.pos_y : m.pos_y 
        };
      }
      return m;
    }));

    // DB Update
    await supabase
      .from("mesa_layout")
      .update({ grupo_id: finalGrupoId })
      .in("id", mesaIds);

    setLinkSourceId(null);
    setLinkMode(false);
  };

  const handleUnlinkGroup = async (groupId: string) => {
    const group = visualGroups.find(g => g.id === groupId);
    if (!group || group.mesas.length <= 1) return; // Not a group

    const mesaIds = group.mesas.map(m => m.id);

    // Spread them out slightly so they don't overlap completely
    const updates = group.mesas.map((m, idx) => ({
      ...m,
      grupo_id: null,
      pos_x: group.x + (idx * 90),
      pos_y: group.y
    }));

    // Optimistic UI
    setMesas(prev => prev.map(m => {
      const up = updates.find(u => u.id === m.id);
      return up ? up : m;
    }));

    // DB Update
    for (const up of updates) {
      await supabase
        .from("mesa_layout")
        .update({ pos_x: up.pos_x, pos_y: up.pos_y, grupo_id: null })
        .eq("id", up.id);
    }
  };

  const handleResetPositions = async () => {
    // Put them all neatly in the center of the main room so they are visible!
    const promises = mesas.map((m, index) => {
      // 24 tables grid in the main hall
      const col = index % 8; // 8 per row
      const row = Math.floor(index / 8); // 3 rows
      const startX = 250; 
      const startY = 300; 
      const x = startX + col * 90;
      const y = startY + row * 90;

      return supabase
        .from("mesa_layout")
        .update({ pos_x: x, pos_y: y, grupo_id: null })
        .eq("id", m.id);
    });

    await Promise.all(promises);
    fetchData();
  };

  const draggingGroup = useMemo(
    () => visualGroups.find(g => g.id === draggingId),
    [visualGroups, draggingId]
  );

  const totalActive = activeMesas.length > 0 ? activeMesas.reduce((s, a) => s + a.count, 0) : 0;
  const mesasOcupadas = activeMesas.length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#EC662D]" />
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
            Planta Baixa Interativa
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
              setLinkSourceId(null);
            }}
          >
            <Link2 className="h-4 w-4" />
            {linkMode ? "Selecione a 2ª Mesa..." : "Agrupar Mesas"}
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
          <div className="w-4 h-4 rounded-[4px] border-2 border-[#EC662D]/60 bg-card" />
          <span>Livre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-[4px] border-[2px] border-[#EC662D] bg-card shadow-[0_0_8px_#EC662D]" />
          <span className="text-foreground">Com pedidos (Neon)</span>
        </div>
        {linkMode && (
          <Badge className="bg-[#EC662D]/10 text-[#EC662D] border-[#EC662D]/30 text-[11px] animate-pulse">
            Selecione 2 agrupamentos para fundir (Duplo-clique separa)
          </Badge>
        )}
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-background flex items-center justify-center p-8 relative" ref={canvasRef}>
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        <DndContext 
          sensors={sensors} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
        >
          <div
            className="relative rounded-sm overflow-hidden"
            style={{
              width: CANVAS_W * zoom,
              height: CANVAS_H * zoom,
              background: "transparent",
            }}
          >
            {/* SVG layer: Blueprint walls */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={CANVAS_W * zoom}
              height={CANVAS_H * zoom}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            >
              <defs>
                <filter id="wallShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.15"/>
                </filter>
              </defs>

              {/* Blueprint Walls Structure - THINNER (20.8 ~ 21px as requested) */}
              <g filter="url(#wallShadow)">
                {/* Outer perimeter with openings for entrance and patio */}
                <path 
                  d={`M 40,40 L ${CANVAS_W - 40},40 L ${CANVAS_W - 40},${CANVAS_H - 40} L 40,${CANVAS_H - 40} Z`} 
                  fill="none" 
                  stroke={WALL_COLOR} 
                  strokeWidth={WALL_THICKNESS} 
                  strokeDasharray={`${CANVAS_W-80} 0 0 0 0 0 ${CANVAS_W/2 - 100} 200 1000`} 
                />

                {/* Left side rooms (Kitchen and Work Area) */}
                <path d="M 40,300 L 250,300 L 250,40" fill="none" stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                <path d="M 40,150 L 150,150 L 150,40" fill="none" stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                
                {/* Bar area (Top Right) */}
                <path d={`M ${CANVAS_W - 250},40 L ${CANVAS_W - 250},180 L ${CANVAS_W - 40},180`} fill="none" stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                
                {/* Toilets (Bottom Right) */}
                <path d={`M ${CANVAS_W - 200},${CANVAS_H - 40} L ${CANVAS_W - 200},${CANVAS_H - 180} L ${CANVAS_W - 40},${CANVAS_H - 180}`} fill="none" stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                <path d={`M ${CANVAS_W - 100},${CANVAS_H - 40} L ${CANVAS_W - 100},${CANVAS_H - 180}`} fill="none" stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                
                {/* Middle partitions / columns */}
                <line x1={400} y1={40} x2={400} y2={100} stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                <line x1={400} y1={250} x2={400} y2={350} stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
                <line x1={400} y1={500} x2={400} y2={CANVAS_H - 40} stroke={WALL_COLOR} strokeWidth={WALL_THICKNESS} />
              </g>

              {/* Room Labels */}
              <text x="145" y="230" textAnchor="middle" fill="#EC662D" opacity="0.4" fontSize="16" fontWeight="bold" letterSpacing="2">COZINHA</text>
              <text x="95" y="105" textAnchor="middle" fill="#EC662D" opacity="0.4" fontSize="12" fontWeight="bold" letterSpacing="1">PREPARO</text>
              <text x={CANVAS_W - 145} y="115" textAnchor="middle" fill="#EC662D" opacity="0.4" fontSize="16" fontWeight="bold" letterSpacing="2">BAR</text>
              <text x={CANVAS_W - 50} y={CANVAS_H - 105} textAnchor="middle" fill="#EC662D" opacity="0.4" fontSize="14" fontWeight="bold" letterSpacing="1">WC FEM</text>
              <text x={CANVAS_W - 150} y={CANVAS_H - 105} textAnchor="middle" fill="#EC662D" opacity="0.4" fontSize="14" fontWeight="bold" letterSpacing="1">WC MASC</text>
              <text x={CANVAS_W / 2} y={CANVAS_H - 55} textAnchor="middle" fill="#EC662D" opacity="0.4" fontSize="16" fontWeight="bold" letterSpacing="4">ENTRADA PRINCIPAL</text>
              <text x={CANVAS_W / 2 + 50} y={CANVAS_H / 2 - 50} textAnchor="middle" fill="#EC662D" opacity="0.15" fontSize="36" fontWeight="bold" letterSpacing="8">SALÃO PRINCIPAL</text>
            </svg>

            {/* Visual Groups Layer */}
            <div
              className="absolute inset-0"
              style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}
            >
              {visualGroups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => {
                    if (linkMode) {
                      handleGroupClick(group.id);
                    } else if (group.activeCount > 0) {
                      // Navigate to Kanban board filtering by the first mesa in the group
                      // The group label could be "12 + 13", so we pick the primary mesa (group.mesas[0])
                      // to search/filter by its exact number in the board
                      router.push(`/pedidos?busca=${group.mesas[0].numero_mesa}`);
                    }
                  }}
                  onDoubleClick={() => handleUnlinkGroup(group.id)}
                >
                  <DraggableGroupWrapper
                    group={group}
                    isActive={group.activeCount > 0}
                    isDragging={draggingId === group.id}
                    linkMode={linkMode}
                    isLinkTarget={linkSourceId === group.id}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Drag overlay for smooth drag animation */}
          <DragOverlay
             dropAnimation={{
               duration: 250,
               easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
               sideEffects: defaultDropAnimationSideEffects({
                 styles: {
                   active: {
                     opacity: '0.4',
                   },
                 },
               }),
             }}
          >
            {draggingGroup && (
              <TableOverlay
                group={draggingGroup}
                isActive={draggingGroup.activeCount > 0}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
