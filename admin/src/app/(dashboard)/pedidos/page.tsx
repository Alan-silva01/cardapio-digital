"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { type FormaPagamento } from "@/components/payment-modal";
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
  Bell,
  CreditCard,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { createClient } from "@/lib/supabase/client";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { OrderDetailModal } from "@/components/order-detail-modal";

interface ItemPedido {
  id: string;
  quantidade: number;
  nome_produto: string;
  nome_variacao: string | null;
  preco_unitario: number;
  preco_total: number;
  servido: boolean;
  observacao?: string | null;
  criado_em?: string;
  produtos?: {
    imagem_url: string | null;
  } | null;
}

interface PedidoRaw {
  id: string;
  comanda_id: string;
  order_number: string;
  order_id: string;
  numero_mesa: number;
  nome_pessoa: string | null;
  status: "recebido" | "preparando" | "pronto" | "entregue" | "cancelado";
  total: number;
  forma_pagamento?: FormaPagamento | null;
  criado_em: string;
  itens_pedido: ItemPedido[];
}

// Grouped view: one card per comanda
export interface ComandaAgrupada {
  comanda_id: string;
  numero_mesa: number;
  status: "recebido" | "preparando" | "pronto" | "entregue" | "cancelado";
  total: number;
  criado_em: string; // earliest pedido
  pedido_ids: string[];
  order_number: string;
  order_id: string;
  forma_pagamento?: FormaPagamento;
  pessoas: {
    nome: string;
    subtotal: number;
    itens: ItemPedido[];
    pago?: boolean;
    cancelado?: boolean;
  }[];
}

const STATUS_ORDER = ["recebido", "preparando", "pronto", "entregue", "cancelado"];

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

    // If all pedidos are cancelado, total is 0. Else ignore cancelados.
    const nonCanceledGroup = group.filter(p => p.status !== "cancelado");
    const total = nonCanceledGroup.reduce((sum, p) => sum + Number(p.total), 0);
    const earliestPedido = group.reduce(
      (earliest, p) => (p.criado_em < earliest.criado_em ? p : earliest),
      group[0]
    );
    const earliestDate = earliestPedido.criado_em;
    const formaPagamento = nonCanceledGroup.find((p) => p.forma_pagamento)?.forma_pagamento || undefined;

    // Group items by person with subtotals + payment status
    const pessoasMap = new Map<string, { itens: ItemPedido[]; subtotal: number; allPaid: boolean; allCanceled: boolean; pedidoCount: number; paidCount: number; canceledCount: number; }>();
    group.forEach((p) => {
      const nome = p.nome_pessoa || "Cliente";
      const existing = pessoasMap.get(nome) || { itens: [], subtotal: 0, allPaid: true, allCanceled: true, pedidoCount: 0, paidCount: 0, canceledCount: 0 };
      
      // Inject the pedido's timestamp into each item
      const itensComTimestamp = p.itens_pedido.map(item => ({
        ...item,
        criado_em: p.criado_em
      }));
      existing.itens.push(...itensComTimestamp);
      
      if (p.status !== "cancelado") {
        existing.subtotal += Number(p.total);
      } else {
        existing.canceledCount += 1;
      }
      
      existing.pedidoCount += 1;
      if (p.forma_pagamento && p.status !== "cancelado") {
        existing.paidCount += 1;
      }
      existing.allPaid = existing.paidCount === (existing.pedidoCount - existing.canceledCount);
      existing.allCanceled = existing.canceledCount === existing.pedidoCount;
      pessoasMap.set(nome, existing);
    });

    const pessoas = Array.from(pessoasMap.entries())
      .filter(([, data]) => data.itens.length > 0) // Hide people with no items
      .map(([nome, data]) => ({
        nome,
        subtotal: data.subtotal,
        itens: data.itens,
        pago: data.allPaid && (data.pedidoCount - data.canceledCount) > 0,
        cancelado: data.allCanceled && data.pedidoCount > 0,
      }));

    return {
      comanda_id: group[0].comanda_id,
      numero_mesa: group[0].numero_mesa,
      status,
      total,
      criado_em: earliestDate,
      pedido_ids: group.map((p) => p.id),
      order_number: earliestPedido.order_number,
      order_id: earliestPedido.order_id,
      forma_pagamento: formaPagamento ?? undefined,
      pessoas,
    };
  }).filter((group) => group.pessoas.length > 0); // Hide completely empty comandas
}

function groupByStatus(comandas: ComandaAgrupada[]): ColumnsState {
  const grouped: ColumnsState = {
    recebido: [],
    preparando: [],
    pronto: [],
    entregue: [],
  };
  comandas.forEach((c) => {
    if (c.status === "cancelado") {
      grouped.entregue.push(c);
    } else if (grouped[c.status]) {
      grouped[c.status].push(c);
    }
  });

  // A coluna Histórico (entregue/cancelado) deve ser do mais recente para o mais antigo.
  grouped.entregue.reverse();

  return grouped;
}

