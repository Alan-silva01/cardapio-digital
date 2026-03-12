"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Armchair,
    UtensilsCrossed,
    DollarSign,
    AlertTriangle,
    ArrowRight,
    TrendingUp,
    Package,
    Loader2
} from "lucide-react";
import Link from "next/link";
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    Pie,
    PieChart,
    Label,
    Area,
    AreaChart,
} from "recharts";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { supabase } from "@/lib/supabase";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- CHART CONFIGS ---
const ordersChartConfig = {
    pedidos: { label: "Pedidos", color: "#EC662D" },
} satisfies ChartConfig;

const categoryChartConfig = {
    vinhos: { label: "Vinhos", color: "#EC662D" },
    entradas: { label: "Entradas", color: "#2F3232" },
    destilados: { label: "Destilados", color: "#838585" },
    carnes: { label: "Carnes", color: "#D9D3D1" },
    outros: { label: "Outros", color: "#4B4E4E" },
} satisfies ChartConfig;

const trafficChartConfig = {
    active: { label: "Pedidos Ativos", color: "#EC662D" },
} satisfies ChartConfig;

const CATEGORY_COLORS = ["#EC662D", "#2F3232", "#838585", "#D9D3D1", "#4B4E4E", "#8B8B8B", "#FF8C00", "#10b981"];

