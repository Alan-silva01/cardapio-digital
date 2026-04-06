"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  UtensilsCrossed,
  Armchair,
  Ban,
  Search,
  X,
  Calendar,
  Clock,
  User,
  Package,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  BarChart3,
  Loader2,
  Music2,
  Heart,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Label,
  Area,
  AreaChart,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, eachHourOfInterval, parseISO, startOfToday, endOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";

// ── Types ──
interface PedidoRow {
  id: string;
  comanda_id: string;
  order_number: string;
  order_id: string;
  numero_mesa: number;
  nome_pessoa: string | null;
  status: string;
  total: string;
  forma_pagamento: { pix: number; credito: number; debito: number; dinheiro: number } | null;
  criado_em: string;
}

interface ItemPedidoRow {
  id: string;
  pedido_id: string;
  nome_produto: string;
  nome_variacao: string | null;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
}

type PeriodKey = "hoje" | "7d" | "30d" | "custom";

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
];

// ── Chart configs ──
const ordersChartConfig = {
  pedidos: { label: "Pedidos", color: "var(--brand, #EC662D)" },
} satisfies ChartConfig;

const revenueChartConfig = {
  faturamento: { label: "Faturamento", color: "var(--brand, #EC662D)" },
} satisfies ChartConfig;

const peakChartConfig = {
  pedidos: { label: "Pedidos", color: "var(--brand, #EC662D)" },
} satisfies ChartConfig;

const PAYMENT_COLORS = ["#EC662D", "#2F3232", "#838585", "#D9D3D1"];

const paymentChartConfig = {
  pix: { label: "PIX", color: PAYMENT_COLORS[0] },
  credito: { label: "Crédito", color: PAYMENT_COLORS[1] },
  debito: { label: "Débito", color: PAYMENT_COLORS[2] },
  dinheiro: { label: "Dinheiro", color: PAYMENT_COLORS[3] },
} satisfies ChartConfig;

// ── Helpers ──
function getDateRange(period: PeriodKey): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case "hoje":
      return { from: startOfToday(), to: endOfToday() };
    case "7d":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "30d":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    default:
      return { from: startOfToday(), to: endOfToday() };
  }
}

