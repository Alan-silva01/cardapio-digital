"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Plus, Minus, UserCircle, ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Separator } from "@/components/ui/separator";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comanda: any; // The currently selected comanda
  defaultPessoa?: string; // Optional default person selection
  onAdd: (
    produtoId: string,
    variacaoId: string | null,
    quantidade: number,
    observacao: string,
    nomePessoa: string
  ) => Promise<void>;
}

export function AddProductModal({
  open,
  onOpenChange,
  comanda,
  defaultPessoa,
  onAdd,
}: AddProductModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const [loadingDb, setLoadingDb] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // DB Data
  const [produtos, setProdutos] = useState<any[]>([]);
  const [variacoes, setVariacoes] = useState<any[]>([]);

  // Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedVariacaoId, setSelectedVariacaoId] = useState<string>("");
  const [quantidade, setQuantidade] = useState<number | "">(1);
  const [observacao, setObservacao] = useState("");
  const [nomePessoa, setNomePessoa] = useState(defaultPessoa || "Balcão");

  // Load Data on Mount
  useEffect(() => {
    if (open && produtos.length === 0) {
      loadCatalog();
    }
    if (open) {
      resetForm();
    }
  }, [open, defaultPessoa]);

  const loadCatalog = async () => {
    setLoadingDb(true);
    const { data: prods } = await supabase
      .from("produtos")
      .select("id, nome, disponivel, imagem_url")
      .eq("disponivel", true)
      .order("nome");

    const { data: vars } = await supabase
      .from("variacoes_produto")
      .select("id, produto_id, nome, preco, estoque, ordem")
      .eq("ativo", true)
      .order("ordem");

    if (prods) setProdutos(prods);
    if (vars) setVariacoes(vars);
    setLoadingDb(false);
  };

  const resetForm = () => {
    setSearchQuery("");
    setSelectedProduct(null);
    setSelectedVariacaoId("");
    setQuantidade(1);
    setObservacao("");
    setNomePessoa(defaultPessoa || "Balcão");
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return produtos.filter((p) => p.nome.toLowerCase().includes(query));
  }, [searchQuery, produtos]);

  const productVariations = useMemo(() => {
    if (!selectedProduct) return [];
    return variacoes.filter((v) => v.produto_id === selectedProduct.id);
  }, [selectedProduct, variacoes]);

  // Auto-select first variation if only one exists
  useEffect(() => {
    if (productVariations.length === 1 && !selectedVariacaoId) {
      setSelectedVariacaoId(productVariations[0].id);
    } else if (productVariations.length > 1 && !selectedVariacaoId) {
       // do nothing
    }
  }, [productVariations, selectedVariacaoId]);

  const handleSelectProduct = (prod: any) => {
    setSelectedProduct(prod);
    setSearchQuery("");
    setSelectedVariacaoId("");
    setQuantidade(1);
  };

  const pessoasUnicas = useMemo(() => {
    if (!comanda || !comanda.pessoas) return ["Balcão"];
    // Exclude 'Couvert' — it's an internal entry, not a selectable person
    const names = comanda.pessoas
      .map((p: any) => p.nome)
      .filter((nome: string) => nome.toLowerCase() !== "couvert");
    if (!names.includes("Balcão")) names.push("Balcão");
    return names;
  }, [comanda]);

  const handleSubmit = async () => {
    if (!selectedProduct) return;
    if (productVariations.length > 0 && !selectedVariacaoId) {
      alert("Selecione uma variação obrigatória.");
      return;
    }

    setSubmitting(true);
    try {
      await onAdd(
        selectedProduct.id,
        selectedVariacaoId || null,
        Number(quantidade) || 1,
        observacao,
        nomePessoa
      );
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao lançar produto.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalCalculated = useMemo(() => {
    if (!selectedProduct) return 0;
    const qtdFinal = Number(quantidade) || 0;
    const variacao = variacoes.find((v) => v.id === selectedVariacaoId);
    if (variacao) return variacao.preco * qtdFinal;
    // If no variation chosen yet but 1 exists, use it
    if (productVariations.length === 1) return productVariations[0].preco * qtdFinal;
    return 0;
  }, [selectedProduct, selectedVariacaoId, variacoes, quantidade, productVariations]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 flex flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader className="pt-6 pb-4 px-6 relative flex flex-row items-start justify-between">
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-xl font-bold tracking-tight">
              Adicionar Produto
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest font-medium opacity-60">
              Mesa {comanda?.numero_mesa ? String(comanda?.numero_mesa).padStart(2, "0") : ""}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Separator />

        <div className="px-6 py-4 flex-1 overflow-y-auto w-full">
          {loadingDb ? (
            <div className="flex flex-col justify-center items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground animate-pulse">Carregando cardápio...</span>
            </div>
          ) : !selectedProduct ? (
            // SEARCH STATE
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-brand/30 transition-all text-base"
                  placeholder="Pesquise o nome do produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {searchQuery.trim().length > 0 && (
                <div className="bg-card border border-border shadow-xs rounded-xl overflow-hidden flex flex-col max-h-[300px]">
                  {filteredProducts.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground font-medium">
                      Nenhum produto encontrado.
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto min-h-0">
                      <div className="divide-y divide-border/50">
                        {filteredProducts.map((p) => (
                          <div
                            key={p.id}
                            className="p-3.5 hover:bg-muted/40 cursor-pointer flex items-center justify-between transition-colors group"
                            onClick={() => handleSelectProduct(p)}
                          >
                            <span className="text-sm font-bold group-hover:text-brand transition-colors whitespace-nowrap overflow-hidden text-ellipsis mr-2">
                              {p.nome}
                            </span>

                            <div className="flex items-center gap-3 shrink-0">
                              {p.imagem_url && (
                                <HoverCard>
                                  <HoverCardTrigger 
                                    className="p-1.5 -m-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50 focus:outline-hidden cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ImageIcon className="h-4 w-4" />
                                  </HoverCardTrigger>
                                  <HoverCardContent side="top" className="w-auto p-1.5 border-border/50 bg-background/95 backdrop-blur-xs z-50">
                                    <div className="rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
                                      <img 
                                        src={p.imagem_url} 
                                        alt={p.nome}
                                        className="w-[160px] h-[192px] object-cover rounded-md block pointer-events-none"
                                        loading="lazy"
                                      />
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              )}
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center group-hover:bg-brand/10 transition-colors shrink-0">
                                <Plus className="h-3 w-3 text-muted-foreground group-hover:text-brand" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // PRODUCT DETAILS STATE
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200 w-full mb-2">
              {/* Product Header */}
              <div className="p-4 bg-muted/40 rounded-xl border border-border flex justify-between items-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    Produto Selecionado
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base leading-tight">{selectedProduct.nome}</span>
                    {selectedProduct.imagem_url && (
                      <HoverCard>
                        <HoverCardTrigger className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50 focus:outline-hidden cursor-pointer">
                          <ImageIcon className="h-3.5 w-3.5" />
                        </HoverCardTrigger>
                        <HoverCardContent side="top" className="w-auto p-1.5 border-border/50 bg-background/95 backdrop-blur-xs z-50">
                          <div className="rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
                            <img 
                              src={selectedProduct.imagem_url} 
                              alt={selectedProduct.nome}
                              className="w-[160px] h-[192px] object-cover rounded-md block pointer-events-none"
                              loading="lazy"
                            />
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 font-semibold shrink-0"
                  onClick={() => setSelectedProduct(null)}
                >
                  Trocar
                </Button>
              </div>

              {/* Variations - Pill Group */}
              {productVariations.length > 1 && (
                <div className="space-y-2.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    Variação/Tamanho <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {productVariations.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariacaoId(v.id)}
                        className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${
                          selectedVariacaoId === v.id
                            ? "bg-brand/10 border-brand text-brand ring-1 ring-brand/20 shadow-xs"
                            : "bg-background border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {v.nome} <span className="opacity-60 font-normal ml-1">R$ {v.preco.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="opacity-50" />

              <div className="grid grid-cols-2 gap-5">
                {/* Cliente / Comanda - Pill Group + Input */}
                <div className="space-y-3 col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Adicionar para (Membro da Mesa)
                  </label>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pessoasUnicas.map((nome: string) => (
                      <button
                        key={nome}
                        type="button"
                        onClick={() => setNomePessoa(nome)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                          nomePessoa === nome
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <UserCircle className="h-3.5 w-3.5" />
                        {nome}
                      </button>
                    ))}
                  </div>

                  <Input
                    value={nomePessoa}
                    onChange={(e) => setNomePessoa(e.target.value)}
                    className="h-10 font-medium bg-muted/20"
                    placeholder="Ou digite um novo nome..."
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Quantidade
                  </label>
                  <div className="flex items-center gap-1 w-full max-w-[140px]">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-r-none border-r-0"
                      onClick={() => setQuantidade(Math.max(1, (Number(quantidade) || 1) - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantidade}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setQuantidade("");
                        } else {
                          setQuantidade(Math.max(1, parseInt(val) || 1));
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      className="h-10 text-center font-bold font-mono text-base rounded-none border-x-0 bg-muted/10 focus-visible:ring-0"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-l-none border-l-0"
                      onClick={() => setQuantidade((Number(quantidade) || 0) + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Total Preview */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Valor a Lançar
                  </label>
                  <div className="h-10 px-3 bg-muted/40 rounded-md border border-border flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">Total:</span>
                    <span className="text-base font-bold text-foreground">
                      R$ {totalCalculated.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="opacity-50" />

              {/* Observação */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Observação do Pedido <span className="opacity-50 normal-case font-medium">(Opcional)</span>
                </label>
                <Input
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Copo com gelo, sem limão..."
                  className="h-10 bg-muted/20"
                />
              </div>

            </div>
          )}
        </div>

        <Separator />

        <DialogFooter className="px-6 py-5 bg-muted/10 flex-row justify-end gap-3">
          <Button variant="outline" className="h-10 font-bold" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="h-10 bg-brand hover:bg-brand/90 text-white font-bold px-6 shadow-xs"
            disabled={!selectedProduct || (productVariations.length > 1 && !selectedVariacaoId) || submitting}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {!submitting && "Adicionar à Mesa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