export default function DashboardPage() {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [pedidosHoje, setPedidosHoje] = useState<any[]>([]);
    const [pedidosOntem, setPedidosOntem] = useState<any[]>([]);
    const [itensPedido, setItensPedido] = useState<any[]>([]);
    const [estoqueBaixo, setEstoqueBaixo] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const now = new Date();
        const start7Days = startOfDay(subDays(now, 6)).toISOString();
        const endNow = endOfDay(now).toISOString();

        const [pedidos7dRes, itensRes, estoqueRes] = await Promise.all([
            supabase
                .from("pedidos")
                .select("id, status, total, criado_em")
                .gte("criado_em", start7Days)
                .lte("criado_em", endNow)
                .order("criado_em", { ascending: false }),
            supabase
                .from("itens_pedido")
                .select("id, pedido_id, nome_produto, quantidade, preco_total, produtos!inner(categoria_id, categorias(nome), imagem_url)"),
             supabase
                .from("variacoes_produto")
                .select(`
                    id,
                    nome,
                    estoque,
                    estoque_minimo,
                    produtos!inner(nome, imagem_url, categorias(nome))
                `)
                .eq("ativo", true)
                .neq("estoque", -1)
        ]);

        const allPedidos = pedidos7dRes.data || [];
        setPedidos(allPedidos);

        if (itensRes.data) setItensPedido(itensRes.data);

        if (estoqueRes.data) {
            const lowStock = (estoqueRes.data as any[]).filter(item => item.estoque <= item.estoque_minimo);
            setEstoqueBaixo(lowStock.sort((a, b) => a.estoque - b.estoque));
        }

        // Separa os pedidos de hoje vs ontem para comparar o faturamento
        // Hoje é de 00:00 até agora. Ontem é de 00:00 até 23:59.
        const todayStart = startOfDay(now).toISOString();
        const yesterdayStart = startOfDay(subDays(now, 1)).toISOString();
        const yesterdayEnd = endOfDay(subDays(now, 1)).toISOString();

        setPedidosHoje(allPedidos.filter(p => p.criado_em >= todayStart));
        setPedidosOntem(allPedidos.filter(p => p.criado_em >= yesterdayStart && p.criado_em <= yesterdayEnd));

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const pedidosHojeAtivos = useMemo(() => pedidosHoje.filter(p => p.status !== "cancelado"), [pedidosHoje]);
    const faturamentoHoje = useMemo(() => pedidosHojeAtivos.reduce((acc, p) => acc + Number(p.total), 0), [pedidosHojeAtivos]);
    
    const pedidosOntemAtivos = useMemo(() => pedidosOntem.filter(p => p.status !== "cancelado"), [pedidosOntem]);
    const faturamentoOntem = useMemo(() => pedidosOntemAtivos.reduce((acc, p) => acc + Number(p.total), 0), [pedidosOntemAtivos]);
    
    // Growth vs Yesterday
    const growth = useMemo(() => {
        if (faturamentoOntem === 0) return faturamentoHoje > 0 ? 100 : 0;
        return ((faturamentoHoje - faturamentoOntem) / faturamentoOntem) * 100;
    }, [faturamentoHoje, faturamentoOntem]);

    const producing = useMemo(() => pedidosHoje.filter(p => p.status === "preparando").length, [pedidosHoje]);

    const ticketMedio = useMemo(() => {
        if (pedidosHojeAtivos.length === 0) return 0;
        return faturamentoHoje / pedidosHojeAtivos.length;
    }, [faturamentoHoje, pedidosHojeAtivos]);

    // ── Orders per Day (7 days) ──
    const ordersData = useMemo(() => {
        const { from, to } = { from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) };
        const days = eachDayOfInterval({ start: from, end: to });
        const pedActive = pedidos.filter(p => p.status !== "cancelado");
        return days.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const count = pedActive.filter(p => format(parseISO(p.criado_em), "yyyy-MM-dd") === dayStr).length;
            
            // local formatting uppercase first letter
            let dayName = format(day, "EEE", { locale: ptBR });
            dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

            return { day: dayName, pedidos: count };
        });
    }, [pedidos]);

    // ── Peak Movement (Hoje: 18:00 as 06:00 do dia seguinte para o caso de um bar) ──
    const trafficData = useMemo(() => {
        const hours = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6];
        const hourMap: Record<string, number> = {};
        hours.forEach(h => {
            hourMap[String(h).padStart(2, "0")] = 0;
        });

        // Consideramos as 18h de ontem ate as 06h de hoje pra mostrar o ciclo da 'noite atual/passada' real do bar
        // Mas como pedimos hoje ativos ali em cima, vamos só desenhar os horários presentes nesses pedidos
        pedidosHojeAtivos.forEach(p => {
            const hour = format(parseISO(p.criado_em), "HH");
            if (hourMap[hour] !== undefined) {
                hourMap[hour]++;
            }
        });

        return hours.map(h => {
            const hourStr = String(h).padStart(2, "0");
            return { time: `${hourStr}:00`, active: hourMap[hourStr] };
        });
    }, [pedidosHojeAtivos]);

    // ── Top 5 Vendidos Hoje ──
    const topProducts = useMemo(() => {
        const pedidoIds = new Set(pedidosHojeAtivos.map(p => p.id));
        const filteredItems = itensPedido.filter(item => pedidoIds.has(item.pedido_id));

        const productMap = new Map<string, { name: string; category: string; qty: number; revenue: number; img: string }>();
        filteredItems.forEach(item => {
            const catArr = item.produtos?.categorias;
            const categoryName = Array.isArray(catArr) ? catArr[0]?.nome : catArr?.nome;

            const existing = productMap.get(item.nome_produto) || { 
                name: item.nome_produto, 
                category: categoryName || "Outros",
                qty: 0, 
                revenue: 0,
                img: item.produtos?.imagem_url || ""
            };
            existing.qty += item.quantidade;
            existing.revenue += Number(item.preco_total);
            productMap.set(item.nome_produto, existing);
        });

        return Array.from(productMap.values())
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);
    }, [pedidosHojeAtivos, itensPedido]);

    // ── Categories Pie Chart (7 dias) ──
    const categoryData = useMemo(() => {
        const pedidoIds = new Set(pedidos.filter(p => p.status !== "cancelado").map(p => p.id));
        const filteredItems = itensPedido.filter(item => pedidoIds.has(item.pedido_id));

        const catMap = new Map<string, number>();
        filteredItems.forEach(item => {
            const catArr = item.produtos?.categorias;
            const cat = (Array.isArray(catArr) ? catArr[0]?.nome : catArr?.nome) || "Outros";
            
            catMap.set(cat, (catMap.get(cat) || 0) + item.quantidade);
        });

        const arr = Array.from(catMap.entries())
            .map(([cat, qty], idx) => ({
                category: cat,
                visitors: qty,
                fill: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
            }))
            .sort((a, b) => b.visitors - a.visitors);
        
        return arr;
    }, [pedidos, itensPedido]);

    const totalCategories = useMemo(() => categoryData.reduce((acc, curr) => acc + curr.visitors, 0), [categoryData]);

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)] w-full px-6 py-4 gap-2.5 overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">Dashboard General</h1>
                    <p className="text-sm text-muted-foreground">Visão geral da operação hoje</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" render={<Link href="/pedidos" />}>
                        Abrir Kanban
                    </Button>
                    <Button size="sm" className="bg-foreground hover:bg-foreground/90 text-background shadow-none" render={<Link href="/estoque" />}>
                        Gerenciar Estoque
                    </Button>
                </div>
            </div>

            {/* --- METRICS CARDS --- */}
            <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4 shrink-0">
                <Card className="shadow-none rounded-xl border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">Faturamento Hoje</CardTitle>
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-lg font-bold tracking-tight">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `R$ ${faturamentoHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                        </div>
                        {growth !== 0 && !loading && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <span className={growth > 0 ? "text-emerald-500 font-medium flex items-center" : "text-red-500 font-medium flex items-center"}>
                                    {growth > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingUp className="h-3 w-3 mr-0.5 rotate-180" />} 
                                    {growth > 0 ? "+" : ""}{growth.toFixed(1)}%
                                </span> 
                                em relação a ontem
                            </p>
                        )}
                        {growth === 0 && !loading && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">Igual a ontem</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-none rounded-xl border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">Pedidos (Hoje)</CardTitle>
                        <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-lg font-bold tracking-tight">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : pedidosHojeAtivos.length}
                        </div>
                        {!loading && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                <span className="font-medium text-foreground">{producing}</span> produzindo agora
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-none rounded-xl border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">Ticket Médio</CardTitle>
                        <Armchair className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-lg font-bold tracking-tight">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `R$ ${ticketMedio.toFixed(2)}`}
                        </div>
                        {!loading && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Por pedido finalizado
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-none rounded-xl border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">Alertas de Estoque</CardTitle>
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-lg font-bold tracking-tight text-amber-500">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin text-amber-500" /> : `${estoqueBaixo.length} itens`}
                        </div>
                        {!loading && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                Precisam de reposição
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* --- ROW 2: Charts + Top Vendidos --- */}
            <div className="grid gap-2.5 lg:grid-cols-10 min-h-0 flex-1">

                {/* BAR CHART: Orders per Day */}
                <Card className="lg:col-span-3 shadow-none rounded-xl border border-border flex flex-col min-h-0 h-full">
                    <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                        <CardTitle className="text-xs font-semibold">Pedidos por Dia</CardTitle>
                        <CardDescription className="text-[11px]">Volume últimos 7 dias</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 px-4 pb-3 flex flex-col min-h-0 relative">
                        {loading && (
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                             </div>
                        )}
                        {!loading && (
                            <ChartContainer config={ordersChartConfig} className="absolute inset-0 px-4 pb-4 w-full h-full">
                                <BarChart data={ordersData} margin={{ top: 8, right: 0, left: 0, bottom: 4 }}>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis
                                        dataKey="day"
                                        tickLine={false}
                                        tickMargin={6}
                                        axisLine={false}
                                        fontSize={10}
                                    />
                                    <ChartTooltip
                                        cursor={{ fill: 'var(--accent)', opacity: 0.2 }}
                                        content={<ChartTooltipContent indicator="dot" separator=": " />}
                                    />
                                    <Bar dataKey="pedidos" fill="#EC662D" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* PIE CHART: Categories */}
                <Card className="lg:col-span-3 shadow-none rounded-xl border border-border flex flex-col min-h-0 h-full">
                    <CardHeader className="items-center pb-0 pt-3 px-4 shrink-0">
                        <CardTitle className="text-xs font-semibold">Top Categorias</CardTitle>
                        <CardDescription className="text-[11px]">Vendas últimos 7 dias</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-3 px-4 flex items-center justify-center min-h-0 relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : categoryData.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Sem dados</div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center px-4 pb-4">
                                <ChartContainer
                                    config={categoryChartConfig}
                                    className="mx-auto aspect-square h-full max-h-[160px] pb-0"
                                >
                                    <PieChart>
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent hideLabel separator=": " />}
                                        />
                                        <Pie
                                            data={categoryData}
                                            dataKey="visitors"
                                            nameKey="category"
                                            innerRadius={55}
                                            outerRadius={80}
                                            strokeWidth={3}
                                            paddingAngle={2}
                                        >
                                            <Label
                                                content={({ viewBox }) => {
                                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                        return (
                                                            <text
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                            >
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={viewBox.cy}
                                                                    className="fill-foreground text-xl font-bold"
                                                                >
                                                                    {totalCategories.toLocaleString()}
                                                                </tspan>
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={(viewBox.cy || 0) + 16}
                                                                    className="fill-muted-foreground text-[9px]"
                                                                >
                                                                    Vendas
                                                                </tspan>
                                                            </text>
                                                        )
                                                    }
                                                }}
                                            />
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* TOP MAIS VENDIDOS */}
                <Card className="lg:col-span-4 shadow-none rounded-xl border border-border flex flex-col min-h-0 h-full">
                    <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                        <CardTitle className="text-xs font-semibold">Top Mais Vendidos</CardTitle>
                        <CardDescription className="text-[11px]">Ranking de saída hoje</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col min-h-0 px-4 pb-3 overflow-hidden">
                        <ScrollArea className="flex-1 w-full min-h-[120px] hidden-scrollbar">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : topProducts.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">Sem vendas hoje</p>
                            ) : (
                                <div className="space-y-1.5 pr-4 py-1">
                                    {topProducts.map((product) => (
                                        <div key={product.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-9 w-8 relative rounded-md bg-muted/60 overflow-hidden border border-border shrink-0 flex items-center justify-center">
                                                    {product.img ? (
                                                        <img src={product.img} alt={product.name} className="h-full w-full object-cover p-0.5" loading="lazy" />
                                                    ) : (
                                                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-medium leading-tight">{product.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{product.category}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[13px] font-bold">{product.qty} un</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    R$ {product.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        <div className="pt-3 border-t mt-auto shrink-0">
                            <Button variant="outline" className="w-full text-xs font-normal h-8" render={<Link href="/relatorios" />}>
                                Ver ranking completo <ArrowRight className="ml-2 h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- ROW 3: Traffic + Low Stock --- */}
            <div className="grid gap-2.5 lg:grid-cols-10 min-h-0 flex-1">

                {/* AREA CHART: Hourly Traffic */}
                <Card className="lg:col-span-6 shadow-none rounded-xl border border-border flex flex-col min-h-0 h-full">
                    <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                        <CardTitle className="text-xs font-semibold">Pico de Movimento (Hoje)</CardTitle>
                        <CardDescription className="text-[11px]">Volume de pedidos por hora (18:00 às 06:00)</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 px-4 pb-3 flex flex-col min-h-0 relative">
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {!loading && (
                            <ChartContainer config={trafficChartConfig} className="absolute inset-0 px-4 pb-4 w-full h-full">
                                <AreaChart data={trafficData} margin={{ top: 8, right: 0, left: 0, bottom: 4 }}>
                                    <defs>
                                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EC662D" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#EC662D" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis
                                        dataKey="time"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={6}
                                        fontSize={10}
                                    />
                                    <ChartTooltip
                                        cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        content={<ChartTooltipContent indicator="line" separator=": " />}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="active"
                                        stroke="#EC662D"
                                        fillOpacity={1}
                                        fill="url(#colorActive)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* ESTOQUE BAIXO */}
                <Card className="lg:col-span-4 shadow-none rounded-xl border border-border flex flex-col min-h-0 h-full">
                    <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                        <div className="flex items-center justify-between w-full">
                            <div>
                                <CardTitle className="text-xs font-semibold">Estoque Baixo</CardTitle>
                                <CardDescription className="text-[11px]">Produtos que precisam reposição</CardDescription>
                            </div>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col min-h-0 px-4 pb-3 overflow-hidden">
                        <ScrollArea className="flex-1 w-full min-h-[120px] hidden-scrollbar">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : estoqueBaixo.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum alerta de estoque</p>
                            ) : (
                                <div className="space-y-1.5 pr-4 py-1">
                                    {estoqueBaixo.slice(0, 5).map((product) => (
                                        <div key={product.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-9 w-8 relative rounded-md bg-muted/60 overflow-hidden border border-border shrink-0 flex items-center justify-center">
                                                    {product.produtos?.imagem_url ? (
                                                        <img src={product.produtos.imagem_url} alt={product.produtos.nome} className="h-full w-full object-cover p-0.5" loading="lazy" />
                                                    ) : (
                                                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-medium leading-tight">{product.produtos?.nome}</span>
                                                    <span className="text-[10px] text-muted-foreground text-amber-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                                        {product.nome}
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge variant={product.estoque === 0 ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0.5 font-medium shrink-0 ml-2">
                                                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> {product.estoque} un
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        <div className="pt-3 border-t mt-auto shrink-0">
                            <Button variant="outline" className="w-full text-xs font-normal h-8" render={<Link href="/relatorios" />}>
                                Ver todos os alertas <ArrowRight className="ml-2 h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
