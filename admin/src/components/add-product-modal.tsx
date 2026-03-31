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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, PackagePlus, Plus, Minus, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comanda: any; // The currently selected comanda
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
  onAdd,
}: AddProductModalProps) {
  const [loadingDb, setLoadingDb] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // DB Data
  const [produtos, setProdutos] = useState<any[]>([]);
  const [variacoes, setVariacoes] = useState<any[]>([]);

  // Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedVariacaoId, setSelectedVariacaoId] = useState<string>("");
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");
  const [nomePessoa, setNomePessoa] = useState("Balcão");

  // Load Data on Mount
  useEffect(() => {
    if (open && produtos.length === 0) {
      loadCatalog();
    }
    if (open) {
      resetForm();
    }
  }, [open]);

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
    setNomePessoa("Balcão");
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
    const names = comanda.pessoas.map((p: any) => p.nome);
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
        quantidade,
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
    const variacao = variacoes.find((v) => v.id === selectedVariacaoId);
    if (variacao) return variacao.preco * quantidade;
    // If no variation chosen yet but 1 exists, use it
    if (productVariations.length === 1) return productVariations[0].preco * quantidade;
    return 0;
  }, [selectedProduct, selectedVariacaoId, variacoes, quantidade, productVariations]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 flex flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <PackagePlus className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">Lançar Produto</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Mesa {comanda?.numero_mesa ? String(comanda?.numero_mesa).padStart(2, "0") : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-3 flex-1 overflow-y-auto space-y-5">
          {loadingDb ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !selectedProduct ? (
            // SEARCH STATE
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-11 bg-muted/40 border-muted-foreground/20 focus-visible:ring-emerald-500"
                  placeholder="Pesquise o nome do produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {searchQuery.trim().length > 0 && (
                <div className="bg-muted/20 border border-border rounded-lg overflow-hidden flex flex-col max-h-[250px]">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhum produto encontrado.
                    </div>
                  ) : (
                    <ScrollArea className="flex-1">
                      <div className="divide-y divide-border">
                        {filteredProducts.map((p) => (
                          <div
                            key={p.id}
                            className="p-3 hover:bg-muted/50 cursor-pointer flex items-center justify-between transition-colors"
                            onClick={() => handleSelectProduct(p)}
                          >
                            <span className="text-sm font-medium">{p.nome}</span>
                            <Plus className="h-4 w-4 text-muted-foreground opacity-50" />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>
          ) : (
            // PRODUCT DETAILS STATE
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Product Header */}
              <div className="p-4 bg-muted/30 rounded-xl border border-border flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                    Produto Selecionado
                  </span>
                  <span className="font-bold text-base">{selectedProduct.nome}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs px-2 h-7"
                  onClick={() => setSelectedProduct(null)}
                >
                  Trocar
                </Button>
              </div>

              {/* Variations */}
              {productVariations.length > 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Variação/Tamanho
                  </label>
                  <select
                    className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedVariacaoId}
                    onChange={(e) => setSelectedVariacaoId(e.target.value)}
                  >
                    <option value="" disabled>Selecione...</option>
                    {productVariations.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nome} — R$ {v.preco.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Quantity */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quantidade
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantidade}
                      onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-10 text-center font-bold"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={() => setQuantidade(quantidade + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Cliente / Comanda */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Membro da Mesa
                  </label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-70" />
                    <Input
                      list="pessoas-mesa"
                      value={nomePessoa}
                      onChange={(e) => setNomePessoa(e.target.value)}
                      className="pl-8 h-10 font-medium"
                      placeholder="Nome do Cliente"
                    />
                    <datalist id="pessoas-mesa">
                      {pessoasUnicas.map((nome: string) => (
                        <option key={nome} value={nome} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Observação */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Observação (Opcional)
                </label>
                <Input
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Sem gelo, limão à parte..."
                  className="h-10"
                />
              </div>

              {/* Total Preview */}
              <div className="p-3 bg-emerald-500/10 rounded-xl flex items-center justify-between border border-emerald-500/20">
                <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">Total a Lançar:</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
                  R$ {totalCalculated.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-4 border-t bg-muted/40 gap-2 sm:space-x-0">
          <Button variant="outline" className="h-10 font-semibold" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            disabled={!selectedProduct || (productVariations.length > 1 && !selectedVariacaoId) || submitting}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PackagePlus className="h-4 w-4 mr-2" />}
            Confirmar Lançamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
