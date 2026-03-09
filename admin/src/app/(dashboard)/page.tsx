"use client";

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
    Package
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

// --- MOCK DATA --- 
const ordersData = [
    { day: "Seg", pedidos: 18 },
    { day: "Ter", pedidos: 24 },
    { day: "Qua", pedidos: 35 },
    { day: "Qui", pedidos: 42 },
    { day: "Sex", pedidos: 68 },
    { day: "Sáb", pedidos: 85 },
    { day: "Dom", pedidos: 55 },
];

const categoryData = [
    { category: "Vinhos", visitors: 420, fill: "#EC662D" },
    { category: "Entradas", visitors: 310, fill: "#2F3232" },
    { category: "Destilados", visitors: 250, fill: "#838585" },
    { category: "Carnes", visitors: 180, fill: "#D9D3D1" },
    { category: "Outros", visitors: 90, fill: "#4B4E4E" },
];

const trafficData = [
    { time: "17:00", active: 5 },
    { time: "18:00", active: 18 },
    { time: "19:00", active: 45 },
    { time: "20:00", active: 82 },
    { time: "21:00", active: 110 },
    { time: "22:00", active: 95 },
    { time: "23:00", active: 60 },
    { time: "00:00", active: 20 },
];

const topProducts = [
    { name: "Caipirinha", category: "Drinks", qty: 42, revenue: "R$ 630", img: "https://res.cloudinary.com/ddhlqymvf/image/upload/v1771605684/App_Bar_50Acorona_50kb_23_z6gxst.png" },
    { name: "Stella Gold", category: "Cervejas", qty: 38, revenue: "R$ 1.520", img: "https://res.cloudinary.com/ddhlqymvf/image/upload/v1772140661/App_Bar_50Acorona_50kb_1_mstuq1.png" },
    { name: "Pérgola Tinto", category: "Vinhos", qty: 22, revenue: "R$ 770", img: "https://res.cloudinary.com/ddhlqymvf/image/upload/v1772733834/Bebida_500x600_5_umkpav.png" },
    { name: "Skol", category: "Cervejas", qty: 18, revenue: "R$ 2.160", img: "https://res.cloudinary.com/ddhlqymvf/image/upload/v1772140662/App_Bar_50Acorona_50kb_3_bpkyvq.png" },
    { name: "Ice Fruit Mix", category: "Bebidas", qty: 15, revenue: "R$ 450", img: "https://res.cloudinary.com/ddhlqymvf/image/upload/v1772146251/App_Bar_50Acorona_50kb_27_vg1ujs.png" },
];

const lowStockProducts = [
    { name: "Vodka Grey Goose", category: "Destilados", stock: 5, img: "https://res.cloudinary.com/ddhlqymvf/image/upload/v1771541227/App_Bar_50Acorona_50kb_11_rirvjo.png" },
    { name: "Casal Garcia Branco", category: "Vinhos", stock: 3, img: "https://res.cloudinary.com/ddhlqymvf/image/upload/v1772673377/Bebida_Canva_wyzaek.png" },
    { name: "Gin Tanqueray", category: "Destilados", stock: 2, img: "https://res.cloudinary.com/ddhlqymvf/image/upload/v1771541223/App_Bar_50Acorona_50kb_7_akzpmv.png" },
    { name: "Drink Melancita", category: "Drinks", stock: 4, img: "https://res.cloudinary.com/ddhlqymvf/image/upload/v1771585718/App_Bar_50Acorona_50kb_15_mpfjzn.png" },
    { name: "Quinta do Morgado", category: "Vinhos", stock: 1, img: "https://res.cloudinary.com/ddhlqymvf/image/upload/v1772674139/Bebida_Canva_eoqfxf.png" },
];

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


