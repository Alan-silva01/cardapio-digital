import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Plus, Minus, Infinity } from "lucide-react";
import Image from "next/image";

export default function EstoquePage() {
    return (
        <div className="flex-1 w-full space-y-6 p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Buscar produto..."
                            className="w-64 pl-8 bg-background shadow-none"
                        />
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                {/* Metric 1 */}
                <Card className="shadow-none rounded-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">OK</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">48</div>
                    </CardContent>
                </Card>

                {/* Metric 2 */}
                <Card className="shadow-none rounded-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Baixo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">4</div>
                    </CardContent>
                </Card>

                {/* Metric 3 */}
                <Card className="shadow-none rounded-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Esgotados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">2</div>
                    </CardContent>
                </Card>

                {/* Metric 4 */}
                <Card className="shadow-none rounded-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">66</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="todos" className="w-full">
                <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 mb-4 space-x-6">
                    <TabsTrigger value="todos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 pt-1 font-medium">Todos</TabsTrigger>
                    <TabsTrigger value="baixo" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 pt-1 font-medium text-amber-500 data-[state=active]:text-amber-500">🟡 Baixo (4)</TabsTrigger>
                    <TabsTrigger value="esgotado" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 pt-1 font-medium text-destructive data-[state=active]:text-destructive">🔴 Esgotado (2)</TabsTrigger>
                    <TabsTrigger value="ilimitado" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2 pt-1 font-medium">∞ Ilimitado</TabsTrigger>
                </TabsList>

                <Card className="shadow-none rounded-md overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[60px]"></TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead className="text-center">Estoque</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">Preço</TableHead>
                                <TableHead className="text-right">Ações Rápidas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Row 1 - Amber (Low) */}
                            <TableRow>
                                <TableCell>
                                    <div className="h-10 w-10 relative rounded-md overflow-hidden bg-muted">
                                        {/* Placeholder for product image */}
                                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Img</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">Heineken</div>
                                    <div className="text-xs text-muted-foreground">600ml</div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs text-muted-foreground">Bebidas</span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="font-bold text-lg">3</div>
                                    <div className="text-[10px] text-muted-foreground">Min: 10</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/10 font-normal">Baixo</Badge>
                                </TableCell>
                                <TableCell className="text-center">R$ 17,00</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-md"><Minus className="h-3 w-3" /></Button>
                                        <Input className="w-12 h-8 text-center" defaultValue="3" />
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-md"><Plus className="h-3 w-3" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Row 2 - Red (Out of Stock) */}
                            <TableRow className="bg-muted/20">
                                <TableCell>
                                    <div className="h-10 w-10 relative rounded-md overflow-hidden bg-muted">
                                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Img</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-muted-foreground">Pastel de Queijo</div>
                                    <div className="text-xs text-muted-foreground">Unidade</div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs text-muted-foreground">Porções</span>
                                </TableCell>
                                <TableCell className="text-center opacity-50">
                                    <div className="font-bold text-lg">0</div>
                                    <div className="text-[10px] text-muted-foreground">Min: 20</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/10 font-normal">Esgotado</Badge>
                                </TableCell>
                                <TableCell className="text-center text-muted-foreground">R$ 12,00</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-md" disabled><Minus className="h-3 w-3" /></Button>
                                        <Input className="w-12 h-8 text-center text-muted-foreground" defaultValue="0" disabled />
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-md"><Plus className="h-3 w-3" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Row 3 - Gray (Infinity) */}
                            <TableRow>
                                <TableCell>
                                    <div className="h-10 w-10 relative rounded-md overflow-hidden bg-muted">
                                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Img</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">Picanha Grelhada</div>
                                    <div className="text-xs text-muted-foreground">Porção 500g</div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs text-muted-foreground">Pratos</span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Infinity className="h-5 w-5 mx-auto text-muted-foreground" />
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="text-muted-foreground border-border bg-muted font-normal">Ilimitado</Badge>
                                </TableCell>
                                <TableCell className="text-center">R$ 89,00</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <span className="text-xs text-muted-foreground italic px-2">Gerenciado no cardápio</span>
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Row 4 - Green (OK) */}
                            <TableRow className="bg-muted/20">
                                <TableCell>
                                    <div className="h-10 w-10 relative rounded-md overflow-hidden bg-muted">
                                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">Img</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">Coca-Cola</div>
                                    <div className="text-xs text-muted-foreground">Lata 350ml</div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs text-muted-foreground">Bebidas</span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="font-bold text-lg">45</div>
                                    <div className="text-[10px] text-muted-foreground">Min: 24</div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className="text-green-500 border-green-500/20 bg-green-500/10 font-normal">OK</Badge>
                                </TableCell>
                                <TableCell className="text-center">R$ 6,00</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-md"><Minus className="h-3 w-3" /></Button>
                                        <Input className="w-12 h-8 text-center" defaultValue="45" />
                                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-md"><Plus className="h-3 w-3" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>

                        </TableBody>
                    </Table>
                </Card>
            </Tabs>
        </div>
    );
}
