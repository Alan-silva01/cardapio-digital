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
    Loader2,
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

    // TTS Audio state and function
    const [activeServiceCalls, setActiveServiceCalls] = useState<{ mesa: string; type: 'garcom' | 'conta'; time: Date; id: string }[]>([]);

    const playAudioAlert = useCallback((mesaNumero: string, type: 'garcom' | 'conta') => {
        // --- CUSTOM AUDIO (Cloudinary) ---
        // For now, we only have Mesa 01 Garçom audio.
        // Later we can expand this to fetch from `audio_alertas` table or a larger map.
        if (mesaNumero === '1' && type === 'garcom') {
            const audio = new Audio("https://res.cloudinary.com/ddhlqymvf/video/upload/v1773405622/garcon_mesa01_i0d77n.m4a");
            audio.play().catch(e => {
                console.error("Erro ao tocar áudio customizado:", e);
                // Fallback to TTS if browser blocks autoplay
                fallbackTTS(mesaNumero, type);
            });
            return;
        }

        // --- FALLBACK (Browser Native TTS) ---
        fallbackTTS(mesaNumero, type);
    }, []);

    const fallbackTTS = (mesaNumero: string, type: 'garcom' | 'conta') => {
        if (!('speechSynthesis' in window)) return;
        const message = type === 'garcom' 
            ? `Solicitação de garçom na mesa ${mesaNumero}`
            : `Fechar conta da mesa ${mesaNumero}`;
            
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        const now = new Date();
        const start7Days = startOfDay(subDays(now, 6)).toISOString();
        const endNow = endOfDay(now).toISOString();

        const [pedidos7dRes, itensRes, estoqueRes, activeMesasRes] = await Promise.all([
            supabase
                .from("pedidos")
                .select("id, status, total, criado_em")
                .gte("criado_em", start7Days)
                .lte("criado_em", endNow)
                .order("criado_em", { ascending: false }),
            supabase
                .from("itens_pedido")
                .select(`
                    id, 
                    pedido_id, 
                    nome_produto, 
                    quantidade, 
                    preco_total, 
                    produtos!inner(
                        categoria_id, 
                        categorias(nome), 
                        imagem_url
                    ),
                    pedidos!inner(criado_em)
                `)
                .gte("pedidos.criado_em", start7Days),
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
                .neq("estoque", -1),
             supabase
                .from("mesas")
                .select("id, numero, chamando_garcom, solicitando_conta")
                .or('chamando_garcom.eq.true,solicitando_conta.eq.true')
        ]);

        const allPedidos = pedidos7dRes.data || [];
        setPedidos(allPedidos);

        if (itensRes.data) setItensPedido(itensRes.data);

        if (estoqueRes.data) {
            const lowStock = (estoqueRes.data as any[]).filter(item => item.estoque <= item.estoque_minimo);
            setEstoqueBaixo(lowStock.sort((a, b) => a.estoque - b.estoque));
        }

        if (activeMesasRes.data) {
            const initialCalls = activeMesasRes.data.flatMap(mesa => {
                const calls = [];
                if (mesa.chamando_garcom) calls.push({ mesa: mesa.numero.toString(), type: 'garcom' as const, time: new Date(), id: `g-${mesa.id}` });
                if (mesa.solicitando_conta) calls.push({ mesa: mesa.numero.toString(), type: 'conta' as const, time: new Date(), id: `c-${mesa.id}` });
                return calls;
            });
            setActiveServiceCalls(initialCalls);
        }

        const todayStart = startOfDay(now).toISOString();
        const yesterdayStart = startOfDay(subDays(now, 1)).toISOString();
        const yesterdayEnd = endOfDay(subDays(now, 1)).toISOString();

        setPedidosHoje(allPedidos.filter(p => p.criado_em >= todayStart));
        setPedidosOntem(allPedidos.filter(p => p.criado_em >= yesterdayStart && p.criado_em <= yesterdayEnd));

        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchData();

        // Realtime subscription for Mesas Service Calls
        const channel = supabase.channel('mesas-service-calls')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'mesas' },
                (payload) => {
                    const newMesa = payload.new;
                    const oldMesa = payload.old;
                    
                    if (newMesa.chamando_garcom && !oldMesa.chamando_garcom) {
                        playAudioAlert(newMesa.numero, 'garcom');
                        setActiveServiceCalls(prev => {
                            if (prev.some(c => c.id === `g-${newMesa.id}`)) return prev;
                            return [...prev, { mesa: newMesa.numero.toString(), type: 'garcom', time: new Date(), id: `g-${newMesa.id}` }];
                        });
                    } else if (!newMesa.chamando_garcom && oldMesa.chamando_garcom) {
                        setActiveServiceCalls(prev => prev.filter(c => c.id !== `g-${newMesa.id}`));
                    }

                    if (newMesa.solicitando_conta && !oldMesa.solicitando_conta) {
                        playAudioAlert(newMesa.numero, 'conta');
                        setActiveServiceCalls(prev => {
                            if (prev.some(c => c.id === `c-${newMesa.id}`)) return prev;
                            return [...prev, { mesa: newMesa.numero.toString(), type: 'conta', time: new Date(), id: `c-${newMesa.id}` }];
                        });
                    } else if (!newMesa.solicitando_conta && oldMesa.solicitando_conta) {
                        setActiveServiceCalls(prev => prev.filter(c => c.id !== `c-${newMesa.id}`));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData, playAudioAlert]);

    const handleClearServiceCall = async (id: string, mesaNumero: string, type: 'garcom' | 'conta') => {
        const resetField = type === 'garcom' ? { chamando_garcom: false } : { solicitando_conta: false };
        try {
            const { error } = await supabase
                .from('mesas')
                .update(resetField)
                .eq('numero', parseInt(mesaNumero));
            
            if (error) {
                console.error("Error clearing service call:", error);
            } else {
                 // Optimistic update done via realtime listener
            }
        } catch (e) {
            console.error("Failed to clear service call", e);
        }
    };

    const pedidosHojeAtivos = useMemo(() => pedidosHoje.filter(p => p.status !== "cancelado"), [pedidosHoje]);
    const faturamentoHoje = useMemo(() => pedidosHojeAtivos.reduce((acc, p) => acc + Number(p.total), 0), [pedidosHojeAtivos]);
    
    const pedidosOntemAtivos = useMemo(() => pedidosOntem.filter(p => p.status !== "cancelado"), [pedidosOntem]);
    const faturamentoOntem = useMemo(() => pedidosOntemAtivos.reduce((acc, p) => acc + Number(p.total), 0), [pedidosOntemAtivos]);
    
    const growth = useMemo(() => {
        if (faturamentoOntem === 0) return faturamentoHoje > 0 ? 100 : 0;
        return ((faturamentoHoje - faturamentoOntem) / faturamentoOntem) * 100;
    }, [faturamentoHoje, faturamentoOntem]);

    const producing = useMemo(() => pedidosHoje.filter(p => p.status === "preparando").length, [pedidosHoje]);

    const ticketMedio = useMemo(() => {
        if (pedidosHojeAtivos.length === 0) return 0;
        return faturamentoHoje / pedidosHojeAtivos.length;
    }, [faturamentoHoje, pedidosHojeAtivos]);

    const ordersData = useMemo(() => {
        const { from, to } = { from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) };
        const days = eachDayOfInterval({ start: from, end: to });
        const pedActive = pedidos.filter(p => p.status !== "cancelado");
        return days.map(day => {
            const dayStr = format(day, "yyyy-MM-dd");
            const count = pedActive.filter(p => format(parseISO(p.criado_em), "yyyy-MM-dd") === dayStr).length;
            
            let dayName = format(day, "EEE", { locale: ptBR });
            dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

            return { day: dayName, pedidos: count };
        });
    }, [pedidos]);

    const trafficData = useMemo(() => {
        const hours = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6];
        const hourMap: Record<string, number> = {};
        hours.forEach(h => {
            hourMap[String(h).padStart(2, "0")] = 0;
        });

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

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-[calc(100vh-3.5rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)] w-full overflow-y-auto">
            <div className="px-6 py-4 space-y-2.5">
            {/* HEADER */}
            <div className="flex flex-col gap-4 shrink-0">
                <div className="flex items-center justify-between">
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

                {/* ACTIVE SERVICE CALLS ALERTS */}
                {activeServiceCalls.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {activeServiceCalls.map(call => (
                            <div key={call.id} className={`flex items-center justify-between p-3 rounded-lg border ${call.type === 'garcom' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${call.type === 'garcom' ? 'bg-blue-500/20' : 'bg-red-500/20'}`}>
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold">
                                            {call.type === 'garcom' ? `Mesa ${call.mesa} chamando garçom` : `Mesa ${call.mesa} solicitou a conta`}
                                        </span>
                                        <span className="text-xs opacity-80">
                                            Solicitado às {format(call.time, "HH:mm")}
                                        </span>
                                    </div>
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleClearServiceCall(call.id, call.mesa, call.type)}
                                    className="bg-background/50 hover:bg-background"
                                >
                                    Atendido
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- METRICS CARDS --- */}
            <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4 shrink-0">
                <Card className="shadow-none rounded-xl border border-border hover:border-foreground/20 transition-colors duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">Faturamento Hoje</CardTitle>
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-lg font-bold tracking-tight">
                            R$ {faturamentoHoje.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                        {growth !== 0 && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <span className={growth > 0 ? "text-emerald-500 font-medium flex items-center" : "text-red-500 font-medium flex items-center"}>
                                    {growth > 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingUp className="h-3 w-3 mr-0.5 rotate-180" />} 
                                    {growth > 0 ? "+" : ""}{growth.toFixed(1)}%
                                </span> 
                                em relação a ontem
                            </p>
                        )}
                        {growth === 0 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">Igual a ontem</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="shadow-none rounded-xl border border-border hover:border-foreground/20 transition-colors duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">Pedidos (Hoje)</CardTitle>
                        <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-lg font-bold tracking-tight">
                            {pedidosHojeAtivos.length}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            <span className="font-medium text-foreground">{producing}</span> produzindo agora
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none rounded-xl border border-border hover:border-foreground/20 transition-colors duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">Ticket Médio</CardTitle>
                        <Armchair className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-lg font-bold tracking-tight">
                            R$ {ticketMedio.toFixed(2)}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            Por pedido finalizado
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none rounded-xl border border-border hover:border-foreground/20 transition-colors duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-4">
                        <CardTitle className="text-[11px] font-medium text-muted-foreground">Alertas de Estoque</CardTitle>
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-lg font-bold tracking-tight text-amber-500">
                            {estoqueBaixo.length} itens
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            Precisam de reposição
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* --- ROW 2: Charts + Top Vendidos --- */}
            <div className="grid gap-2.5 lg:grid-cols-10">

                {/* BAR CHART: Orders per Day */}
                <Card className="lg:col-span-3 shadow-none rounded-xl border border-border hover:border-foreground/20 transition-colors duration-300">
                    <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                        <CardTitle className="text-xs font-semibold">Pedidos por Dia</CardTitle>
                        <CardDescription className="text-[11px]">Volume últimos 7 dias</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <ChartContainer config={ordersChartConfig} className="h-[200px] w-full">
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
                    </CardContent>
                </Card>

                {/* PIE CHART: Categories */}
                <Card className="lg:col-span-3 shadow-none rounded-xl border border-border hover:border-foreground/20 transition-colors duration-300">
                    <CardHeader className="items-center pb-0 pt-3 px-4 shrink-0">
                        <CardTitle className="text-xs font-semibold">Top Categorias</CardTitle>
                        <CardDescription className="text-[11px]">Vendas últimos 7 dias</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3 px-4 flex items-center justify-center">
                        {categoryData.length === 0 ? (
                            <div className="text-sm text-muted-foreground">Sem dados</div>
                        ) : (
                            <ChartContainer
                                config={categoryChartConfig}
                                className="mx-auto aspect-square h-[200px]"
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
                        )}
                    </CardContent>
                </Card>

                {/* TOP MAIS VENDIDOS */}
                <Card className="lg:col-span-4 shadow-none rounded-xl border border-border hover:border-foreground/20 transition-colors duration-300">
                    <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                        <CardTitle className="text-xs font-semibold">Top Mais Vendidos</CardTitle>
                        <CardDescription className="text-[11px]">Ranking de saída hoje</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col min-h-0 px-4 pb-3 overflow-hidden">
                        <ScrollArea className="flex-1 w-full min-h-[120px] hidden-scrollbar">
                            {topProducts.length === 0 ? (
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
            <div className="grid gap-2.5 lg:grid-cols-10">

                {/* AREA CHART: Hourly Traffic */}
                <Card className="lg:col-span-6 shadow-none rounded-xl border border-border hover:border-foreground/20 transition-colors duration-300">
                    <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                        <CardTitle className="text-xs font-semibold">Pico de Movimento (Hoje)</CardTitle>
                        <CardDescription className="text-[11px]">Volume de pedidos por hora (18:00 às 06:00)</CardDescription>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <ChartContainer config={trafficChartConfig} className="h-[200px] w-full">
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
                    </CardContent>
                </Card>

                {/* ESTOQUE BAIXO */}
                <Card className="lg:col-span-4 shadow-none rounded-xl border border-border hover:border-foreground/20 transition-colors duration-300">
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
                            {estoqueBaixo.length === 0 ? (
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
        </div>
    );
}
