"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Plus, Minus, InfinityIcon as Infinity, Package, AlertTriangle, XCircle, CheckCircle2, Loader2, Tag } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

interface StockItem {
    variacao_id: string;
    variacao_nome: string;
    preco: number;
    estoque: number;
    estoque_minimo: number;
    produto_id: string;
    produto_nome: string;
    imagem_url: string | null;
    disponivel: boolean;
    categoria_nome: string;
}

function getStatus(estoque: number, estoque_minimo: number): { label: string; color: string; type: string } {
    if (estoque === -1) return { label: "Ilimitado", color: "text-[#666] border-[#333] bg-[#1a1a1a]", type: "ilimitado" };
    if (estoque === 0) return { label: "Esgotado", color: "text-red-400 border-red-500/20 bg-red-500/10", type: "esgotado" };
    if (estoque <= estoque_minimo) return { label: "Baixo", color: "text-amber-400 border-amber-500/20 bg-amber-500/10", type: "baixo" };
    return { label: "OK", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", type: "ok" };
}

function EstoqueContent() {
    const [items, setItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useQueryState("search", parseAsString.withDefault("").withOptions({ shallow: false }));
    const [filter, setFilter] = useQueryState("categoria", parseAsString.withDefault("todos").withOptions({ shallow: false }));
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

    async function fetchStock() {
        const { data, error } = await supabase
            .from("variacoes_produto")
            .select(`
                id,
                nome,
                preco,
                estoque,
                estoque_minimo,
                produto_id,
                produtos!inner (
                    id,
                    nome,
                    imagem_url,
                    disponivel,
                    categorias (
                        nome
                    )
                )
            `)
            .eq("ativo", true)
            .order("nome");

        if (error) {
            console.error("Erro ao buscar estoque:", error);
            setLoading(false);
            return;
        }

        const mapped: StockItem[] = (data || []).map((v: any) => ({
            variacao_id: v.id,
            variacao_nome: v.nome,
            preco: Number(v.preco),
            estoque: v.estoque,
            estoque_minimo: v.estoque_minimo,
            produto_id: v.produtos.id,
            produto_nome: v.produtos.nome,
            imagem_url: v.produtos.imagem_url,
            disponivel: v.produtos.disponivel,
            categoria_nome: v.produtos.categorias?.nome || "Sem Categoria",
        }));

        setItems(mapped);
        setLoading(false);
    }

    useEffect(() => {
        fetchStock();
    }, []);

    // Counts
    const counts = useMemo(() => {
        const ok = items.filter(i => i.estoque > i.estoque_minimo || i.estoque === -1).length;
        const baixo = items.filter(i => i.estoque > 0 && i.estoque <= i.estoque_minimo).length;
        const esgotado = items.filter(i => i.estoque === 0).length;
        return { ok, baixo, esgotado, total: items.length };
    }, [items]);

    // Categories calculation
    const categories = useMemo(() => {
        const cats = new Set(items.map(i => i.categoria_nome));
        return Array.from(cats).sort();
    }, [items]);

    // Filtered items
    const filtered = useMemo(() => {
        let result = items;

        if (search) {
            const s = search.toLowerCase();
            result = result.filter(i =>
                i.produto_nome.toLowerCase().includes(s) ||
                i.variacao_nome.toLowerCase().includes(s) ||
                i.categoria_nome.toLowerCase().includes(s)
            );
        }

        if (filter !== "todos") {
            result = result.filter(i => i.categoria_nome === filter);
        }

        return result;
    }, [items, search, filter]);

    // Quick stock adjustment
    async function adjustStock(variacaoId: string, delta: number) {
        const item = items.find(i => i.variacao_id === variacaoId);
        if (!item || item.estoque === -1) return;

        const newStock = Math.max(0, item.estoque + delta);
        setUpdatingIds(prev => new Set(prev).add(variacaoId));

        // Optimistic update
        setItems(prev => prev.map(i =>
            i.variacao_id === variacaoId ? { ...i, estoque: newStock } : i
        ));

        const { error } = await supabase
            .from("variacoes_produto")
            .update({ estoque: newStock })
            .eq("id", variacaoId);

        if (error) {
            console.error("Erro ao atualizar estoque:", error);
            fetchStock(); // Revert on error
        }

        setUpdatingIds(prev => {
            const next = new Set(prev);
            next.delete(variacaoId);
            return next;
        });
    }

    // Toggle disponivel
    async function toggleDisponivel(produtoId: string, current: boolean) {
        setItems(prev => prev.map(i =>
            i.produto_id === produtoId ? { ...i, disponivel: !current } : i
        ));

        const { error } = await supabase
            .from("produtos")
            .update({ disponivel: !current })
            .eq("id", produtoId);

        if (error) {
            console.error("Erro ao toggle disponibilidade:", error);
            fetchStock();
        }
    }

    const filterButtons = useMemo(() => {
        return [
            { key: "todos", label: "Todos", count: counts.total, icon: Package, activeColor: "text-white" },
            ...categories.map(cat => ({
                key: cat,
                label: cat,
                count: items.filter(i => i.categoria_nome === cat).length,
                icon: Tag,
                activeColor: "text-white"
            }))
        ];
    }, [counts.total, categories, items]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-[60vh]">
                <Loader2 className="h-6 w-6 animate-spin text-[#666]" />
            </div>
        );
    }

    return (
        <div className="flex-1 w-full space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-white">Controle de Estoque</h1>
                    <p className="text-[13px] text-[#666] mt-0.5">{counts.total} variações cadastradas</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#555]" />
                    <Input
                        type="search"
                        placeholder="Buscar produto..."
                        value={search || ""}
                        onChange={e => setSearch(e.target.value)}
                        className="w-64 pl-8 bg-[#1a1a1a] border-[#333] text-[13px] h-9 focus:border-[#555] placeholder:text-[#444]"
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-3 grid-cols-4">
                <Card className="bg-[#111] border-[#222] shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                        <CardTitle className="text-[11px] font-medium text-[#666] uppercase tracking-wider">OK</CardTitle>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/50" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold text-emerald-400">{counts.ok}</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#111] border-[#222] shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                        <CardTitle className="text-[11px] font-medium text-[#666] uppercase tracking-wider">Baixo</CardTitle>
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500/50" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold text-amber-400">{counts.baixo}</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#111] border-[#222] shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                        <CardTitle className="text-[11px] font-medium text-[#666] uppercase tracking-wider">Esgotados</CardTitle>
                        <XCircle className="h-3.5 w-3.5 text-red-500/50" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold text-red-400">{counts.esgotado}</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#111] border-[#222] shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
                        <CardTitle className="text-[11px] font-medium text-[#666] uppercase tracking-wider">Total</CardTitle>
                        <Package className="h-3.5 w-3.5 text-[#555]" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold text-white">{counts.total}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 border-b border-[#222] pb-0 overflow-x-auto scrollbar-none">
                {filterButtons.map(fb => (
                    <button
                        key={fb.key}
                        onClick={() => setFilter(fb.key)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap",
                            filter === fb.key
                                ? `${fb.activeColor} border-current`
                                : "text-[#555] border-transparent hover:text-[#888]"
                        )}
                    >
                        {fb.icon && <fb.icon className="h-3.5 w-3.5" />}
                        {fb.label}
                        <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full",
                            filter === fb.key ? "bg-white/10" : "bg-[#1a1a1a] text-[#555]"
                        )}>
                            {fb.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-lg border border-[#222] overflow-hidden bg-[#111]">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-[#222]">
                            <TableHead className="w-[50px] text-[#555] text-[11px] font-medium uppercase"></TableHead>
                            <TableHead className="text-[#555] text-[11px] font-medium uppercase">Produto</TableHead>
                            <TableHead className="text-[#555] text-[11px] font-medium uppercase">Variação</TableHead>
                            <TableHead className="text-[#555] text-[11px] font-medium uppercase">Categoria</TableHead>
                            <TableHead className="text-center text-[#555] text-[11px] font-medium uppercase">Estoque</TableHead>
                            <TableHead className="text-center text-[#555] text-[11px] font-medium uppercase">Status</TableHead>
                            <TableHead className="text-center text-[#555] text-[11px] font-medium uppercase">App</TableHead>
                            <TableHead className="text-right text-[#555] text-[11px] font-medium uppercase">Preço</TableHead>
                            <TableHead className="text-right text-[#555] text-[11px] font-medium uppercase">Ação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-[#555] py-12">
                                    Nenhum produto encontrado
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((item, idx) => {
                                const status = getStatus(item.estoque, item.estoque_minimo);
                                const isUpdating = updatingIds.has(item.variacao_id);
                                return (
                                    <TableRow
                                        key={item.variacao_id}
                                        className={cn(
                                            "border-[#1a1a1a] hover:bg-[#1a1a1a]/50 transition-colors",
                                            idx % 2 === 1 && "bg-[#0d0d0d]/50",
                                            item.estoque === 0 && "opacity-60"
                                        )}
                                    >
                                        {/* Thumbnail */}
                                        <TableCell className="py-2">
                                            <HoverCard>
                                                <HoverCardTrigger>
                                                    <div className="h-9 w-9 relative rounded-md overflow-hidden bg-[#1a1a1a] border border-[#222] cursor-pointer group">
                                                        {item.imagem_url ? (
                                                            <>
                                                                <Image
                                                                    src={item.imagem_url}
                                                                    alt={item.produto_nome}
                                                                    fill
                                                                    priority={idx < 10}
                                                                    unoptimized={true}
                                                                    className={cn(
                                                                        "object-cover transition-all",
                                                                        !item.disponivel && "blur-[2px] opacity-40 grayscale-[0.8]"
                                                                    )}
                                                                    sizes="36px"
                                                                />
                                                                {!item.disponivel && (
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                                        <span className="text-[6px] font-bold text-white uppercase tracking-wider rotate-[-15deg]">Inativo</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="absolute inset-0 flex items-center justify-center text-[8px] text-[#444]">
                                                                <Package className="h-3.5 w-3.5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </HoverCardTrigger>
                                                {item.imagem_url && (
                                                    <HoverCardContent side="right" className="w-64 p-0 rounded-xl overflow-hidden border-[#333] bg-[#111] shadow-2xl flex flex-col">
                                                        <div className="relative w-full aspect-[5/6] bg-black/40">
                                                            <Image
                                                                src={item.imagem_url}
                                                                alt={item.produto_nome}
                                                                fill
                                                                priority={idx < 10}
                                                                unoptimized={true}
                                                                className={cn(
                                                                    "object-contain p-4 transition-all",
                                                                    !item.disponivel && "blur-sm opacity-60 grayscale-[0.5]"
                                                                )}
                                                                sizes="256px"
                                                            />
                                                            {!item.disponivel && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                                                    <div className="border border-red-500/50 bg-red-500/20 text-red-100 px-3 py-1 rounded backdrop-blur-md text-xs font-medium uppercase tracking-widest rotate-[-10deg]">
                                                                        Produto Inativo
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="p-4 bg-[#111] border-t border-[#222]">
                                                            <p className="text-white font-medium text-sm leading-tight">{item.produto_nome}</p>
                                                            <p className="text-[#888] text-xs mt-1">{item.variacao_nome}</p>
                                                        </div>
                                                    </HoverCardContent>
                                                )}
                                            </HoverCard>
                                        </TableCell>

                                        <TableCell>
                                            <div className="font-medium text-white/90 text-sm">{item.produto_nome}</div>
                                        </TableCell>
                                        <TableCell className="text-[#888] text-sm">
                                            {item.variacao_nome}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-medium bg-[#1a1a1a] border-[#333] text-[#888] rounded-md px-2 py-0.5">
                                                {item.categoria_nome}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center justify-center min-w-[3rem]">
                                                {item.estoque === -1 ? (
                                                    <Infinity className="h-4 w-4 text-[#666]" />
                                                ) : (
                                                    <span className={cn(
                                                        "font-mono text-[13px] font-medium",
                                                        item.estoque === 0 ? "text-red-400" :
                                                            item.estoque <= item.estoque_minimo ? "text-amber-400" : "text-emerald-400"
                                                    )}>
                                                        {item.estoque}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex justify-center">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border",
                                                        status.color
                                                    )}
                                                >
                                                    {status.label}
                                                </Badge>
                                            </div>
                                        </TableCell>

                                        {/* Availability Toggle */}
                                        <TableCell>
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => toggleDisponivel(item.produto_id, item.disponivel)}
                                                    className={cn(
                                                        "relative inline-flex h-4 w-7 cursor-pointer items-center rounded-full transition-colors focus:outline-hidden",
                                                        item.disponivel ? "bg-emerald-500/80" : "bg-[#333]"
                                                    )}
                                                    role="switch"
                                                    aria-checked={item.disponivel}
                                                >
                                                    <span className="sr-only">Toggle disponibilidade</span>
                                                    <span
                                                        className={cn(
                                                            "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                                                            item.disponivel ? "translate-x-3.5" : "translate-x-0.5"
                                                        )}
                                                    />
                                                </button>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-right font-mono text-sm text-[#888]">
                                            R$ {item.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full text-[#666] hover:text-white hover:bg-[#222]"
                                                    onClick={() => adjustStock(item.variacao_id, -1)}
                                                    disabled={isUpdating || item.estoque <= 0}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full text-[#666] hover:text-white hover:bg-[#222]"
                                                    onClick={() => adjustStock(item.variacao_id, 1)}
                                                    disabled={isUpdating || item.estoque === -1}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default function EstoquePage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center h-[60vh]">
                <Loader2 className="h-6 w-6 animate-spin text-[#666]" />
            </div>
        }>
            <EstoqueContent />
        </Suspense>
    );
}
