"use client";

import { useEffect, useState, useMemo, Suspense, useCallback } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Search,
    Plus,
    Minus,
    InfinityIcon as Infinity,
    Package,
    Loader2,
    Tag,
    Pencil,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";

// --- Country Flag Mapping ---
const COUNTRY_FLAGS: Record<string, string> = {
    'Brasil': '/flags/brasil.png',
    'Escócia': '/flags/escocia.png',
    'Reino Unido': '/flags/reino_unido.png',
    'Inglaterra': '/flags/reino_unido.png',
    'México': '/flags/mexico.png',
    'EUA': '/flags/eua.png',
    'Estados Unidos (EUA)': '/flags/eua.png',
    'Itália': '/flags/Italia 100x60.png',
    'Portugal': '/flags/Portugal 100x60.png',
    'França': '/flags/franca.png',
    'Holanda': '/flags/holanda.png',
    'Suécia': '/flags/Suecia 100x60.png',
    'Alemanha': '/flags/Bandeira Alemanha 100x60.png',
    'Espanha': '/flags/Espanha 100x60.png',
    'Japão': '/flags/Japão 100x60.png',
    'Polônia': '/flags/Polonia 100x60.png',
    'Porto Rico': '/flags/Porto Rico 100x60.png',
    'Rússia': '/flags/Russia 100x60.png',
    'Cuba': '/flags/Cuba 100x60.png',
    'Áustria': '/flags/Austria 100x60.png',
    'África do Sul': '/flags/África do Sul 100x60.png',
    'Bélgica': '/flags/belgica.png',
    'Suíça': '/flags/Suica 100x60.png',
};

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
    tipo_vinho: string | null;
    pais_origem: string | null;
    descricao: string | null;
}

