import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Armchair,
    UtensilsCrossed,
    DollarSign,
    AlertTriangle,
    ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    return (
        <div className="flex-1 w-full space-y-6 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">Hoje, 06 Mar 2026</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" render={<Link href="/pedidos" />}>
                        Abrir Kanban
                    </Button>
                    <Button variant="outline" size="sm" render={<Link href="/mesas" />}>
                        Ver Mesas
                    </Button>
                    <Button size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-none" render={<Link href="/estoque" />}>
                        Ajustar Estoque
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Metric 1 */}
                <Card className="shadow-none rounded-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Mesas Ocupadas</CardTitle>
                        <Armchair className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">8<span className="text-sm font-normal text-muted-foreground">/15</span></div>
                    </CardContent>
                </Card>

                {/* Metric 2 */}
                <Card className="shadow-none rounded-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Ativos</CardTitle>
                        <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="flex items-baseline justify-between">
                        <div className="text-2xl font-bold">12</div>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 font-normal hover:bg-blue-500/20 border-0">3 novos</Badge>
                    </CardContent>
                </Card>

                {/* Metric 3 */}
                <Card className="shadow-none rounded-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">R$ 3.847,00</div>
                    </CardContent>
                </Card>

                {/* Metric 4 */}
                <Card className="shadow-none rounded-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Estoque Baixo</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">4 itens</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-10">
                <Card className="md:col-span-4 lg:col-span-6 shadow-none rounded-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Últimos Pedidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Mock Row 1 */}
                            <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium text-sm">Mesa 04 (João)</span>
                                    <span className="text-xs text-muted-foreground">2x Chopp, 1x Picanha</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 shadow-none border-0 font-normal">Recebido</Badge>
                                    <span className="text-xs text-muted-foreground">Agora</span>
                                </div>
                            </div>
                            {/* Mock Row 2 */}
                            <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium text-sm">Mesa 12 (Ana)</span>
                                    <span className="text-xs text-muted-foreground">1x Caipirinha</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shadow-none border-0 font-normal">Preparando</Badge>
                                    <span className="text-xs text-muted-foreground">5m atrás</span>
                                </div>
                            </div>
                            {/* Mock Row 3 */}
                            <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium text-sm">Mesa 02 (Carlos)</span>
                                    <span className="text-xs text-muted-foreground">1x Pastel Queijo</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-none border-0 font-normal">Pronto</Badge>
                                    <span className="text-xs text-muted-foreground">12m atrás</span>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" className="w-full mt-4 text-xs font-normal" render={<Link href="/pedidos" />}>
                            Ver todos <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 lg:col-span-4 shadow-none rounded-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Alertas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 border-l-2 border-destructive pl-3 py-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Mesa 07 quer fechar</span>
                                    <span className="text-xs text-muted-foreground">Pedido de conta via celular app</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 border-l-2 border-amber-500 pl-3 py-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Heineken 600ml: estoque 2</span>
                                    <span className="text-xs text-muted-foreground">Abaixo do mínimo (10)</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 border-l-2 border-green-500 pl-3 py-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Pedido #42 servido</span>
                                    <span className="text-xs text-muted-foreground">Mesa 05 recebeu todos os itens</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