export default function PedidosPage() { 
    const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<ColumnsState>({
    recebido: [],
    preparando: [],
    pronto: [],
    entregue: [],
  });
  const [mesasStatus, setMesasStatus] = useState<Record<number, { garcom: boolean, conta: boolean }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<'hoje' | 'ontem' | '7dias'>("hoje");
  const [serviceModal, setServiceModal] = useState<{ mesa: number, type: 'garcom' | 'conta' } | null>(null);
  const { playSound, enabled: soundEnabled, toggleSound } = useNotificationSound();
  const [selectedComanda, setSelectedComanda] = useState<ComandaAgrupada | null>(null);
  const [config, setConfig] = useState<any>(null);
  const skipNextFetchRef = useRef(false);
  const skipNextSoundRef = useRef(false);

  useEffect(() => {
    supabase.from('configuracoes').select('*').limit(1).single().then(({ data }) => {
      if (data) setConfig(data);
    });
  }, []);

  const fetchPedidos = useCallback(async () => {
    const now = new Date();

    let startDate: Date;
    let endDate: Date | null = null;

    if (dateFilter === 'hoje') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === 'ontem') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // 7 dias
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    }

    let query = supabase
      .from("pedidos")
      .select("id, comanda_id, order_number, order_id, numero_mesa, nome_pessoa, status, total, criado_em, forma_pagamento, itens_pedido (id, quantidade, nome_produto, nome_variacao, servido, preco_unitario, preco_total, observacao, produtos (imagem_url))")
      .gte("criado_em", startDate.toISOString())
      .order("criado_em", { ascending: true });

    if (endDate) {
      query = query.lte("criado_em", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar pedidos:", error);
      return;
    }

    if (data) {
      const comandas = groupPedidosByComanda(data as unknown as PedidoRaw[]);
      setColumns(groupByStatus(comandas));

      // Update selected comanda symmetrically if it's already open
      setSelectedComanda((prev) => {
        if (!prev) return prev;
        const updatedComanda = comandas.find(c => c.comanda_id === prev.comanda_id);
        return updatedComanda || prev;
      });

      // Auto-open modal if URL has ?mesa=X
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const mesaParam = params.get("mesa");
        if (mesaParam) {
          const mesaNum = parseInt(mesaParam, 10);
          const activeComanda = comandas.find(c => c.numero_mesa === mesaNum && c.status !== "entregue" && c.status !== "cancelado");
          if (activeComanda) {
            setSelectedComanda(activeComanda);
            // Clear URL param after opening
            window.history.replaceState({}, '', '/pedidos');
          }
        }
      }
    }

    // Fetch active mesa statuses
    const { data: mesasData } = await supabase
      .from("mesas")
      .select("numero, chamando_garcom, solicitando_conta")
      .or("chamando_garcom.eq.true,solicitando_conta.eq.true");

    if (mesasData) {
      const statuses: Record<number, { garcom: boolean, conta: boolean }> = {};
      mesasData.forEach((m) => {
        statuses[m.numero] = { garcom: m.chamando_garcom, conta: m.solicitando_conta };
      });
      setMesasStatus(statuses);
    }

    setLoading(false);
  }, [dateFilter]);

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
        (payload) => {
          // Don't play sound for couvert or admin-added products
          const isCouvert = payload.new?.nome_pessoa === "Couvert";
          if (!isCouvert && !skipNextSoundRef.current) {
            playSound();
          }
          if (skipNextSoundRef.current) {
            skipNextSoundRef.current = false;
          }
          // Skip fetch if couvert handler will do its own fetch after all inserts complete
          if (skipNextFetchRef.current) {
            skipNextFetchRef.current = false;
          } else {
            fetchPedidos();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pedidos" },
        () => {
          fetchPedidos();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "mesas" },
        (payload) => {
          const newMesa = payload.new;
          setMesasStatus((prev) => ({
            ...prev,
            [newMesa.numero]: { garcom: newMesa.chamando_garcom, conta: newMesa.solicitando_conta }
          }));
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
      if (nextStatus === "entregue") {
        updated[nextStatus] = [updatedComanda, ...prev[nextStatus]];
      } else {
        updated[nextStatus] = [...prev[nextStatus], updatedComanda];
      }
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

  const handleAddCouvert = async (
    comandaId: string,
    quantidade: number,
    valorUnitario: number,
    nomePessoa?: string,
  ) => {
    const comanda = Object.values(columns).flat().find(c => c.comanda_id === comandaId);
    if (!comanda) return;

    const total = quantidade * valorUnitario;
    // Use person's name if targeting a specific comanda, otherwise global "Couvert"
    const targetPessoa = nomePessoa || "Couvert";

    // ── Optimistic UI update (instant) ──
    const tempItemId = `couvert-${Date.now()}`;
    const couvertItem: ItemPedido = {
      id: tempItemId,
      quantidade,
      nome_produto: "Couvert Artístico",
      nome_variacao: null,
      preco_unitario: valorUnitario,
      preco_total: total,
      servido: true,
    };

    const addCouvertToComanda = (c: ComandaAgrupada): ComandaAgrupada => {
      if (c.comanda_id !== comandaId) return c;
      const existingPessoa = c.pessoas.find(p => p.nome === targetPessoa);
      let updatedPessoas;
      if (existingPessoa) {
        updatedPessoas = c.pessoas.map(p =>
          p.nome === targetPessoa
            ? { ...p, itens: [...p.itens, couvertItem], subtotal: p.subtotal + total }
            : p
        );
      } else {
        updatedPessoas = [...c.pessoas, { nome: targetPessoa, subtotal: total, itens: [couvertItem], pago: false }];
      }
      return { ...c, total: c.total + total, pessoas: updatedPessoas };
    };

    setColumns(prev => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].map(addCouvertToComanda);
      }
      return updated;
    });

    setSelectedComanda(prev => prev ? addCouvertToComanda(prev) : prev);

    // ── DB operations (background) ──
    // Suppress Realtime sound + skip fetch to avoid race condition
    skipNextFetchRef.current = true;
    skipNextSoundRef.current = true;

    // When targeting a specific person: find their active pedido and insert item there.
    // When global "Couvert": create a new pedido under the "Couvert" pessoa.
    let pedidoId: string | null = null;

    if (nomePessoa) {
      // Try to find an existing active (non-entregue) pedido for this person in this comanda
      const { data: existingPedido } = await supabase
        .from("pedidos")
        .select("id")
        .eq("comanda_id", comandaId)
        .eq("nome_pessoa", nomePessoa)
        .neq("status", "entregue")
        .neq("status", "cancelado")
        .order("criado_em", { ascending: false })
        .limit(1)
        .single();

      if (existingPedido) {
        pedidoId = existingPedido.id;
        // Update the pedido total
        await supabase
          .from("pedidos")
          .update({ total: comanda.pessoas.find(p => p.nome === nomePessoa)!.subtotal + total })
          .eq("id", pedidoId);
      }
    }

    if (!pedidoId) {
      // Create a new pedido (global couvert or person has no active pedido)
      const { data: novoPedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          comanda_id: comandaId,
          numero_mesa: comanda.numero_mesa,
          nome_pessoa: targetPessoa,
          status: "pronto",
          total: total,
          order_number: comanda.order_number ? `${comanda.order_number}-CV` : "CV",
        })
        .select("id")
        .single();

      if (pedidoError || !novoPedido) {
        console.error("Erro ao inserir pedido de couvert:", pedidoError);
        skipNextFetchRef.current = false;
        skipNextSoundRef.current = false;
        fetchPedidos();
        return;
      }
      pedidoId = novoPedido.id;
    }

    const { error: itemError } = await supabase
      .from("itens_pedido")
      .insert({
        pedido_id: pedidoId,
        nome_produto: "Couvert Artístico",
        quantidade: quantidade,
        preco_unitario: valorUnitario,
        preco_total: total,
        servido: true,
      });

    if (itemError) {
      console.error("Erro ao inserir item de couvert:", itemError);
    }

    // Final sync after ALL inserts are done (real IDs replace temp ones)
    fetchPedidos();
  };

  const handleRemoveItem = async (itemId: string, comandaId: string) => {
    const { data, error } = await supabase.rpc("remover_item_comanda", { p_item_id: itemId });
    if (error || (data && !data.success)) {
      console.error("Erro ao remover item:", error || data?.message);
      alert("Erro ao remover o item: " + (error?.message || data?.message));
    } else {
      fetchPedidos();
    }
  };

  const handleAddProduct = async (
    comandaId: string,
    produtoId: string,
    variacaoId: string | null,
    quantidade: number,
    observacao: string,
    nomePessoa: string
  ) => {
    // Suppress notification sound — this is an admin action, not a new customer order
    skipNextSoundRef.current = true;

    const { data, error } = await supabase.rpc("adicionar_item_comanda_admin", {
      p_comanda_id: comandaId,
      p_nome_pessoa: nomePessoa,
      p_produto_id: produtoId,
      p_variacao_id: variacaoId,
      p_quantidade: quantidade,
      p_observacao: observacao,
    });

    if (error || (data && !data.success)) {
      console.error("Erro ao adicionar produto:", error || data?.message);
      skipNextSoundRef.current = false; // reset on error
      alert("Erro ao adicionar o produto: " + (error?.message || data?.message));
    } else {
      fetchPedidos();
    }
  };

  const clearMesaStatus = async (numero: number, type: 'garcom' | 'conta') => {
    // Optimistic UI update
    setMesasStatus((prev) => ({
      ...prev,
      [numero]: { ...prev[numero], [type]: false }
    }));
    setServiceModal(null);
    
    const field = type === 'garcom' ? { chamando_garcom: false } : { solicitando_conta: false };
    await supabase.from("mesas").update(field).eq("numero", numero);
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

  // ── Per-person payment ──
  const handlePayPerson = useCallback(async (comandaId: string, nomePessoa: string, forma: FormaPagamento) => {
    // Optimistic: mark the person as paid in local state
    const markPago = (comanda: ComandaAgrupada) => ({
      ...comanda,
      pessoas: comanda.pessoas.map((p) =>
        p.nome === nomePessoa ? { ...p, pago: true } : p
      ),
    });

    setColumns((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].map((c) =>
          c.comanda_id === comandaId ? markPago(c) : c
        );
      }
      return updated;
    });

    setSelectedComanda((prev) => {
      if (!prev || prev.comanda_id !== comandaId) return prev;
      return markPago(prev);
    });

    // DB: update all pedidos matching this comanda + person to 'entregue'
    const { error } = await supabase
      .from("pedidos")
      .update({ status: "entregue", forma_pagamento: forma })
      .eq("comanda_id", comandaId)
      .eq("nome_pessoa", nomePessoa);

    if (error) {
      console.error("Erro ao pagar pessoa:", error);
      fetchPedidos();
    }

    // Check if all pedidos in this comanda are now paid (entregue) → close comanda
    const { data: remainingPedidos } = await supabase
      .from("pedidos")
      .select("id, status")
      .eq("comanda_id", comandaId)
      .neq("status", "entregue");

    if (remainingPedidos && remainingPedidos.length === 0) {
      await supabase.from("comandas").update({ status: "fechada" }).eq("id", comandaId);
    }

    // DB: insert into pagamentos table
    const pagamentosToInsert: { comanda_id: string; metodo: string; valor: number; tipo: string }[] = [];
    if (forma.pix > 0) pagamentosToInsert.push({ comanda_id: comandaId, metodo: 'pix', valor: forma.pix, tipo: 'individual' });
    if (forma.credito > 0) pagamentosToInsert.push({ comanda_id: comandaId, metodo: 'credito', valor: forma.credito, tipo: 'individual' });
    if (forma.debito > 0) pagamentosToInsert.push({ comanda_id: comandaId, metodo: 'debito', valor: forma.debito, tipo: 'individual' });
    if (forma.dinheiro > 0) pagamentosToInsert.push({ comanda_id: comandaId, metodo: 'dinheiro', valor: forma.dinheiro, tipo: 'individual' });

    if (pagamentosToInsert.length > 0) {
      const { error: pgError } = await supabase.from("pagamentos").insert(pagamentosToInsert);
      if (pgError) console.error("Erro ao inserir na tabela pagamentos:", pgError);
    }
  }, [fetchPedidos]);

  // ── Whole-order payment ──
  const handlePayAll = useCallback(async (comandaId: string, forma: FormaPagamento) => {
    // Optimistic: mark all people as paid
    const markAllPago = (comanda: ComandaAgrupada) => ({
      ...comanda,
      pessoas: comanda.pessoas.map((p) => ({ ...p, pago: true })),
    });

    setColumns((prev) => {
      const updated = { ...prev };
      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].map((c) =>
          c.comanda_id === comandaId ? markAllPago(c) : c
        );
      }
      return updated;
    });

    setSelectedComanda((prev) => {
      if (!prev || prev.comanda_id !== comandaId) return prev;
      return markAllPago(prev);
    });

    // DB: update all pedidos in this comanda to 'entregue'
    const { error } = await supabase
      .from("pedidos")
      .update({ status: "entregue", forma_pagamento: forma })
      .eq("comanda_id", comandaId);

    if (error) {
      console.error("Erro ao pagar comanda inteira:", error);
      fetchPedidos();
    }

    // Close the comanda since everything is paid
    await supabase.from("comandas").update({ status: "fechada" }).eq("id", comandaId);

    // DB: insert into pagamentos table
    const pagamentosToInsert: { comanda_id: string; metodo: string; valor: number; tipo: string }[] = [];
    if (forma.pix > 0) pagamentosToInsert.push({ comanda_id: comandaId, metodo: 'pix', valor: forma.pix, tipo: 'total' });
    if (forma.credito > 0) pagamentosToInsert.push({ comanda_id: comandaId, metodo: 'credito', valor: forma.credito, tipo: 'total' });
    if (forma.debito > 0) pagamentosToInsert.push({ comanda_id: comandaId, metodo: 'debito', valor: forma.debito, tipo: 'total' });
    if (forma.dinheiro > 0) pagamentosToInsert.push({ comanda_id: comandaId, metodo: 'dinheiro', valor: forma.dinheiro, tipo: 'total' });

    if (pagamentosToInsert.length > 0) {
      const { error: pgError } = await supabase.from("pagamentos").insert(pagamentosToInsert);
      if (pgError) console.error("Erro ao inserir na tabela pagamentos:", pgError);
    }
    setSelectedComanda(null);
  }, [fetchPedidos]);

  // ── Per-person thermal print ──
  const handlePrintPerson = useCallback((comanda: ComandaAgrupada, nomePessoa: string) => {
    const pessoa = comanda.pessoas.find((p) => p.nome === nomePessoa);
    if (!pessoa) return;

    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (!printWindow) return;

    const itemsHtml = pessoa.itens
      .map(
        (item) =>
          `<tr>
            <td style="padding:2px 0; padding-right:8px;">${item.quantidade}x ${item.nome_produto}${(item.nome_variacao && item.nome_variacao.toLowerCase() !== 'unidade') ? ` (${item.nome_variacao})` : ""}</td>
            <td style="padding:2px 0; text-align:right; white-space:nowrap;">R$ ${Number(item.preco_total).toFixed(2)}</td>
          </tr>${item.observacao ? `<tr><td colspan="2" style="padding:0 0 4px 12px; font-size:10px; font-style:italic; color:#555;">Obs: ${item.observacao}</td></tr>` : ""}`
      )
      .join("");

    const couvertItems = pessoa.itens.filter((i) => i.nome_produto.toLowerCase().includes("couvert"));
    const totalCouvertQtd = couvertItems.reduce((acc, curr) => acc + curr.quantidade, 0);
    const totalCouvertValor = couvertItems.reduce((acc, curr) => acc + curr.preco_total, 0);
    const couvertHtml = totalCouvertQtd > 0 
      ? `<div style="text-align: right; font-size: 11px; margin-top: 4px; color: #555;">Couvert R$ ${(totalCouvertValor / totalCouvertQtd).toFixed(2)} por pessoa</div>`
      : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comanda - ${nomePessoa}</title>
        <style>
          @page { margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 58mm; padding: 4mm; }
          .logo-top { text-align: center; margin-bottom: 6px; }
          .logo-top img { max-width: 35mm; height: auto; filter: grayscale(100%) brightness(0); }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 6px; }
          .header h2 { font-size: 14px; margin-bottom: 2px; }
          .meta { font-size: 10px; color: #555; }
          table { width: 100%; border-collapse: collapse; }
          .total { border-top: 1px dashed #000; margin-top: 6px; padding-top: 4px; text-align: right; font-weight: bold; font-size: 13px; }
          .footer { text-align: center; margin-top: 8px; font-size: 9px; color: #888; }
          .powered { display: flex; align-items: center; justify-content: center; gap: 3px; margin-top: 6px; }
          .powered img { width: 12px; height: 12px; filter: grayscale(100%) brightness(0); }
          .powered span { font-size: 8px; color: #aaa; }
        </style>
      </head>
      <body>
        <div class="logo-top">
          <img src="https://res.cloudinary.com/dvhkcemd0/image/upload/v1773870490/migrated/csxl9gvgqpm5vqj8ww5w.png" alt="Logo" />
        </div>
        <div class="header">
          <h2>${nomePessoa}</h2>
          <div class="meta">Mesa ${String(comanda.numero_mesa).padStart(2, "0")} · Pedido ${comanda.order_number}</div>
          <div class="meta">${new Date().toLocaleString("pt-BR")}</div>
        </div>
        <table>${itemsHtml}</table>
        ${couvertHtml}
        <div class="total">Total: R$ ${pessoa.subtotal.toFixed(2)}</div>
        <div class="footer">
          <div>Comanda Individual</div>
          <div class="powered">
            <img src="/assets/images/logointelflux.png" alt="Intelflux" />
            <span>Intelflux</span>
          </div>
          <div style="margin-top:2px;">ID: ${comanda.order_id}</div>
        </div>
        <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, []);

  // ── Print all (whole order) ──
  const handlePrintAll = useCallback((comanda: ComandaAgrupada) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (!printWindow) return;

    const sectionsHtml = comanda.pessoas
      .map(
        (pessoa) => {
          const itemsHtml = pessoa.itens
            .map(
              (item) =>
                `<tr>
                   <td style="padding:2px 0; padding-right:8px;">${item.quantidade}x ${item.nome_produto}${(item.nome_variacao && item.nome_variacao.toLowerCase() !== 'unidade') ? ` (${item.nome_variacao})` : ""}</td>
                   <td style="padding:2px 0; text-align:right; white-space:nowrap;">R$ ${Number(item.preco_total).toFixed(2)}</td>
                 </tr>${item.observacao ? `<tr><td colspan="2" style="padding:0 0 4px 12px; font-size:10px; font-style:italic; color:#555;">Obs: ${item.observacao}</td></tr>` : ""}`
            )
            .join("");
          return `
            <div class="person">
              <div class="person-name">${pessoa.nome}</div>
              <table>${itemsHtml}</table>
              <div class="subtotal">Subtotal: R$ ${pessoa.subtotal.toFixed(2)}</div>
            </div>
          `;
        }
      )
      .join("");

    const couvertItems = comanda.pessoas.flatMap((p) => p.itens.filter((i) => i.nome_produto.toLowerCase().includes("couvert")));
    const totalCouvertQtd = couvertItems.reduce((acc, curr) => acc + curr.quantidade, 0);
    const totalCouvertValor = couvertItems.reduce((acc, curr) => acc + curr.preco_total, 0);
    const couvertHtml = totalCouvertQtd > 0 
      ? `<div style="text-align: right; font-size: 11px; margin-top: 4px; color: #555;">Couvert R$ ${(totalCouvertValor / totalCouvertQtd).toFixed(2)} por pessoa</div>`
      : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pedido - Mesa ${String(comanda.numero_mesa).padStart(2, "0")}</title>
        <style>
          @page { margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 58mm; padding: 4mm; }
          .logo-top { text-align: center; margin-bottom: 6px; }
          .logo-top img { max-width: 35mm; height: auto; filter: grayscale(100%) brightness(0); }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 6px; }
          .header h2 { font-size: 14px; margin-bottom: 2px; }
          .meta { font-size: 10px; color: #555; }
          table { width: 100%; border-collapse: collapse; }
          .person { margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dotted #ccc; }
          .person-name { font-weight: bold; font-size: 13px; margin-bottom: 2px; }
          .subtotal { text-align: right; font-size: 11px; margin-top: 2px; color: #555; }
          .total { border-top: 1px dashed #000; margin-top: 6px; padding-top: 4px; text-align: right; font-weight: bold; font-size: 14px; }
          .footer { text-align: center; margin-top: 8px; font-size: 9px; color: #888; }
          .powered { display: flex; align-items: center; justify-content: center; gap: 3px; margin-top: 6px; }
          .powered img { width: 12px; height: 12px; filter: grayscale(100%) brightness(0); }
          .powered span { font-size: 8px; color: #aaa; }
        </style>
      </head>
      <body>
        <div class="logo-top">
          <img src="https://res.cloudinary.com/dvhkcemd0/image/upload/v1773870490/migrated/csxl9gvgqpm5vqj8ww5w.png" alt="Logo" />
        </div>
        <div class="header">
          <h2>Mesa ${String(comanda.numero_mesa).padStart(2, "0")}</h2>
          <div class="meta">Pedido ${comanda.order_number} · ${comanda.pessoas.length} comanda${comanda.pessoas.length > 1 ? "s" : ""}</div>
          <div class="meta">${new Date().toLocaleString("pt-BR")}</div>
        </div>
        ${sectionsHtml}
        ${couvertHtml}
        <div class="total">Total: R$ ${Number(comanda.total).toFixed(2)}</div>
        <div class="footer">
          <div>Pedido Completo</div>
          <div class="powered">
            <img src="/assets/images/logointelflux.png" alt="Intelflux" />
            <span>Intelflux</span>
          </div>
          <div style="margin-top:2px;">ID: ${comanda.order_id}</div>
        </div>
        <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }, []);

  // ── Cancel Order ──
  const handleCancelOrder = useCallback(async (comandaId: string) => {
    // Select current from DB to refresh or we can optimistically set totals to 0
    // To ensure accuracy we just send the update and fetch
    setColumns((prev) => {
      const updated = { ...prev };
      for (const statusVal of Object.keys(updated)) {
        const comandaIndex = updated[statusVal].findIndex(c => c.comanda_id === comandaId);
        if (comandaIndex >= 0) {
          const comanda = updated[statusVal][comandaIndex];
          updated[statusVal] = updated[statusVal].filter(c => c.comanda_id !== comandaId);
          
          const canceledComanda = { 
            ...comanda, 
            status: "cancelado" as ComandaAgrupada["status"],
            total: 0, // Ignored logic means we can render 0 or the last value
            pessoas: comanda.pessoas.map(p => ({
              ...p,
              subtotal: 0,
              pago: false,
              cancelado: true,
            }))
          };
          updated["entregue"].push(canceledComanda);
          break;
        }
      }
      return updated;
    });

    setSelectedComanda((prev) => {
      if (!prev || prev.comanda_id !== comandaId) return prev;
      return {
        ...prev,
        status: "cancelado" as ComandaAgrupada["status"],
        total: 0,
        pessoas: prev.pessoas.map(p => ({ ...p, subtotal: 0, pago: false, cancelado: true })),
      };
    });

    const { error } = await supabase
      .from("pedidos")
      .update({ status: "cancelado" })
      .eq("comanda_id", comandaId);

    if (error) {
      console.error("Erro ao cancelar pedido:", error);
      fetchPedidos();
    }
    setSelectedComanda(null);
  }, [fetchPedidos]);

  // ── Reactivate Order ──
  const handleReactivateOrder = useCallback(async (comandaId: string) => {
    const { error } = await supabase
      .from("pedidos")
      .update({ status: "recebido" })
      .eq("comanda_id", comandaId);

    if (error) {
      console.error("Erro ao reativar pedido:", error);
    }
    fetchPedidos(); // Full refetch needed to recalculate totals safely
    setSelectedComanda(null); 
  }, [fetchPedidos]);

  // --- FILTERING LOGIC ---
  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns;
    const query = searchQuery.toLowerCase().trim();
    
    // Extracted prefixes for context-aware search
    const isMesaQuery = query.startsWith("mesa");
    const isPedidoQuery = query.startsWith("pedido");
    const numericPart = query.replace(/[^0-9]/g, ''); // Extract just numbers from query

    const matchComanda = (c: ComandaAgrupada) => {
      // 1. Explicit Mesa Search (e.g., "mesa 3", "mesa 03")
      if (isMesaQuery && numericPart) {
        return parseInt(numericPart, 10) === c.numero_mesa;
      }

      // 2. Explicit Pedido Search (e.g., "pedido 3", "pedido 0003")
      if (isPedidoQuery && numericPart) {
        // match exact numeric equivalent to avoid "3" matching "00034"
        return parseInt(numericPart, 10) === parseInt(c.order_number, 10) || c.order_number.toLowerCase().includes(numericPart);
      }

      // 3. Pure Number Search ("3", "03")
      // If it's just a number, we check if it exactly matches the table OR exactly matches the order number
      if (/^\d+$/.test(query)) {
        const queryNum = parseInt(query, 10);
        if (queryNum === c.numero_mesa) return true;
        if (queryNum === parseInt(c.order_number, 10)) return true;
        
        // Also allow substring match on order_number just in case they type a very specific sequence like "0003"
        if (c.order_number.includes(query)) return true;
        return false;
      }

      // 4. Match Service Alert ("garcom", "conta", "chamando", "fechar")
      // We allow partial matches like "cha" for "chamando" or "fe" for "fechar"
      // Alerts only apply to active orders, so filter out history
      if (
        "garçom".includes(query) || 
        "garcom".includes(query) || 
        "chamando".includes(query) ||
        (query.length >= 2 && "chamando".startsWith(query)) ||
        query.includes("garçom") || query.includes("garcom") || query.includes("chamando")
      ) {
        if (mesasStatus[c.numero_mesa]?.garcom && c.status !== "entregue" && c.status !== "cancelado") return true;
      }
      
      if (
        "conta".includes(query) || 
        "fechar".includes(query) ||
        (query.length >= 2 && "fechar".startsWith(query)) ||
        query.includes("conta") || query.includes("fechar")
      ) {
        if (mesasStatus[c.numero_mesa]?.conta && c.status !== "entregue" && c.status !== "cancelado") return true;
      }

      // 5. Match Person Name
      if (c.pessoas.some(p => p.nome.toLowerCase().includes(query))) return true;

      return false;
    };

    return {
      recebido: columns.recebido.filter(matchComanda),
      preparando: columns.preparando.filter(matchComanda),
      pronto: columns.pronto.filter(matchComanda),
      entregue: columns.entregue.filter(matchComanda),
    };
  }, [columns, searchQuery, mesasStatus]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalComandas = Object.values(filteredColumns).flat().length;

  return (
    <div className="flex-1 flex flex-col bg-background text-foreground h-screen max-h-screen overflow-hidden">
      {/* Header / Subnav */}
      <div className="h-14 border-b px-6 flex items-center justify-between bg-card z-10 shrink-0 sticky top-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Pedidos</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-semibold">Kanban Live</span>
          {totalComandas > 0 && (
            <Badge variant="outline" className="ml-2 bg-muted border-none text-muted-foreground px-1.5 h-5 text-[10px]">
              {totalComandas} {searchQuery.trim() ? "encontrados" : dateFilter === 'hoje' ? 'hoje' : dateFilter === 'ontem' ? 'ontem' : '7 dias'}
            </Badge>
          )}
        </div>

        {/* DATE FILTER PILLS */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          {([
            { key: 'hoje', label: 'Hoje' },
            { key: 'ontem', label: 'Ontem' },
            { key: '7dias', label: '7 Dias' },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setDateFilter(f.key)}
              className={`px-3 h-6 rounded-md text-[11px] font-medium transition-all ${
                dateFilter === f.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {/* SEARCH BAR */}
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ex: Mesa 01, 0003, Garçom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-brand"
            />
          </div>

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
      <div className="flex-1 px-6 pb-6 overflow-x-auto overflow-y-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full min-w-[1200px] items-stretch pt-6 pb-4">
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex-1 min-w-[280px] max-w-[320px] flex flex-col gap-4 max-h-full">
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {column.label}
                    </h3>
                    <Badge variant="outline" className="bg-muted border-none text-muted-foreground px-1.5 h-5 text-[10px]">
                      {filteredColumns[column.id as keyof ColumnsState].length}
                    </Badge>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 overflow-y-auto flex flex-col gap-3 rounded-xl p-2 border transition-colors min-h-[150px] ${snapshot.isDraggingOver ? "bg-muted/50 border-primary/20" : "bg-muted/30 border-transparent"
                        }`}
                    >
                      {filteredColumns[column.id as keyof ColumnsState].length === 0 && (
                        <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50">
                          Nenhum pedido
                        </div>
                      )}

                      {filteredColumns[column.id as keyof ColumnsState].map((comanda, index) => {
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
                                  className={`bg-card border-border hover:border-border/80 transition-shadow cursor-grab active:cursor-grabbing group overflow-hidden py-0 gap-0 ${snapshot.isDragging ? "shadow-lg scale-[1.02] rotate-1 ring-1 ring-primary/20" : "shadow-xs"
                                  }`}
                                  onClick={() => setSelectedComanda(comanda)}
                                >
                                  <div className="relative bg-[#EC662D] px-4 py-1.5 flex justify-center items-center w-full shrink-0">
                                    <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] drop-shadow-sm">
                                      Pedido: {comanda.order_number}
                                    </span>
                                    {/* Efeito de pontinha (concave curve) mais pronunciado */}
                                    <div className="absolute top-full left-0 w-3 h-3 bg-[#EC662D]">
                                      <div className="w-full h-full bg-card rounded-tl-xl" />
                                    </div>
                                    <div className="absolute top-full right-0 w-3 h-3 bg-[#EC662D]">
                                      <div className="w-full h-full bg-card rounded-tr-xl" />
                                    </div>
                                  </div>
                                  <CardContent className="p-3 space-y-2 pt-4 relative">
                                    {/* MINIMALIST SERVICE ALERTS (MOVED FULL WIDTH ABOVE MESA INFO) */}
                                    {(mesasStatus[comanda.numero_mesa]?.garcom || mesasStatus[comanda.numero_mesa]?.conta) && 
                                     comanda.status !== "entregue" && 
                                     comanda.status !== "cancelado" && (
                                      <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-2 mb-3 w-full overflow-hidden">
                                        {mesasStatus[comanda.numero_mesa]?.garcom && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); setServiceModal({ mesa: comanda.numero_mesa, type: 'garcom' }); }}
                                            className="inline-flex shrink-0 items-center justify-center gap-1.5 px-2.5 py-0.5 text-[9px] font-semibold text-white uppercase tracking-wider bg-brand hover:bg-brand/90 transition-colors rounded-full whitespace-nowrap shadow-sm"
                                          >
                                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                            </span>
                                            <span className="truncate">Chamando Garçom</span>
                                          </button>
                                        )}
                                        {mesasStatus[comanda.numero_mesa]?.conta && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setServiceModal({ mesa: comanda.numero_mesa, type: 'conta' }); }}
                                            className="inline-flex shrink-0 items-center justify-center gap-1.5 px-2.5 py-0.5 text-[9px] font-semibold text-white uppercase tracking-wider bg-brand hover:bg-brand/90 transition-colors rounded-full whitespace-nowrap shadow-sm"
                                          >
                                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                            </span>
                                            <span className="truncate">Fechar Conta</span>
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                                          <Utensils className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex flex-col">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm tracking-tight text-foreground">
                                              Mesa {String(comanda.numero_mesa).padStart(2, "0")}
                                            </span>

                                            {comanda.status === "cancelado" ? (
                                              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded ml-1">
                                                Cancelado
                                              </span>
                                            ) : comanda.pessoas.length > 0 && comanda.pessoas.every(p => p.pago) ? (
                                              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded ml-1">
                                                Pago
                                              </span>
                                            ) : comanda.status === "entregue" ? (
                                              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded ml-1">
                                                Fechar Conta
                                              </span>
                                            ) : null}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full border text-muted-foreground bg-muted border-transparent">
                                        <Clock className="h-3 w-3 shrink-0" />
                                        <span>{elapsed}</span>
                                      </div>
                                    </div>

                                    {/* Items grouped by person */}
                                    <div className="divide-y divide-border">
                                      {comanda.pessoas.map((pessoa) => (
                                        <div key={pessoa.nome} className="space-y-1 py-2 first:pt-0 last:pb-0">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[11px] text-foreground font-bold tracking-tight">
                                              <User className="h-3 w-3 shrink-0" />
                                              {pessoa.nome}
                                              {pessoa.cancelado ? (
                                                <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider bg-red-500/10 px-1 py-0 rounded ml-1">
                                                  Cancelado
                                                </span>
                                              ) : pessoa.pago ? (
                                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-1 py-0 rounded ml-1">
                                                  Pago
                                                </span>
                                              ) : comanda.status === "entregue" ? (
                                                <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider bg-red-500/10 px-1 py-0 rounded ml-1">
                                                  Fechar Conta
                                                </span>
                                              ) : null}
                                            </div>
                                            <span className="text-[11px] text-muted-foreground font-mono font-medium">
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
                                                        ? "bg-emerald-400 border-emerald-400"
                                                        : "border-muted-foreground/30 hover:border-muted-foreground/60"
                                                      }`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      if (comanda.status !== "entregue") {
                                                        toggleItemServido(item.id, item.servido);
                                                      }
                                                    }}
                                                  >
                                                    {isServed && <Check className="h-3 w-3 text-background" />}
                                                  </div>
                                                  <div className="flex-1 flex justify-between items-start text-[13px] leading-snug text-foreground font-medium min-w-0">
                                                    <span className="truncate pr-2 border-b border-transparent border-dashed">
                                                      {item.quantidade}x {item.nome_produto}
                                                      {(item.nome_variacao && item.nome_variacao.toLowerCase() !== 'unidade') && <span className="opacity-70 text-muted-foreground font-normal text-xs ml-1">({item.nome_variacao})</span>}
                                                      {item.observacao && (
                                                        <div className="mt-0.5 text-[10px] text-muted-foreground italic font-normal">
                                                          Obs: {item.observacao}
                                                        </div>
                                                      )}
                                                    </span>
                                                    <div className="flex flex-col items-end shrink-0 pt-0.5 min-w-[60px]">
                                                      <span className="font-mono text-[11px] text-muted-foreground font-medium">
                                                        R$ {Number(item.preco_total).toFixed(2)}
                                                      </span>
                                                      {item.criado_em && (
                                                        <span className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                                                          <Clock className="h-2.5 w-2.5 opacity-70" />
                                                          {formatElapsedTime(item.criado_em)}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      ))}
                                    </div>


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
        config={config}
        onAddCouvert={handleAddCouvert}
        onRemoveItem={handleRemoveItem}
        onAddProduct={handleAddProduct}
        onToggleItemServido={toggleItemServido}
        onConfirmPayment={handlePayAll}
        onCancelOrder={handleCancelOrder}
        onReactivateOrder={handleReactivateOrder}
        onConfirmPaymentPerson={handlePayPerson}
        onPrintPerson={handlePrintPerson}
        onPrintAll={handlePrintAll}
        mesasStatus={mesasStatus}
        onClearService={clearMesaStatus}
      />

      {/* SERVICE CALL MODAL — ULTRA COMPACT */}
      <Dialog open={!!serviceModal} onOpenChange={(open) => !open && setServiceModal(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden" showCloseButton={true}>
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <DialogTitle className="text-sm font-bold tracking-tight">
                  Mesa {String(serviceModal?.mesa).padStart(2, "0")} — {serviceModal?.type === 'garcom' ? 'Garçom' : 'Conta'}
                </DialogTitle>
                <DialogDescription className="text-[10px] uppercase tracking-widest font-medium opacity-60">
                  Solicitação em aberto
                </DialogDescription>
              </div>
            </div>
          </div>

          <Separator />

          <div className="px-6 pt-3 pb-5 flex gap-2">
            <Button 
                variant="outline" 
                onClick={() => setServiceModal(null)}
                className="flex-1 h-9 text-[11px] font-bold"
            >
                Voltar
            </Button>
            <Button 
                className={`flex-1 h-9 text-[11px] font-bold shadow-xs ${
                  serviceModal?.type === 'garcom' 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
                onClick={() => serviceModal && clearMesaStatus(serviceModal.mesa, serviceModal.type)}
            >
                Marcar como Atendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