function getStatus(estoque: number, estoque_minimo: number): { label: string; color: string; type: string } {
    if (estoque === -1) return { label: "Ilimitado", color: "text-muted-foreground bg-muted/50 border-border", type: "ilimitado" };
    if (estoque === 0) return { label: "Esgotado", color: "text-red-500 border-red-500/20 bg-red-500/10", type: "esgotado" };
    if (estoque <= estoque_minimo) return { label: "Baixo", color: "text-amber-500 border-amber-500/20 bg-amber-500/10", type: "baixo" };
    return { label: "OK", color: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10", type: "ok" };
}

// --- Edit Modal ---
function EditProductModal({
    item,
    open,
    onClose,
    onSave,
}: {
    item: StockItem | null;
    open: boolean;
    onClose: () => void;
    onSave: (data: { nome: string; descricao: string; preco: number; estoque: number; imagem_url: string }) => Promise<void>;
}) {
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [preco, setPreco] = useState("");
    const [estoque, setEstoque] = useState("");
    const [imagemUrl, setImagemUrl] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (item) {
            setNome(item.produto_nome);
            setDescricao(item.descricao || "");
            setPreco(item.preco.toFixed(2));
            setEstoque(item.estoque === -1 ? "-1" : String(item.estoque));
            setImagemUrl(item.imagem_url || "");
        }
    }, [item]);

    async function handleSave() {
        setSaving(true);
        try {
            await onSave({
                nome,
                descricao,
                preco: parseFloat(preco),
                estoque: parseInt(estoque),
                imagem_url: imagemUrl,
            });
            onClose();
        } catch (err) {
            console.error("Erro ao salvar:", err);
        } finally {
            setSaving(false);
        }
    }

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[480px] bg-card border-border p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold text-foreground">Editar Produto</DialogTitle>
                </DialogHeader>

                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Product image preview */}
                    <div className="flex justify-center">
                        <div className="h-32 w-24 relative rounded-xl overflow-hidden bg-muted border border-border">
                            {imagemUrl ? (
                                <Image
                                    src={imagemUrl}
                                    alt={nome}
                                    fill
                                    unoptimized
                                    className="object-contain p-1"
                                    sizes="96px"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Package className="h-8 w-8 text-muted-foreground/40" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Nome do Produto</Label>
                        <Input
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="bg-background border-border h-9 text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Descrição</Label>
                        <Textarea
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            className="bg-background border-border text-sm min-h-[80px] resize-none"
                            placeholder="Descrição do produto..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">Preço (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={preco}
                                onChange={(e) => setPreco(e.target.value)}
                                className="bg-background border-border h-9 text-sm font-mono"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">Estoque</Label>
                            <Input
                                type="number"
                                value={estoque}
                                onChange={(e) => setEstoque(e.target.value)}
                                className="bg-background border-border h-9 text-sm font-mono"
                                placeholder="-1 = ilimitado"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-8 px-3 text-xs"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !nome}
                        className="h-8 px-4 text-xs bg-foreground text-background hover:bg-foreground/90"
                    >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                        {saving ? "Salvando..." : "Salvar"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    );
}

// --- Main Content ---
function EstoqueContent() {
    const [items, setItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useQueryState("search", parseAsString.withDefault("").withOptions({ shallow: false }));
    const [filter, setFilter] = useQueryState("categoria", parseAsString.withDefault("todos").withOptions({ shallow: false }));
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);
    const supabase = createClient();

    const fetchStock = useCallback(async () => {
        const { data: wineTypesData } = await supabase
            .from("tipos_vinho")
            .select("tipo, imagem_taca_url");

        const wineGlassMap = new Map((wineTypesData || []).map((tw: any) => [tw.tipo, tw.imagem_taca_url]));

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
                    tipo_vinho,
                    pais_origem,
                    descricao,
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

        const mapped: StockItem[] = (data || []).map((v: any) => {
            let finalImageUrl = v.produtos.imagem_url;
            if (v.nome === "Taça" && v.produtos.tipo_vinho && wineGlassMap.has(v.produtos.tipo_vinho)) {
                finalImageUrl = wineGlassMap.get(v.produtos.tipo_vinho);
            }

            return {
                variacao_id: v.id,
                variacao_nome: v.nome,
                preco: Number(v.preco),
                estoque: v.estoque,
                estoque_minimo: v.estoque_minimo,
                produto_id: v.produtos.id,
                produto_nome: v.produtos.nome,
                imagem_url: finalImageUrl,
                disponivel: v.produtos.disponivel,
                categoria_nome: v.produtos.categorias?.nome || "Sem Categoria",
                tipo_vinho: v.produtos.tipo_vinho,
                pais_origem: v.produtos.pais_origem,
                descricao: v.produtos.descricao,
            };
        });

        setItems(mapped);
        setLoading(false);
    }, []);

    useEffect(() => { fetchStock(); }, [fetchStock]);

    // Counts
    const counts = useMemo(() => {
        const ok = items.filter(i => i.estoque > i.estoque_minimo || i.estoque === -1).length;
        const baixo = items.filter(i => i.estoque > 0 && i.estoque <= i.estoque_minimo).length;
        const esgotado = items.filter(i => i.estoque === 0).length;
        return { ok, baixo, esgotado, total: items.length };
    }, [items]);

    // Categories
    const categories = useMemo(() => {
        const cats = new Set(items.map(i => i.categoria_nome));
        return Array.from(cats).sort();
    }, [items]);

    // Filter
    const filtered = useMemo(() => {
        let result = items;
        if (search) {
            const s = search.toLowerCase();
            result = result.filter(i =>
                i.produto_nome.toLowerCase().includes(s) ||
                i.variacao_nome.toLowerCase().includes(s) ||
                i.categoria_nome.toLowerCase().includes(s) ||
                (i.pais_origem && i.pais_origem.toLowerCase().includes(s))
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

        setItems(prev => prev.map(i =>
            i.variacao_id === variacaoId ? { ...i, estoque: newStock } : i
        ));

        const { error } = await supabase
            .from("variacoes_produto")
            .update({ estoque: newStock })
            .eq("id", variacaoId);

        if (error) {
            console.error("Erro ao atualizar estoque:", error);
            fetchStock();
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

    // Save edit
    async function handleSaveEdit(data: { nome: string; descricao: string; preco: number; estoque: number; imagem_url: string }) {
        if (!editingItem) return;

        const { error: prodError } = await supabase
            .from("produtos")
            .update({
                nome: data.nome,
                descricao: data.descricao,
                imagem_url: data.imagem_url,
            })
            .eq("id", editingItem.produto_id);

        const { error: varError } = await supabase
            .from("variacoes_produto")
            .update({
                preco: data.preco,
                estoque: data.estoque,
            })
            .eq("id", editingItem.variacao_id);

        if (prodError || varError) {
            console.error("Erro ao salvar:", prodError || varError);
        }

        await fetchStock();
    }

    const filterButtons = useMemo(() => {
        return [
            { key: "todos", label: "Todos", count: counts.total, icon: Package, activeColor: "text-foreground" },
            ...categories.map(cat => ({
                key: cat,
                label: cat,
                count: items.filter(i => i.categoria_nome === cat).length,
                icon: Tag,
                activeColor: "text-foreground"
            }))
        ];
    }, [counts.total, categories, items]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-[60vh]">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
        );
    }

    return (
        <div className="flex-1 w-full space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">Controle de Estoque</h1>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{counts.total} variações cadastradas</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar produto..."
                        value={search || ""}
                        onChange={e => setSearch(e.target.value)}
                        className="w-64 pl-8 bg-card border-border text-[13px] h-9 focus:border-border placeholder:text-muted-foreground/60"
                    />
                </div>
            </div>

            {/* Resumo do estoque */}
            <div className="flex items-center gap-6 text-[13px]">
                <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">Esgotados</span>
                    <span className="text-muted-foreground font-medium ml-0.5">{counts.esgotado}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">Baixo</span>
                    <span className="text-muted-foreground font-medium ml-0.5">{counts.baixo}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Em Estoque</span>
                    <span className="text-muted-foreground font-medium ml-0.5">{counts.ok}</span>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto scrollbar-none">
                {filterButtons.map(fb => (
                    <button
                        key={fb.key}
                        onClick={() => setFilter(fb.key)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap",
                            filter === fb.key
                                ? `${fb.activeColor} border-current`
                                : "text-muted-foreground border-transparent hover:opacity-80"
                        )}
                    >
                        {fb.icon && <fb.icon className="h-3.5 w-3.5" />}
                        {fb.label}
                        <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full",
                            filter === fb.key ? "bg-foreground/10" : "bg-muted text-muted-foreground"
                        )}>
                            {fb.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="rounded-lg border overflow-hidden bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="w-[50px] text-muted-foreground text-[11px] font-semibold uppercase"></TableHead>
                            <TableHead className="text-muted-foreground text-[11px] font-semibold uppercase">Produto</TableHead>
                            <TableHead className="text-center text-muted-foreground text-[11px] font-semibold uppercase">Variação</TableHead>
                            <TableHead className="text-center text-muted-foreground text-[11px] font-semibold uppercase">Categoria</TableHead>
                            <TableHead className="text-center text-muted-foreground text-[11px] font-semibold uppercase">Origem</TableHead>
                            <TableHead className="text-center text-muted-foreground text-[11px] font-semibold uppercase">Estoque</TableHead>
                            <TableHead className="text-center text-muted-foreground text-[11px] font-semibold uppercase">Status</TableHead>
                            <TableHead className="text-center text-muted-foreground text-[11px] font-semibold uppercase">App</TableHead>
                            <TableHead className="text-center text-muted-foreground text-[11px] font-semibold uppercase">Preço</TableHead>
                            <TableHead className="text-center text-muted-foreground text-[11px] font-semibold uppercase">Ação</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                                    Nenhum produto encontrado
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((item, idx) => {
                                const status = getStatus(item.estoque, item.estoque_minimo);
                                const isUpdating = updatingIds.has(item.variacao_id);
                                const flagUrl = item.pais_origem ? COUNTRY_FLAGS[item.pais_origem] : null;

                                return (
                                    <TableRow
                                        key={item.variacao_id}
                                        className={cn(
                                            "border-border hover:bg-muted/50 transition-colors",
                                            idx % 2 === 1 && "bg-muted/20",
                                            item.estoque === 0 && "opacity-60"
                                        )}
                                    >
                                        {/* Thumbnail */}
                                        <TableCell className="py-2">
                                            <HoverCard>
                                                <HoverCardTrigger>
                                                    <div className="h-9 w-9 relative rounded-md overflow-hidden bg-muted border cursor-pointer group">
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
                                                            <div className="absolute inset-0 flex items-center justify-center text-[8px] text-muted-foreground/60">
                                                                <Package className="h-3.5 w-3.5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </HoverCardTrigger>
                                                {item.imagem_url && (
                                                    <HoverCardContent side="right" className="w-64 p-0 rounded-xl overflow-hidden border bg-card shadow-2xl flex flex-col z-50">
                                                        <div className="relative w-full aspect-[5/6] bg-muted/50">
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
                                                        </div>
                                                        <div className="p-4 bg-card border-t">
                                                            <p className="text-foreground font-medium text-sm leading-tight">{item.produto_nome}</p>
                                                            <p className="text-muted-foreground text-xs mt-1">{item.variacao_nome}</p>
                                                        </div>
                                                    </HoverCardContent>
                                                )}
                                            </HoverCard>
                                        </TableCell>

                                        <TableCell>
                                            <div className="font-semibold text-foreground text-sm">{item.produto_nome}</div>
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground text-sm">
                                            {item.variacao_nome}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="text-[10px] font-medium bg-muted border text-muted-foreground rounded-md px-2 py-0.5">
                                                {item.categoria_nome}
                                            </Badge>
                                        </TableCell>

                                        {/* Origin with flag */}
                                        <TableCell className="text-center">
                                            {item.pais_origem ? (
                                                <div className="inline-flex items-center justify-center gap-1.5">
                                                    {flagUrl && (
                                                        <img
                                                            src={flagUrl}
                                                            alt={item.pais_origem}
                                                            width={16}
                                                            height={10}
                                                            className="rounded-[2px] object-cover"
                                                            loading="eager"
                                                            decoding="async"
                                                        />
                                                    )}
                                                    <span className="text-[11px] text-muted-foreground">{item.pais_origem}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground/40">—</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center justify-center min-w-[3rem]">
                                                {item.estoque === -1 ? (
                                                    <Infinity className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <span className={cn(
                                                        "font-mono text-[13px] font-medium",
                                                        item.estoque === 0 ? "text-red-400" :
                                                            item.estoque <= item.estoque_minimo ? "text-amber-400" : "text-foreground"
                                                    )}>
                                                        {item.estoque}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] uppercase font-medium tracking-wider px-2 py-0.5 rounded-full border",
                                                        status.color
                                                    )}
                                                >
                                                    {status.label}
                                                </Badge>
                                            </div>
                                        </TableCell>

                                        {/* Availability Toggle */}
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => toggleDisponivel(item.produto_id, item.disponivel)}
                                                    className={cn(
                                                        "relative inline-flex h-4 w-7 cursor-pointer items-center rounded-full transition-colors focus:outline-hidden",
                                                        item.disponivel ? "bg-emerald-500/80" : "bg-muted-foreground/30"
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

                                        <TableCell className="text-center font-mono text-sm text-muted-foreground">
                                            R$ {item.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                                                    onClick={() => adjustStock(item.variacao_id, -1)}
                                                    disabled={isUpdating || item.estoque <= 0}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                                                    onClick={() => adjustStock(item.variacao_id, 1)}
                                                    disabled={isUpdating || item.estoque === -1}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                                                    onClick={() => setEditingItem(item)}
                                                >
                                                    <Pencil className="h-3 w-3" />
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

            {/* Edit Modal */}
            <EditProductModal
                item={editingItem}
                open={!!editingItem}
                onClose={() => setEditingItem(null)}
                onSave={handleSaveEdit}
            />
        </div>
    );
}

export default function EstoquePage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center h-[60vh]">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
        }>
            <EstoqueContent />
        </Suspense>
    );
}
