"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import Image from "next/image";
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
    ChartLegend,
    ChartLegendContent,
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
    { category: "Outros", visitors: 90, fill: "#0B120E" },
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

// --- CHART CONFIGS ---
const ordersChartConfig = {
    pedidos: { label: "Pedidos", color: "#EC662D" },
} satisfies ChartConfig;

const categoryChartConfig = {
    vinhos: { label: "Vinhos", color: "#EC662D" },
    entradas: { label: "Entradas", color: "#2F3232" },
    destilados: { label: "Destilados", color: "#838585" },
    carnes: { label: "Carnes", color: "#D9D3D1" },
    outros: { label: "Outros", color: "#0B120E" },
} satisfies ChartConfig;

const trafficChartConfig = {
    active: { label: "Pedidos Ativos", color: "#EC662D" },
} satisfies ChartConfig;


export default function DashboardPage() {
    const totalCategories = categoryData.reduce((acc, curr) => acc + curr.visitors, 0);

    return (
        <div className="flex-1 w-full space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Dashboard General</h1>
                    <p className="text-sm text-muted-foreground mt-1">Visão geral da operação hoje</p>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-none rounded-xl border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Hoje</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">R$ 5.847,50</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <span className="text-emerald-500 font-medium flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> +14.5%</span> em relação a ontem
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none rounded-xl border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos (Hoje)</CardTitle>
                        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">142</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">18</span> produzindo agora
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none rounded-xl border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
                        <Armchair className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">R$ 41,17</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Por pedido finalizado
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-none rounded-xl border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Alertas de Estoque</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-amber-500">6 itens</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Precisam de reposição urgente
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* --- CHARTS ROW 1 --- */}
            <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-10">

                {/* BAR CHART: Orders per Day */}
                <Card className="md:col-span-4 lg:col-span-6 shadow-none rounded-xl border border-border flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Pedidos por Dia</CardTitle>
                        <CardDescription>Volume semanal de pedidos</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ChartContainer config={ordersChartConfig} className="h-[250px] w-full">
                            <BarChart data={ordersData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="day"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    fontSize={12}
                                />
                                <ChartTooltip
                                    cursor={{ fill: 'var(--accent)', opacity: 0.2 }}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <Bar dataKey="pedidos" fill="#EC662D" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* PIE CHART: Categories */}
                <Card className="md:col-span-3 lg:col-span-4 shadow-none rounded-xl border border-border flex flex-col">
                    <CardHeader className="items-center pb-0">
                        <CardTitle className="text-base font-semibold">Top Categorias</CardTitle>
                        <CardDescription>Janeiro - Junho 2026</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        <ChartContainer
                            config={categoryChartConfig}
                            className="mx-auto aspect-square max-h-[250px]"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={categoryData}
                                    dataKey="visitors"
                                    nameKey="category"
                                    innerRadius={60}
                                    outerRadius={80}
                                    strokeWidth={4}
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
                                                            className="fill-foreground text-3xl font-bold"
                                                        >
                                                            {totalCategories.toLocaleString()}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 24}
                                                            className="fill-muted-foreground text-xs"
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
                    </CardContent>
                </Card>
            </div>

            {/* --- CHARTS & LISTS ROW 2 --- */}
            <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-10">

                {/* AREA CHART: Hourly Traffic */}
                <Card className="md:col-span-4 lg:col-span-6 shadow-none rounded-xl border border-border flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Pico de Movimento (Hoje)</CardTitle>
                        <CardDescription>Volume de pedidos por hora</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ChartContainer config={trafficChartConfig} className="h-[250px] w-full">
                            <AreaChart data={trafficData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-active)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-active)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="time"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    fontSize={12}
                                />
                                <ChartTooltip
                                    cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    content={<ChartTooltipContent indicator="line" />}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="active"
                                    stroke="var(--color-active)"
                                    fillOpacity={1}
                                    fill="url(#colorActive)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* TOP MAIS VENDIDOS */}
                <Card className="md:col-span-3 lg:col-span-4 shadow-none rounded-xl border border-border flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Top Mais Vendidos</CardTitle>
                        <CardDescription>Ranking de saída hoje</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Product 1 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 relative rounded-lg bg-muted overflow-hidden border border-border shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://images.unsplash.com/photo-1618885472179-5e474019f2a2?q=80&w=128&auto=format&fit=crop" alt="Heineken" className="h-full w-full object-cover" loading="lazy" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Heineken 600ml</span>
                                    <span className="text-xs text-muted-foreground">Cervejas</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold">42 un</span>
                                <span className="text-xs text-muted-foreground">R$ 630</span>
                            </div>
                        </div>

                        {/* Product 2 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 relative rounded-lg bg-muted overflow-hidden border border-border shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=128&auto=format&fit=crop" alt="Burger" className="h-full w-full object-cover" loading="lazy" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Smash Double</span>
                                    <span className="text-xs text-muted-foreground">Entradas</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold">38 un</span>
                                <span className="text-xs text-muted-foreground">R$ 1.520</span>
                            </div>
                        </div>

                        {/* Product 3 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 relative rounded-lg bg-muted overflow-hidden border border-border shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=128&auto=format&fit=crop" alt="Aperol Spritz" className="h-full w-full object-cover" loading="lazy" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Aperol Spritz</span>
                                    <span className="text-xs text-muted-foreground">Drinks</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold">22 un</span>
                                <span className="text-xs text-muted-foreground">R$ 770</span>
                            </div>
                        </div>

                        {/* Product 4 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 relative rounded-lg bg-muted overflow-hidden border border-border shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://images.unsplash.com/photo-1546171753-97d7676e4602?q=80&w=128&auto=format&fit=crop" alt="Vinho" className="h-full w-full object-cover" loading="lazy" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Malbec Reserva</span>
                                    <span className="text-xs text-muted-foreground">Vinhos</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold">18 un</span>
                                <span className="text-xs text-muted-foreground">R$ 2.160</span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full text-xs font-normal" render={<Link href="/estoque" />}>
                            Ver ranking completo <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
