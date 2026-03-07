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
const salesData = [
    { day: "Seg", revenue: 1200, costs: 800 },
    { day: "Ter", revenue: 1500, costs: 1000 },
    { day: "Qua", revenue: 2200, costs: 1100 },
    { day: "Qui", revenue: 2800, costs: 1500 },
    { day: "Sex", revenue: 4500, costs: 2200 },
    { day: "Sáb", revenue: 5800, costs: 2500 },
    { day: "Dom", revenue: 3800, costs: 1800 },
];

const categoryData = [
    { category: "Vinhos", visitors: 420, fill: "var(--chart-1)" },
    { category: "Entradas", visitors: 310, fill: "var(--chart-2)" },
    { category: "Destilados", visitors: 250, fill: "var(--chart-3)" },
    { category: "Carnes", visitors: 180, fill: "var(--chart-4)" },
    { category: "Outros", visitors: 90, fill: "var(--chart-5)" },
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
const salesChartConfig = {
    revenue: { label: "Faturamento", color: "var(--chart-1)" },
    costs: { label: "Custos", color: "var(--chart-2)" },
} satisfies ChartConfig;

const categoryChartConfig = {
    vinhos: { label: "Vinhos", color: "var(--chart-1)" },
    entradas: { label: "Entradas", color: "var(--chart-2)" },
    destilados: { label: "Destilados", color: "var(--chart-3)" },
    carnes: { label: "Carnes", color: "var(--chart-4)" },
    outros: { label: "Outros", color: "var(--chart-5)" },
} satisfies ChartConfig;

const trafficChartConfig = {
    active: { label: "Pedidos Ativos", color: "var(--brand-orange)" },
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

                {/* BAR CHART: Weekly Sales */}
                <Card className="md:col-span-4 lg:col-span-6 shadow-none rounded-xl border border-border flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Faturamento da Semana</CardTitle>
                        <CardDescription>Receita vs Custos Diários</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <ChartContainer config={salesChartConfig} className="h-[250px] w-full">
                            <BarChart data={salesData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
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
                                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="costs" fill="var(--color-costs)" radius={[4, 4, 0, 0]} opacity={0.6} />
                                <ChartLegend content={<ChartLegendContent />} />
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

                {/* BEST SELLERS LIST */}
                <Card className="md:col-span-3 lg:col-span-4 shadow-none rounded-xl border border-border flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Mais Vendidos & Baixo Estoque</CardTitle>
                        <CardDescription>Visão operacional rápida</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Best Seller 1 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 relative rounded-md bg-muted overflow-hidden border border-border shrink-0">
                                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/20">
                                        <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Heineken 600ml</span>
                                    <span className="text-xs text-muted-foreground">42 un sold</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold">R$ 630</span>
                                <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded flex items-center mt-0.5 font-medium"><AlertTriangle className="w-3 h-3 mr-1" /> Low (5 un)</span>
                            </div>
                        </div>

                        {/* Best Seller 2 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 relative rounded-md bg-muted overflow-hidden border border-border shrink-0">
                                    <div className="absolute inset-0 flex items-center justify-center bg-amber-500/10 dark:bg-amber-500/20">
                                        <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Smash Double</span>
                                    <span className="text-xs text-muted-foreground">38 un sold</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold">R$ 1.520</span>
                                <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center mt-0.5 font-medium">OK (80 un)</span>
                            </div>
                        </div>

                        {/* Best Seller 3 */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 relative rounded-md bg-muted overflow-hidden border border-border shrink-0">
                                    <div className="absolute inset-0 flex items-center justify-center bg-brand/10 dark:bg-brand/20">
                                        <Package className="h-4 w-4 text-brand dark:text-brand" />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Aperol Spritz</span>
                                    <span className="text-xs text-muted-foreground">22 un sold</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold">R$ 770</span>
                                <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center mt-0.5 font-medium">OK (112 un)</span>
                            </div>
                        </div>

                        <Button variant="outline" className="w-full text-xs font-normal" render={<Link href="/estoque" />}>
                            Ver lista completa <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