export default function DashboardPage() {
    const totalCategories = categoryData.reduce((acc, curr) => acc + curr.visitors, 0);

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
            <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-4 shrink-0">
                <Card className="shadow-none rounded-xl border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3 px-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Faturamento Hoje</CardTitle>
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-xl font-bold tracking-tight">R$ 5.847,50</div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <span className="text-emerald-500 font-medium flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> +14.5%</span> em relação a ontem
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none rounded-xl border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3 px-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Pedidos (Hoje)</CardTitle>
                        <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-xl font-bold tracking-tight">142</div>
                        <p className="text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground">18</span> produzindo agora
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none rounded-xl border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3 px-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Ticket Médio</CardTitle>
                        <Armchair className="h-3.5 w-3.5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-xl font-bold tracking-tight">R$ 41,17</div>
                        <p className="text-[11px] text-muted-foreground">
                            Por pedido finalizado
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none rounded-xl border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3 px-4">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Alertas de Estoque</CardTitle>
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                        <div className="text-xl font-bold tracking-tight text-amber-500">6 itens</div>
                        <p className="text-[11px] text-muted-foreground">
                            Precisam de reposição urgente
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* --- ROW 2: Charts + Top Vendidos --- */}
            <div className="grid gap-2.5 lg:grid-cols-10 min-h-0 flex-1">

                {/* BAR CHART: Orders per Day */}
                <Card className="lg:col-span-3 shadow-none rounded-xl border border-border flex flex-col min-h-0 h-full">
                    <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                        <CardTitle className="text-xs font-semibold">Pedidos por Dia</CardTitle>
                        <CardDescription className="text-[11px]">Volume semanal</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 px-4 pb-3 flex flex-col min-h-0 relative">
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
                    </CardContent>
                </Card>

                {/* PIE CHART: Categories */}
                <Card className="lg:col-span-3 shadow-none rounded-xl border border-border flex flex-col min-h-0 h-full">
                    <CardHeader className="items-center pb-0 pt-3 px-4 shrink-0">
                        <CardTitle className="text-xs font-semibold">Top Categorias</CardTitle>
                        <CardDescription className="text-[11px]">Janeiro - Junho 2026</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-3 px-4 flex items-center justify-center min-h-0 relative">
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
                    </CardContent>
                </Card>

                {/* TOP MAIS VENDIDOS */}
                <Card className="lg:col-span-4 shadow-none rounded-xl border border-border flex flex-col min-h-0 h-full">
                    <CardHeader className="pb-1 pt-3 px-4 shrink-0">
                        <CardTitle className="text-xs font-semibold">Top Mais Vendidos</CardTitle>
                        <CardDescription className="text-[11px]">Ranking de saída hoje</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col min-h-0 px-4 pb-3 overflow-hidden">
                        <ScrollArea className="flex-1 w-full min-h-[120px]">
                            <div className="space-y-1.5 pr-4 py-1">
                                {topProducts.map((product) => (
                                    <div key={product.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-9 w-8 relative rounded-md bg-muted/60 overflow-hidden border border-border shrink-0 flex items-center justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={product.img} alt={product.name} className="h-full w-full object-contain p-0.5" loading="lazy" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-medium leading-tight">{product.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{product.category}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[13px] font-bold">{product.qty} un</span>
                                            <span className="text-[10px] text-muted-foreground">{product.revenue}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="pt-3 border-t mt-auto shrink-0">
                            <Button variant="outline" className="w-full text-xs font-normal h-8" render={<Link href="/estoque" />}>
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
                        <CardDescription className="text-[11px]">Volume de pedidos por hora</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 px-4 pb-3 flex flex-col min-h-0 relative">
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
                        <ScrollArea className="flex-1 w-full min-h-[120px]">
                            <div className="space-y-1.5 pr-4 py-1">
                                {lowStockProducts.map((product) => (
                                    <div key={product.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-9 w-8 relative rounded-md bg-muted/60 overflow-hidden border border-border shrink-0 flex items-center justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={product.img} alt={product.name} className="h-full w-full object-contain p-0.5" loading="lazy" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-medium leading-tight">{product.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{product.category}</span>
                                            </div>
                                        </div>
                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5 font-medium shrink-0">
                                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> {product.stock} un
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="pt-3 border-t mt-auto shrink-0">
                            <Button variant="outline" className="w-full text-xs font-normal h-8" render={<Link href="/estoque" />}>
                                Ver todos os alertas <ArrowRight className="ml-2 h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