export default function RelatoriosPage() { 
    const supabase = createClient();
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [itensPedido, setItensPedido] = useState<ItemPedidoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<PedidoRow | null>(null);
  const [searchItems, setSearchItems] = useState<ItemPedidoRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [estoqueBaixo, setEstoqueBaixo] = useState<any[]>([]);
  const [curtidas, setCurtidas] = useState<{ nome: string; total: number }[]>([]);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { from, to } = getDateRange(period);

    const [pedidosRes, itensRes, estoqueRes, curtidasRes] = await Promise.all([
      supabase
        .from("pedidos")
        .select("id, comanda_id, order_number, order_id, numero_mesa, nome_pessoa, status, total, forma_pagamento, criado_em")
        .gte("criado_em", from.toISOString())
        .lte("criado_em", to.toISOString())
        .order("criado_em", { ascending: false }),
      supabase
        .from("itens_pedido")
        .select("id, pedido_id, nome_produto, nome_variacao, quantidade, preco_unitario, preco_total"),
      supabase
        .from("variacoes_produto")
        .select(`
          id,
          nome,
          estoque,
          estoque_minimo,
          produtos!inner(nome)
        `)
        .eq("ativo", true)
        .neq("estoque", -1),
      supabase
        .from("produtos")
        .select("nome, curtidas")
        .gt("curtidas", 0)
        .order("curtidas", { ascending: false })
    ]);

    if (pedidosRes.data) setPedidos(pedidosRes.data as unknown as PedidoRow[]);
    if (itensRes.data) setItensPedido(itensRes.data as unknown as ItemPedidoRow[]);
    
    if (estoqueRes.data) {
      const lowStock = (estoqueRes.data as any[]).filter(item => item.estoque <= item.estoque_minimo);
      setEstoqueBaixo(lowStock.sort((a, b) => a.estoque - b.estoque));
    }

    if (curtidasRes.data) {
      setCurtidas(
        (curtidasRes.data as any[])
          .filter(p => p.nome && p.curtidas > 0)
          .map(p => ({ nome: p.nome, total: p.curtidas as number }))
          .sort((a, b) => b.total - a.total)
      );
    }

    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Search by Order ID ──
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim().toUpperCase();
    if (q.length < 3) return;

    setSearching(true);
    setSearchResult(null);
    setSearchItems([]);
    setSearchNotFound(false);

    const { data } = await supabase
      .from("pedidos")
      .select("id, comanda_id, order_number, order_id, numero_mesa, nome_pessoa, status, total, forma_pagamento, criado_em")
      .ilike("order_id", `%${q}%`)
      .limit(1);

    if (data && data.length > 0) {
      setSearchResult(data[0] as unknown as PedidoRow);
      // Fetch items for this pedido
      const { data: items } = await supabase
        .from("itens_pedido")
        .select("id, pedido_id, nome_produto, nome_variacao, quantidade, preco_unitario, preco_total")
        .eq("pedido_id", data[0].id);
      setSearchItems((items || []) as unknown as ItemPedidoRow[]);
    } else {
      setSearchNotFound(true);
    }
    setSearching(false);
  }, [searchQuery]);

  // ── Computed metrics ──
  const pedidosAtivos = useMemo(() => pedidos.filter(p => p.status !== "cancelado"), [pedidos]);
  const pedidosCancelados = useMemo(() => pedidos.filter(p => p.status === "cancelado"), [pedidos]);
  const { from: rangeFrom } = useMemo(() => getDateRange(period), [period]);

  const faturamento = useMemo(() =>
    pedidosAtivos.reduce((sum, p) => sum + Number(p.total), 0),
    [pedidosAtivos]
  );

  const ticketMedio = useMemo(() =>
    pedidosAtivos.length > 0 ? faturamento / pedidosAtivos.length : 0,
    [faturamento, pedidosAtivos]
  );

  const canceladosPercent = useMemo(() =>
    pedidos.length > 0 ? (pedidosCancelados.length / pedidos.length) * 100 : 0,
    [pedidos, pedidosCancelados]
  );

  // ── Pedidos per day/hour chart (BarChart) ──
  const pedidosPerDay = useMemo(() => {
    const { from, to } = getDateRange(period);

    if (period === "hoje") {
      // Group by hour for today (18:00 to 06:00)
      const hours = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6];
      return hours.map(h => {
        const hourStr = String(h).padStart(2, "0");
        const count = pedidosAtivos.filter(p => format(parseISO(p.criado_em), "HH") === hourStr).length;
        return { day: `${hourStr}:00`, pedidos: count };
      });
    }

    const days = eachDayOfInterval({ start: from, end: to });
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const count = pedidosAtivos.filter(p => format(parseISO(p.criado_em), "yyyy-MM-dd") === dayStr).length;
      return { day: format(day, "dd/MM", { locale: ptBR }), pedidos: count };
    });
  }, [pedidos, period, pedidosAtivos]);

  // ── Faturamento per day/hour chart (AreaChart) ──
  const faturamentoPerDay = useMemo(() => {
    const { from, to } = getDateRange(period);

    if (period === "hoje") {
      const hours = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6];
      return hours.map(h => {
        const hourStr = String(h).padStart(2, "0");
        const total = pedidosAtivos
          .filter(p => format(parseISO(p.criado_em), "HH") === hourStr)
          .reduce((sum, p) => sum + Number(p.total), 0);
        return { day: `${hourStr}:00`, faturamento: total };
      });
    }

    const days = eachDayOfInterval({ start: from, end: to });
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const total = pedidosAtivos
        .filter(p => format(parseISO(p.criado_em), "yyyy-MM-dd") === dayStr)
        .reduce((sum, p) => sum + Number(p.total), 0);
      return { day: format(day, "dd/MM", { locale: ptBR }), faturamento: total };
    });
  }, [pedidos, period, pedidosAtivos]);

  // ── Payment methods (PieChart) ──
  const paymentData = useMemo(() => {
    let pix = 0, credito = 0, debito = 0, dinheiro = 0;
    pedidosAtivos.forEach(p => {
      if (p.forma_pagamento) {
        pix += p.forma_pagamento.pix || 0;
        credito += p.forma_pagamento.credito || 0;
        debito += p.forma_pagamento.debito || 0;
        dinheiro += p.forma_pagamento.dinheiro || 0;
      }
    });
    return [
      { name: "PIX", value: pix, fill: PAYMENT_COLORS[0] },
      { name: "Crédito", value: credito, fill: PAYMENT_COLORS[1] },
      { name: "Débito", value: debito, fill: PAYMENT_COLORS[2] },
      { name: "Dinheiro", value: dinheiro, fill: PAYMENT_COLORS[3] },
    ].filter(d => d.value > 0);
  }, [pedidosAtivos]);

  const totalPayments = useMemo(() => paymentData.reduce((s, d) => s + d.value, 0), [paymentData]);

  // ── Peak hours (AreaChart) ──
  const peakHours = useMemo(() => {
    const hours = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6];
    const hourMap: Record<string, number> = {};
    hours.forEach(h => {
      hourMap[String(h).padStart(2, "0")] = 0;
    });

    pedidosAtivos.forEach(p => {
      const hour = format(parseISO(p.criado_em), "HH");
      if (hourMap[hour] !== undefined) {
        hourMap[hour]++;
      }
    });

    return hours.map(h => {
      const hourStr = String(h).padStart(2, "0");
      return { hour: `${hourStr}:00`, pedidos: hourMap[hourStr] };
    });
  }, [pedidosAtivos]);

  // ── Top products (couvert excluded from ranking) ──
  const COUVERT_NAME = "Couvert Artístico";

  const topProducts = useMemo(() => {
    const pedidoIds = new Set(pedidosAtivos.map(p => p.id));
    const filteredItems = itensPedido.filter(
      item => pedidoIds.has(item.pedido_id) && item.nome_produto !== COUVERT_NAME
    );

    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    filteredItems.forEach(item => {
      const existing = productMap.get(item.nome_produto) || { name: item.nome_produto, qty: 0, revenue: 0 };
      existing.qty += item.quantidade;
      existing.revenue += Number(item.preco_total);
      productMap.set(item.nome_produto, existing);
    });

    return Array.from(productMap.values()).sort((a, b) => b.qty - a.qty);
  }, [pedidosAtivos, itensPedido]);

  // ── Couvert Artístico metrics ──
  const couvertMetrics = useMemo(() => {
    const pedidoIds = new Set(pedidosAtivos.map(p => p.id));
    const couvertItems = itensPedido.filter(
      item => pedidoIds.has(item.pedido_id) && item.nome_produto === COUVERT_NAME
    );
    const qty = couvertItems.reduce((sum, i) => sum + i.quantidade, 0);
    const revenue = couvertItems.reduce((sum, i) => sum + Number(i.preco_total), 0);
    return { qty, revenue };
  }, [pedidosAtivos, itensPedido]);

  // ── Status label ──
  const statusLabel = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      recebido: { label: "Recebido", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
      preparando: { label: "Preparando", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
      pronto: { label: "Pronto", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
      entregue: { label: "Entregue", className: "bg-muted text-muted-foreground border-border" },
      cancelado: { label: "Cancelado", className: "bg-red-500/10 text-red-500 border-red-500/20" },
    };
    return map[status] || { label: status, className: "bg-muted text-muted-foreground" };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2.75rem)] w-full overflow-y-auto">
      {/* ── HEADER ── */}
      <div className="px-6 pt-5 pb-4 shrink-0 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Relatórios
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Métricas e análise de desempenho
            </p>
          </div>

          {/* Period filters */}
          <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === opt.key
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar pedido pelo ID (ex: IN7ELH9FL9x)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-9 text-xs font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResult(null);
                  setSearchNotFound(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs"
            onClick={handleSearch}
            disabled={searching || searchQuery.trim().length < 3}
          >
            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Buscar"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="px-6 py-5 space-y-5">

          {/* ── SEARCH RESULT ── */}
          {(searchResult || searchNotFound) && (
            <div className="space-y-1.5">
              {searchNotFound ? (
                <Card className="shadow-none border-dashed">
                  <CardContent className="py-4 text-center">
                    <p className="text-xs text-muted-foreground">Nenhum pedido encontrado com esse ID.</p>
                  </CardContent>
                </Card>
              ) : searchResult && (
                <Card className="shadow-none rounded-xl border border-border max-w-2xl">
                  <CardContent className="p-3">
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Receipt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-mono text-xs font-bold truncate">{searchResult.order_id}</span>
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${statusLabel(searchResult.status).className}`}>
                          {statusLabel(searchResult.status).label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">Mesa {String(searchResult.numero_mesa).padStart(2, "0")}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{searchResult.nome_pessoa || "Cliente"}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{format(parseISO(searchResult.criado_em), "dd/MM HH:mm")}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold font-mono">R$ {Number(searchResult.total).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Items - compact inline */}
                    {searchItems.length > 0 && (
                      <div className="mt-2 pt-2 border-t flex flex-wrap gap-x-3 gap-y-0.5">
                        {searchItems.map(item => (
                          <span key={item.id} className="text-[11px] text-muted-foreground">
                            <span className="text-foreground font-medium">{item.quantidade}x</span> {item.nome_produto}
                            {item.nome_variacao && item.nome_variacao.toLowerCase() !== "unidade" && (
                              <span className="opacity-60"> ({item.nome_variacao})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Payment - compact inline */}
                    {searchResult.forma_pagamento && (
                      <div className="mt-1.5 pt-1.5 border-t flex items-center gap-3 text-[10px] text-muted-foreground">
                        {searchResult.forma_pagamento.pix > 0 && (
                          <span className="flex items-center gap-0.5"><Smartphone className="h-2.5 w-2.5" /> PIX R$ {searchResult.forma_pagamento.pix.toFixed(2)}</span>
                        )}
                        {searchResult.forma_pagamento.credito > 0 && (
                          <span className="flex items-center gap-0.5"><CreditCard className="h-2.5 w-2.5" /> Crédito R$ {searchResult.forma_pagamento.credito.toFixed(2)}</span>
                        )}
                        {searchResult.forma_pagamento.debito > 0 && (
                          <span className="flex items-center gap-0.5"><CreditCard className="h-2.5 w-2.5" /> Débito R$ {searchResult.forma_pagamento.debito.toFixed(2)}</span>
                        )}
                        {searchResult.forma_pagamento.dinheiro > 0 && (
                          <span className="flex items-center gap-0.5"><Banknote className="h-2.5 w-2.5" /> Dinheiro R$ {searchResult.forma_pagamento.dinheiro.toFixed(2)}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── KPI CARDS ── */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-none rounded-xl border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                <CardTitle className="text-[11px] font-medium text-muted-foreground">Faturamento</CardTitle>
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="text-lg font-bold tracking-tight">
                  {loading ? "..." : `R$ ${faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {pedidosAtivos.length} pedidos no período
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-none rounded-xl border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                <CardTitle className="text-[11px] font-medium text-muted-foreground">Pedidos</CardTitle>
                <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="text-lg font-bold tracking-tight">
                  {loading ? "..." : pedidosAtivos.length}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Excluindo cancelados
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-none rounded-xl border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                <CardTitle className="text-[11px] font-medium text-muted-foreground">Ticket Médio</CardTitle>
                <Armchair className="h-3.5 w-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="text-lg font-bold tracking-tight">
                  {loading ? "..." : `R$ ${ticketMedio.toFixed(2)}`}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Por pedido finalizado
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-none rounded-xl border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                <CardTitle className="text-[11px] font-medium text-muted-foreground">Cancelados</CardTitle>
                <Ban className="h-3.5 w-3.5 text-red-500" />
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="text-lg font-bold tracking-tight text-red-500">
                  {loading ? "..." : pedidosCancelados.length}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {canceladosPercent.toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ── ROW: Charts ── */}
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Pedidos por Dia */}
            <Card className="shadow-none rounded-xl border border-border">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-semibold">Pedidos por Dia</CardTitle>
                <CardDescription className="text-[11px]">Quantidade de pedidos no período</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <ChartContainer config={ordersChartConfig} className="h-[200px] w-full">
                  <BarChart data={pedidosPerDay} margin={{ top: 8, right: 0, left: 0, bottom: 4 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" tickLine={false} tickMargin={6} axisLine={false} fontSize={10} />
                    <ChartTooltip
                      cursor={{ fill: "var(--accent)", opacity: 0.2 }}
                      content={<ChartTooltipContent indicator="dot" separator=": " />}
                    />
                    <Bar dataKey="pedidos" fill="#EC662D" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Faturamento por Dia */}
            <Card className="shadow-none rounded-xl border border-border">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-semibold">Faturamento por Dia</CardTitle>
                <CardDescription className="text-[11px]">Receita acumulada no período</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <ChartContainer config={revenueChartConfig} className="h-[200px] w-full">
                  <AreaChart data={faturamentoPerDay} margin={{ top: 8, right: 0, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EC662D" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EC662D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={6} fontSize={10} />
                    <ChartTooltip
                      cursor={{ stroke: "var(--accent)", strokeWidth: 1, strokeDasharray: "4 4" }}
                      content={<ChartTooltipContent indicator="line" separator=": " />}
                    />
                    <Area
                      type="monotone"
                      dataKey="faturamento"
                      stroke="#EC662D"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* ── ROW: Payment Methods + Peak Hours ── */}
          <div className="grid gap-3 lg:grid-cols-10">
            {/* Payment Methods */}
            <Card className="lg:col-span-4 shadow-none rounded-xl border border-border">
              <CardHeader className="items-center pb-0 pt-3 px-4">
                <CardTitle className="text-xs font-semibold">Formas de Pagamento</CardTitle>
                <CardDescription className="text-[11px]">Distribuição no período</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 px-4 flex items-center justify-center">
                {paymentData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8">Sem dados de pagamento</p>
                ) : (
                  <ChartContainer config={paymentChartConfig} className="mx-auto aspect-square h-[200px]">
                    <PieChart>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={paymentData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={80}
                        strokeWidth={3}
                        paddingAngle={2}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                  <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-lg font-bold">
                                    R$ {totalPayments.toFixed(0)}
                                  </tspan>
                                  <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-muted-foreground text-[9px]">
                                    Total
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            {/* Peak Hours */}
            <Card className="lg:col-span-6 shadow-none rounded-xl border border-border">
              <CardHeader className="pb-1 pt-3 px-4">
                <CardTitle className="text-xs font-semibold">Horários de Pico</CardTitle>
                <CardDescription className="text-[11px]">Volume de pedidos por hora</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <ChartContainer config={peakChartConfig} className="h-[200px] w-full">
                  <AreaChart data={peakHours} margin={{ top: 8, right: 0, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EC662D" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EC662D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={6} fontSize={10} />
                    <ChartTooltip
                      cursor={{ stroke: "var(--accent)", strokeWidth: 1, strokeDasharray: "4 4" }}
                      content={<ChartTooltipContent indicator="line" separator=": " />}
                    />
                    <Area
                      type="monotone"
                      dataKey="pedidos"
                      stroke="#EC662D"
                      fillOpacity={1}
                      fill="url(#colorPeak)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

        {/* ── COUVERT + CURTIDAS METRICS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Couvert Artístico */}
          <Card className="shadow-none rounded-xl border border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
              <CardTitle className="text-[11px] font-medium text-muted-foreground">Couvert Artístico</CardTitle>
              <Music2 className="h-3.5 w-3.5 text-[#EC662D]" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-lg font-bold tracking-tight">
                {loading ? "..." : `R$ ${couvertMetrics.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {couvertMetrics.qty} cobranças no período
              </p>
            </CardContent>
          </Card>

          {/* Mais Curtidos */}
          <Card className="shadow-none rounded-xl border border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
              <CardTitle className="text-[11px] font-medium text-muted-foreground">Produto Mais Curtido</CardTitle>
              <Heart className="h-3.5 w-3.5 text-rose-500" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {loading || curtidas.length === 0 ? (
                <div className="text-lg font-bold tracking-tight text-muted-foreground">{loading ? "..." : "—"}</div>
              ) : (
                <>
                  <div className="text-sm font-bold tracking-tight truncate">{curtidas[0].nome}</div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    ❤️ {curtidas[0].total} curtidas · #{curtidas[1] ? `2° ${curtidas[1].nome}` : "único no ranking"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── RANKING DE PRODUTOS ── */}
          <Card className="shadow-none rounded-xl border border-border">
            <CardHeader className="pb-2 pt-3 px-4 flex-row justify-between items-center">
              <div>
                <CardTitle className="text-xs font-semibold">Produtos Mais Vendidos</CardTitle>
                <CardDescription className="text-[11px]">Ranking por quantidade no período</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sem dados no período</p>
              ) : (
                <div className="space-y-1">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-[10px] text-muted-foreground font-medium px-2 py-1.5 uppercase tracking-wider sticky top-0 bg-background z-10">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6">Produto</div>
                    <div className="col-span-5 text-right">Qtd Vendida</div>
                  </div>
                  <Separator />
                  <div className="h-[300px] w-full pr-1 overflow-y-auto hidden-scrollbar">
                    <div className="space-y-1">
                      {topProducts.map((product, index) => (
                        <div
                          key={product.name}
                          className="grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="col-span-1">
                            <span className={`text-xs font-bold ${index < 3 ? "text-[#EC662D]" : "text-muted-foreground"}`}>
                              {index + 1}
                            </span>
                          </div>
                          <div className="col-span-6">
                            <span className="text-sm font-medium">{product.name}</span>
                          </div>
                          <div className="col-span-5 text-right">
                            <span className="text-sm font-bold">{product.qty}</span>
                            <span className="text-[11px] text-muted-foreground ml-1">un</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── ESTOQUE BAIXO ── */}
          <Card className="shadow-none rounded-xl border border-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-semibold text-amber-600">Alerta de Estoque</CardTitle>
              <CardDescription className="text-[11px]">Produtos esgotados ou com quantidade baixa</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {estoqueBaixo.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum alerta de estoque</p>
              ) : (
                <div className="space-y-1">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 text-[10px] text-muted-foreground font-medium px-2 py-1.5 uppercase tracking-wider sticky top-0 bg-background z-10">
                    <div className="col-span-7">Produto</div>
                    <div className="col-span-3 text-center">Estoque</div>
                    <div className="col-span-2 text-right">Status</div>
                  </div>
                  <Separator />
                  <div className="h-[300px] w-full pr-1 overflow-y-auto hidden-scrollbar">
                    <div className="space-y-1">
                      {estoqueBaixo.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          <div className="col-span-7 flex flex-col">
                            <span className="text-sm font-medium leading-none">{item.produtos?.nome}</span>
                            <span className="text-[10px] text-muted-foreground mt-1">{item.nome}</span>
                          </div>
                          <div className="col-span-3 text-center">
                            <span className={cn("text-sm font-bold", item.estoque === 0 ? "text-red-500" : "text-amber-500")}>
                              {item.estoque}
                            </span>
                          </div>
                          <div className="col-span-2 text-right">
                            {item.estoque === 0 ? (
                              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">Esgotado</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 text-amber-500 border-amber-500/30">Baixo</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RANKING DE CURTIDAS ── */}
        <Card className="shadow-none rounded-xl border border-border">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-rose-500" />
              Ranking de Curtidas
            </CardTitle>
            <CardDescription className="text-[11px]">Produtos favoritos pelos clientes (todos os tempos)</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {curtidas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sem curtidas registradas</p>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 text-[10px] text-muted-foreground font-medium px-2 py-1.5 uppercase tracking-wider">
                  <div className="col-span-1">#</div>
                  <div className="col-span-8">Produto</div>
                  <div className="col-span-3 text-right">Curtidas</div>
                </div>
                <Separator />
                <div className="h-[240px] w-full pr-1 overflow-y-auto hidden-scrollbar">
                  <div className="space-y-1">
                    {curtidas.map((item, index) => (
                      <div
                        key={item.nome}
                        className="grid grid-cols-12 gap-2 items-center px-2 py-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div className="col-span-1">
                          <span className={`text-xs font-bold ${index < 3 ? "text-rose-500" : "text-muted-foreground"}`}>
                            {index + 1}
                          </span>
                        </div>
                        <div className="col-span-8">
                          <span className="text-sm font-medium">{item.nome}</span>
                        </div>
                        <div className="col-span-3 text-right flex items-center justify-end gap-1">
                          <Heart className="h-3 w-3 text-rose-400" />
                          <span className="text-sm font-bold">{item.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        </div>
    </div>
  );
}
