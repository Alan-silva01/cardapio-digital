"use client";

import { useEffect, useState, useMemo, useRef, Suspense, useCallback } from "react";
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
    Check,
    ChevronsUpDown,
    Camera,
    UploadCloud,
    Wine,
    Beer,
    UtensilsCrossed,
    Droplets,
    Users,
    Percent,
    Beaker,
    Star,
    Trash2,
} from "lucide-react";
import { uploadImageAction } from "@/app/actions/upload-image";
import { saveProductAction, deleteProductAction } from "@/app/actions/product-actions";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { countryFlags as COUNTRY_FLAGS } from "@/lib/countryFlags";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";


// --- Custom Select Component ---
function SearchableSelect({
    options,
    value,
    onChange,
    placeholder,
    allowCreate,
    createPrefix = "Criar: ",
}: {
    options: { label: string; value: string }[];
    value: string;
    onChange: (val: string, isNew?: boolean) => void;
    placeholder: string;
    allowCreate?: boolean;
    createPrefix?: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Simplistic click-outside since we don't have popover
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (!target.closest('.searchable-select-container')) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));
    const exactMatch = options.find(o => o.label.toLowerCase() === search.toLowerCase());
    const showCreate = allowCreate && search.trim() !== "" && !exactMatch;

    return (
        <div className="relative w-full searchable-select-container">
            <div
                className="flex items-center justify-between min-h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm hover:border-foreground/30 cursor-pointer text-foreground transition-colors"
                onClick={() => { setOpen(!open); setSearch(""); }}
            >
                <span className="truncate">
                    {value ? (options.find(o => o.value === value)?.label || value) : <span className="text-muted-foreground">{placeholder}</span>}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
            </div>

            {open && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full z-[100] rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 flex flex-col max-h-[220px]">
                    <div className="p-2 border-b border-border">
                        <Input
                            autoFocus
                            placeholder="Pesquisar..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-8 bg-background focus-visible:ring-1 focus-visible:ring-foreground/30 border-none px-2"
                        />
                    </div>
                    <div className="overflow-y-auto p-1 py-1.5 flex-1">
                        {filteredOptions.length === 0 && !showCreate && (
                            <div className="py-4 text-center text-sm text-muted-foreground">Nenhum resultado.</div>
                        )}
                        {filteredOptions.map(opt => (
                            <div
                                key={opt.value}
                                className={cn(
                                    "flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors relative",
                                    value === opt.value && "bg-accent/50 font-medium"
                                )}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                            >
                                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                    {value === opt.value && <Check className="h-4 w-4" />}
                                </span>
                                {opt.label}
                            </div>
                        ))}
                        {showCreate && (
                            <div
                                className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-emerald-500/10 hover:text-emerald-500 font-medium text-emerald-500/80 transition-colors mt-1"
                                onClick={() => { onChange(search.trim(), true); setOpen(false); }}
                            >
                                <Plus className="mr-2 h-4 w-4" /> {createPrefix} "{search.trim()}"
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

interface StockItem {
    variacao_id: string;
    variacao_nome: string;
    preco: number;
    estoque: number;
    estoque_minimo: number;
    produto_id: string;
    produto_nome: string;
    imagem_url: string | null;
    var_imagem_url: string | null;
    var_descricao: string | null;
    disponivel: boolean;
    categoria_id: string | null;
    categoria_nome: string;
    tipo_vinho: string | null;
    pais_origem: string | null;
    descricao: string | null;
    teor_alcolico: number | null;
    volume_ml: number | null;
    serve_pessoas: number | null;
    ml_taca: number | null;
    subcategoria: string | null;
    rating: number | null;
}

const NEW_PRODUCT_TEMPLATE: StockItem = {
    variacao_id: "",
    variacao_nome: "Única",
    preco: 0,
    estoque: 0,
    estoque_minimo: 5,
    produto_id: "",
    produto_nome: "",
    imagem_url: null,
    var_imagem_url: null,
    var_descricao: null,
    disponivel: true,
    categoria_id: null,
    categoria_nome: "",
    tipo_vinho: null,
    pais_origem: "Brasil",
    descricao: "",
    teor_alcolico: null,
    volume_ml: null,
    serve_pessoas: null,
    ml_taca: null,
    subcategoria: null,
    rating: 5,
};

// --- Interactive Star Rating ---
function StarRating({ value, onChange }: { value: number; onChange: (val: number) => void }) {
    const [hoverValue, setHoverValue] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    function getStarValue(e: React.MouseEvent | MouseEvent) {
        if (!containerRef.current) return value;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const starWidth = rect.width / 5;
        const raw = x / starWidth;
        return Math.round(raw * 2) / 2; // snap to 0.5
    }

    function handleMouseDown(e: React.MouseEvent) {
        isDragging.current = true;
        const val = getStarValue(e);
        onChange(Math.max(0.5, Math.min(5, val)));
    }

    useEffect(() => {
        function handleMouseMove(e: MouseEvent) {
            if (!isDragging.current) return;
            const val = getStarValue(e);
            onChange(Math.max(0.5, Math.min(5, val)));
        }
        function handleMouseUp() {
            isDragging.current = false;
        }
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [onChange]);

    const displayValue = hoverValue ?? value;

    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Star className="h-3 w-3" />Avaliação
            </Label>
            <div className="flex items-center gap-2">
                <div
                    ref={containerRef}
                    className="flex items-center cursor-pointer select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={(e) => {
                        if (!isDragging.current) {
                            setHoverValue(Math.max(0.5, Math.min(5, getStarValue(e))));
                        }
                    }}
                    onMouseLeave={() => setHoverValue(null)}
                >
                    {[1, 2, 3, 4, 5].map((star) => {
                        const filled = displayValue >= star;
                        const half = !filled && displayValue >= star - 0.5;
                        return (
                            <div key={star} className="relative h-6 w-6">
                                {/* Empty star bg */}
                                <Star
                                    className="absolute inset-0 h-6 w-6 text-border transition-colors"
                                    strokeWidth={1.5}
                                />
                                {/* Filled overlay */}
                                {(filled || half) && (
                                    <div
                                        className="absolute inset-0 overflow-hidden"
                                        style={{ width: filled ? "100%" : "50%" }}
                                    >
                                        <Star
                                            className="h-6 w-6 text-amber-400 fill-amber-400 transition-all drop-shadow-[0_0_3px_rgba(251,191,36,0.4)]"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                <span className="text-xs font-mono text-muted-foreground tabular-nums w-7 text-center">
                    {displayValue.toFixed(1)}
                </span>
            </div>
        </div>
    );
}

function getStatus(estoque: number, estoque_minimo: number): { label: string; color: string; type: string } {
    if (estoque === -1) return { label: "Ilimitado", color: "text-muted-foreground bg-muted/50 border-border", type: "ilimitado" };
    if (estoque === 0) return { label: "Esgotado", color: "text-red-500 border-red-500/20 bg-red-500/10", type: "esgotado" };
    if (estoque <= estoque_minimo) return { label: "Baixo", color: "text-amber-500 border-amber-500/20 bg-amber-500/10", type: "baixo" };
    return { label: "OK", color: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10", type: "ok" };
}

// --- Subcategory options by category ---
const SUBCATEGORY_MAP: Record<string, string[]> = {
    "Cervejas": ["Long Neck", "Cervejas 600ml", "Zero Álcool", "Stempel"],
    "Vinhos": ["Vinhos Tintos", "Vinhos Brancos", "Vinhos Rosés", "Espumantes", "Stempel"],
    "Destilados": ["Garrafas", "Doses", "Gins"],
    "Whiskeys": ["Garrafas", "Doses"],
    "Vodkas": ["Garrafas", "Doses"],
    "Drinks": ["Menu de Drinks", "Shots"],
    "Bebidas": ["Água & Refri", "Sucos", "Energéticos"],
    "Petiscos": ["Porções"],
    "Pratos & Executivos": ["Pratos", "Executivos"],
};

// Categories that show alcohol fields
const ALCOHOL_CATEGORIES = ["Cervejas", "Vinhos", "Destilados", "Whiskeys", "Vodkas", "Drinks", "Gins"];
const VOLUME_CATEGORIES = ["Cervejas", "Vinhos", "Destilados", "Whiskeys", "Vodkas", "Gins"];
const FOOD_CATEGORIES = ["Petiscos", "Pratos & Executivos", "Combos", "Pastéis", "Espetinhos", "Sobremesas", "Guarnições"];
const WINE_CATEGORIES = ["Vinhos"];

// --- Edit Modal ---
function EditProductModal({
    item,
    open,
    onClose,
    onSave,
    categoriesList,
    originsList,
}: {
    item: StockItem | null;
    open: boolean;
    onClose: () => void;
    onSave: (data: {
        nome: string;
        descricao: string;
        preco: number;
        estoque: number;
        imagem_url: string;
        var_imagem_url: string;
        var_descricao: string;
        categoria_id: string | null;
        categoria_nova: string | null;
        pais_origem: string | null;
        teor_alcolico: number | null;
        volume_ml: number | null;
        serve_pessoas: number | null;
        tipo_vinho: string | null;
        ml_taca: number | null;
        subcategoria: string | null;
        rating: number | null;
    }) => Promise<void>;
    categoriesList: { label: string; value: string }[];
    originsList: string[];
}) {
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [preco, setPreco] = useState("");
    const [estoque, setEstoque] = useState("");
    const [imagemUrl, setImagemUrl] = useState("");
    const [varImagemUrl, setVarImagemUrl] = useState("");
    const [varDescricao, setVarDescricao] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingVarImage, setUploadingVarImage] = useState(false);
    const [categoriaId, setCategoriaId] = useState("");
    const [categoriaNova, setCategoriaNova] = useState("");
    const [paisOrigem, setPaisOrigem] = useState("");
    const [saving, setSaving] = useState(false);
    const [teorAlcolico, setTeorAlcolico] = useState("");
    const [volumeMl, setVolumeMl] = useState("");
    const [servePessoas, setServePessoas] = useState("");
    const [tipoVinho, setTipoVinho] = useState("");
    const [mlTaca, setMlTaca] = useState("");
    const [subcategoria, setSubcategoria] = useState("");
    const [rating, setRating] = useState(5);

    // Derive selected category name for conditional rendering
    const selectedCatName = useMemo(() => {
        if (categoriaNova) return categoriaNova;
        const found = categoriesList.find(c => c.value === categoriaId);
        return found?.label || "";
    }, [categoriaId, categoriaNova, categoriesList]);

    const showAlcohol = ALCOHOL_CATEGORIES.includes(selectedCatName);
    const showVolume = VOLUME_CATEGORIES.includes(selectedCatName);
    const showFood = FOOD_CATEGORIES.includes(selectedCatName);
    const showWine = WINE_CATEGORIES.includes(selectedCatName);
    const subcatOptions = SUBCATEGORY_MAP[selectedCatName] || [];

    useEffect(() => {
        if (item) {
            setNome(item.produto_nome);
            setDescricao(item.descricao || "");
            setPreco(item.preco.toFixed(2));
            setEstoque(item.estoque === -1 ? "-1" : String(item.estoque));
            setImagemUrl(item.imagem_url || "");
            setVarImagemUrl(item.var_imagem_url || "");
            setVarDescricao(item.var_descricao || "");
            setCategoriaId(item.categoria_id || "");
            setCategoriaNova("");
            setPaisOrigem(item.pais_origem || "");
            setTeorAlcolico(item.teor_alcolico != null ? String(item.teor_alcolico) : "");
            setVolumeMl(item.volume_ml != null ? String(item.volume_ml) : "");
            setServePessoas(item.serve_pessoas != null ? String(item.serve_pessoas) : "");
            setTipoVinho(item.tipo_vinho || "");
            setMlTaca(item.ml_taca != null ? String(item.ml_taca) : "");
            setSubcategoria(item.subcategoria || "");
            setRating(item.rating ?? 5);
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
                var_imagem_url: varImagemUrl,
                var_descricao: varDescricao,
                categoria_id: categoriaId && !categoriaNova ? categoriaId : null,
                categoria_nova: categoriaNova || null,
                pais_origem: paisOrigem || null,
                teor_alcolico: teorAlcolico ? parseFloat(teorAlcolico) : null,
                volume_ml: volumeMl ? parseInt(volumeMl) : null,
                serve_pessoas: servePessoas ? parseInt(servePessoas) : null,
                tipo_vinho: tipoVinho || null,
                ml_taca: mlTaca ? parseInt(mlTaca) : null,
                subcategoria: subcategoria || null,
                rating: rating,
            });
            onClose();
        } catch (err: any) {
            console.error("Erro ao salvar:", err);
            alert("Erro ao salvar: " + (err.message || "Verifique os dados e tente novamente."));
        } finally {
            setSaving(false);
        }
    }

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[480px] bg-card border-border p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold text-foreground">{item?.produto_id ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                </DialogHeader>

                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Product image preview and upload */}
                    <div className="flex justify-center">
                        <Label 
                            htmlFor="image-upload"
                            className={cn(
                                "group w-24 aspect-[5/6] relative rounded-xl overflow-hidden bg-muted border border-border border-dashed cursor-pointer flex items-center justify-center transition-all hover:bg-muted/80 hover:border-foreground/50",
                                uploadingImage && "opacity-50 pointer-events-none"
                            )}
                        >
                            <Input 
                                id="image-upload" 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    try {
                                        setUploadingImage(true);
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        
                                        const res = await uploadImageAction(formData);
                                        if (res?.error) {
                                            alert(res.error);
                                        } else if (res?.url) {
                                            setImagemUrl(res.url);
                                        }
                                    } catch (error) {
                                        console.error("Erro no upload:", error);
                                        alert("Erro ao fazer o upload da imagem.");
                                    } finally {
                                        setUploadingImage(false);
                                        if (e.target) e.target.value = "";
                                    }
                                }}
                            />
                            {imagemUrl ? (
                                <>
                                    <Image
                                        src={imagemUrl}
                                        alt={nome}
                                        fill
                                        unoptimized
                                        className="object-contain p-1"
                                        sizes="96px"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm z-10 transition-all duration-300">
                                        <div className="flex flex-col items-center">
                                            <UploadCloud className="h-6 w-6 mb-1" />
                                            <span className="text-[10px] font-medium leading-none">Trocar</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 text-center">
                                    {uploadingImage ? (
                                        <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                                    ) : (
                                        <>
                                            <Camera className="h-6 w-6 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
                                            <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Upload</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </Label>
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
                        <div className="space-y-1.5 z-50">
                            <Label className="text-xs font-medium text-muted-foreground">Categoria</Label>
                            <SearchableSelect
                                options={categoriesList}
                                value={categoriaNova ? `NEW_CAT_${categoriaNova}` : categoriaId}
                                onChange={(val, isNew) => {
                                    if (isNew) {
                                        setCategoriaNova(val);
                                        setCategoriaId(`NEW_CAT_${val}`);
                                    } else {
                                        setCategoriaNova("");
                                        setCategoriaId(val);
                                    }
                                }}
                                placeholder="Selecione ou crie..."
                                allowCreate={true}
                                createPrefix="Criar categoria"
                            />
                        </div>
                        <div className="space-y-1.5 z-40">
                            <Label className="text-xs font-medium text-muted-foreground">País de Origem</Label>
                            <SearchableSelect
                                options={originsList.map(o => ({ label: o, value: o }))}
                                value={paisOrigem}
                                onChange={(val) => setPaisOrigem(val)}
                                placeholder="Nenhum"
                                allowCreate={true}
                                createPrefix="Adicionar origem"
                            />
                        </div>
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

                    {/* Subcategoria - mostrar se há opções para a categoria selecionada */}
                    {subcatOptions.length > 0 && (
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Tag className="h-3 w-3" />Subcategoria</Label>
                            <SearchableSelect
                                options={subcatOptions.map(s => ({ label: s, value: s }))}
                                value={subcategoria}
                                onChange={(val) => setSubcategoria(val)}
                                placeholder="Selecione a subcategoria..."
                                allowCreate={true}
                                createPrefix="Criar subcategoria"
                            />
                        </div>
                    )}

                    {/* Campos dinâmicos por categoria */}
                    {(showWine || showAlcohol || showVolume || showFood) && (
                        <div className="pt-2 border-t border-border/50">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">Detalhes Específicos</p>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Tipo de Vinho - só para Vinhos */}
                                {showWine && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Wine className="h-3 w-3" />Tipo de Vinho</Label>
                                        <SearchableSelect
                                            options={[
                                                { label: "Tinto", value: "tinto" },
                                                { label: "Branco", value: "branco" },
                                                { label: "Rosé", value: "rose" },
                                            ]}
                                            value={tipoVinho}
                                            onChange={(val) => setTipoVinho(val)}
                                            placeholder="Tipo..."
                                        />
                                    </div>
                                )}

                                {/* ml por Taça - só para Vinhos */}
                                {showWine && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Beaker className="h-3 w-3" />ml por Taça</Label>
                                        <Input
                                            type="number"
                                            value={mlTaca}
                                            onChange={(e) => setMlTaca(e.target.value)}
                                            className="bg-background border-border h-9 text-sm font-mono"
                                            placeholder="200"
                                        />
                                    </div>
                                )}

                                {/* Teor Alcoólico */}
                                {showAlcohol && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Percent className="h-3 w-3" />Teor Alcoólico (%)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={teorAlcolico}
                                            onChange={(e) => setTeorAlcolico(e.target.value)}
                                            className="bg-background border-border h-9 text-sm font-mono"
                                            placeholder="5.0"
                                        />
                                    </div>
                                )}

                                {/* Volume (ml) */}
                                {showVolume && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Droplets className="h-3 w-3" />Volume (ml)</Label>
                                        <Input
                                            type="number"
                                            value={volumeMl}
                                            onChange={(e) => setVolumeMl(e.target.value)}
                                            className="bg-background border-border h-9 text-sm font-mono"
                                            placeholder="750"
                                        />
                                    </div>
                                )}

                                {/* Serve Pessoas - Comidas */}
                                {showFood && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3" />Serve (pessoas)</Label>
                                        <Input
                                            type="number"
                                            value={servePessoas}
                                            onChange={(e) => setServePessoas(e.target.value)}
                                            className="bg-background border-border h-9 text-sm font-mono"
                                            placeholder="2"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Star Rating - todos os produtos */}
                    <div className="pt-2 border-t border-border/50">
                        <StarRating value={rating} onChange={setRating} />
                    </div>

                    {/* Variação upload específico */}
                    <div className="pt-4 border-t border-border/50 pb-2">
                        <p className="text-[10.5px] font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2"><Tag className="h-3.5 w-3.5"/> Dados Específicos Desta Variação</p>
                        
                        <div className="flex gap-4">
                            <Label 
                                htmlFor="var-image-upload"
                                className={cn(
                                    "group w-24 shrink-0 aspect-[5/6] relative rounded-xl overflow-hidden bg-muted border border-border border-dashed cursor-pointer flex items-center justify-center transition-all hover:bg-muted/80 hover:border-foreground/50",
                                    uploadingVarImage && "opacity-50 pointer-events-none"
                                )}
                            >
                                <Input 
                                    id="var-image-upload" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            setUploadingVarImage(true);
                                            const formData = new FormData();
                                            formData.append("file", file);
                                            const res = await uploadImageAction(formData);
                                            if (res?.error) alert(res.error);
                                            else if (res?.url) setVarImagemUrl(res.url);
                                        } catch (error) {
                                            console.error("Erro no upload da variação:", error);
                                            alert("Erro ao fazer o upload da imagem da variação.");
                                        } finally {
                                            setUploadingVarImage(false);
                                            if (e.target) e.target.value = "";
                                        }
                                    }}
                                />
                                {varImagemUrl ? (
                                    <>
                                        <Image src={varImagemUrl} alt="Var Img" fill unoptimized className="object-contain p-1 bg-white dark:bg-black/50" sizes="96px" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-sm z-10 transition-all duration-300">
                                            <div className="flex flex-col items-center">
                                                <UploadCloud className="h-6 w-6 mb-1" />
                                                <span className="text-[10px] font-medium leading-none">Trocar</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 text-center">
                                        {uploadingVarImage ? <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" /> : <>
                                            <Camera className="h-6 w-6 text-emerald-500/60 group-hover:text-emerald-500 transition-colors" />
                                            <span className="text-[9px] font-medium text-muted-foreground group-hover:text-foreground leading-tight">Foto da<br/>Variação</span>
                                        </>}
                                    </div>
                                )}
                            </Label>

                            <div className="flex-1 space-y-1.5 pt-1">
                                <Label className="text-xs font-medium text-muted-foreground">Descrição Exclusiva da Variação (Opcional)</Label>
                                <Textarea
                                    value={varDescricao}
                                    onChange={(e) => setVarDescricao(e.target.value)}
                                    className="bg-background border-border text-sm min-h-[82px] resize-none"
                                    placeholder="Ao preencher, o app exibirá esse texto no lugar da descrição geral quando essa variação for selecionada."
                                />
                            </div>
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
    const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [allCategories, setAllCategories] = useState<{ label: string, value: string }[]>([]);
    const supabase = createClient();

    const fetchStock = useCallback(async () => {
        const { data: catData } = await supabase.from("categorias").select("id, nome").order("nome");
        if (catData) setAllCategories(catData.map(c => ({ label: c.nome, value: c.id })));
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
                imagem_url,
                descricao,
                produtos!inner (
                    id,
                    nome,
                    imagem_url,
                    disponivel,
                    tipo_vinho,
                    pais_origem,
                    descricao,
                    categoria_id,
                    teor_alcolico,
                    volume_ml,
                    serve_pessoas,
                    ml_taca,
                    subcategoria,
                    rating,
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
            if (v.imagem_url && v.imagem_url.trim() !== '') {
                finalImageUrl = v.imagem_url;
            } else if (v.nome === "Taça" && v.produtos.tipo_vinho && wineGlassMap.has(v.produtos.tipo_vinho)) {
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
                var_imagem_url: v.imagem_url,
                var_descricao: v.descricao,
                disponivel: v.produtos.disponivel,
                categoria_id: v.produtos.categoria_id,
                categoria_nome: v.produtos.categorias?.nome || "Sem Categoria",
                tipo_vinho: v.produtos.tipo_vinho,
                pais_origem: v.produtos.pais_origem,
                descricao: v.produtos.descricao,
                teor_alcolico: v.produtos.teor_alcolico,
                volume_ml: v.produtos.volume_ml,
                serve_pessoas: v.produtos.serve_pessoas,
                ml_taca: v.produtos.ml_taca,
                subcategoria: v.produtos.subcategoria,
                rating: v.produtos.rating,
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

    const allOrigins = useMemo(() => {
        const origs = new Set(Object.keys(COUNTRY_FLAGS));
        items.forEach(i => { if (i.pais_origem) origs.add(i.pais_origem); });
        return Array.from(origs).sort();
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

    // Save edit or create
    async function handleSaveEdit(data: {
        nome: string;
        descricao: string;
        preco: number;
        estoque: number;
        imagem_url: string;
        var_imagem_url: string;
        var_descricao: string;
        categoria_id: string | null;
        categoria_nova: string | null;
        pais_origem: string | null;
        teor_alcolico: number | null;
        volume_ml: number | null;
        serve_pessoas: number | null;
        tipo_vinho: string | null;
        ml_taca: number | null;
        subcategoria: string | null;
        rating: number | null;
    }) {
        if (!editingItem) return;

        let isCreating = !editingItem.produto_id;

        const res = await saveProductAction(data, isCreating, editingItem);
        
        if (res.error) {
            throw new Error(res.error);
        }

        await fetchStock();
    }

    async function handleDelete() {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const res = await deleteProductAction(itemToDelete.produto_id);
            if (res.error) {
                alert(res.error);
            } else {
                setItemToDelete(null);
                await fetchStock();
            }
        } catch (err: any) {
            console.error("Erro ao excluir produto:", err);
            alert("Erro ao excluir: " + (err.message || "Tente novamente."));
        } finally {
            setIsDeleting(false);
        }
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
                <div className="flex items-center gap-3">
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
                    <Button 
                        onClick={() => setEditingItem(NEW_PRODUCT_TEMPLATE)}
                        className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <Plus className="h-4 w-4" />
                        Novo Produto
                    </Button>
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
                            <TableHead className="text-muted-foreground text-[11px] font-semibold uppercase">Variação</TableHead>
                            <TableHead className="text-muted-foreground text-[11px] font-semibold uppercase">Categoria</TableHead>
                            <TableHead className="text-muted-foreground text-[11px] font-semibold uppercase">Origem</TableHead>
                            <TableHead className="text-muted-foreground text-[11px] font-semibold uppercase">Estoque</TableHead>
                            <TableHead className="text-muted-foreground text-[11px] font-semibold uppercase">Status</TableHead>
                            <TableHead className="text-muted-foreground text-[11px] font-semibold uppercase">App</TableHead>
                            <TableHead className="text-muted-foreground text-[11px] font-semibold uppercase">Preço</TableHead>
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
                                const flagUrl = item.pais_origem ? COUNTRY_FLAGS[item.pais_origem as keyof typeof COUNTRY_FLAGS] : null;

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
                                                    <div className="w-10 aspect-[5/6] relative rounded-md overflow-hidden bg-muted/50 border cursor-pointer group">
                                                        {item.imagem_url ? (
                                                            <>
                                                                <Image
                                                                    src={item.imagem_url}
                                                                    alt={item.produto_nome}
                                                                    fill
                                                                    priority={idx < 10}
                                                                    unoptimized={true}
                                                                    className={cn(
                                                                        "object-contain transition-all p-0.5",
                                                                        !item.disponivel && "blur-[2px] opacity-40 grayscale-[0.8]"
                                                                    )}
                                                                    sizes="40px"
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
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] font-medium bg-muted border text-muted-foreground rounded-md px-2 py-0.5">
                                                {item.categoria_nome}
                                            </Badge>
                                        </TableCell>

                                        {/* Origin with flag */}
                                        <TableCell>
                                            {item.pais_origem ? (
                                                <div className="flex items-center gap-1.5">
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

                                        <TableCell className="font-mono text-sm text-muted-foreground">
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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                                    onClick={() => setItemToDelete(item)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
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
                categoriesList={allCategories}
                originsList={allOrigins}
            />

            {/* Delete Confirmation Modal */}
            <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && !isDeleting && setItemToDelete(null)}>
                <DialogContent className="sm:max-w-[400px] bg-card border-border p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-foreground">Excluir Produto</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 text-sm text-muted-foreground">
                        Tem certeza que deseja excluir permanentemente o produto <strong className="text-foreground">{itemToDelete?.produto_nome}</strong>?
                        Essa ação não poderá ser desfeita.
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setItemToDelete(null)}
                            disabled={isDeleting}
                            className="text-sm h-9"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600 text-white text-sm h-9 px-4"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            {isDeleting ? "Excluindo..." : "Excluir"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
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
