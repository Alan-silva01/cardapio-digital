"use client";

import { useState, useEffect, useRef } from "react";
import { Megaphone, Mic2, Ticket, Upload, Save, Loader2, Image as ImageIcon, Plus, Trash, Trash2, Search, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadImageAction } from "@/app/actions/upload-image";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PromocoesPage() {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [uploading, setUploading] = useState(false);

  const [config, setConfig] = useState({
    promocao_ativa: false,
    promocoes: [] as any[], // New array to hold multiple promos
    promocao_imagem_url: "", // Keeping for backward compatibility or simple migration
    promocao_titulo: "",
    promocao_preco: "",
    promocao_produto_id: "",
    promocao_rodape: "",
    promocao_inicio: "",
    promocao_fim: "",
    cantor_ativo: false,
    cantor_nome: "",
    cantor_inicio: "",
    cantor_fim: "",
    couvert_ativo: false,
    couvert_valor: 10.0,
  });

  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  const [produtos, setProdutos] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase
        .from("configuracoes")
        .select("*")
        .limit(1)
        .single();

      if (data) {
        const pad = (n: number) => n.toString().padStart(2, '0');
        const localString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        const getDefaults = () => {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0);
          const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 5, 0, 0);
          return { inicio: localString(start), fim: localString(end) };
        };

        const nowMs = Date.now();

        // Migrate old single promo into array if array is empty
        let loadedPromocoes = Array.isArray(data.promocoes) ? data.promocoes.map((p: any) => {
          const def = getDefaults();
          const fimDate = p.fim ? new Date(p.fim) : null;
          if (fimDate && fimDate.getTime() < nowMs) {
            return {
              imagem_url: "",
              titulo: "",
              preco: "",
              produto_id: "",
              rodape: "",
              inicio: def.inicio,
              fim: def.fim,
            };
          }
          return {
            ...p,
            inicio: p.inicio ? formatToLocal(p.inicio) : def.inicio,
            fim: p.fim ? formatToLocal(p.fim) : def.fim,
          };
        }) : [];
        
        let singlePromoExpired = false;
        if (loadedPromocoes.length === 0 && (data.promocao_imagem_url || data.promocao_titulo)) {
          const def = getDefaults();
          const fimDate = data.promocao_fim ? new Date(data.promocao_fim) : null;
          if (fimDate && fimDate.getTime() < nowMs) {
             singlePromoExpired = true;
             loadedPromocoes = [{
               imagem_url: "",
               titulo: "",
               preco: "",
               produto_id: "",
               rodape: "",
               inicio: def.inicio,
               fim: def.fim,
             }];
          } else {
            loadedPromocoes = [{
              imagem_url: data.promocao_imagem_url || "",
              titulo: data.promocao_titulo || "",
              preco: data.promocao_preco ? String(data.promocao_preco) : "",
              produto_id: data.promocao_produto_id || "",
              rodape: data.promocao_rodape || "",
              inicio: data.promocao_inicio ? formatToLocal(data.promocao_inicio) : def.inicio,
              fim: data.promocao_fim ? formatToLocal(data.promocao_fim) : def.fim,
            }];
          }
        } else if (loadedPromocoes.length === 0) {
          const def = getDefaults();
          // Initialize with one empty promo setting defaults: today 13:00 to tomorrow 05:00
          loadedPromocoes = [{
            imagem_url: "",
            titulo: "",
            preco: "",
            produto_id: "",
            rodape: "",
            inicio: def.inicio,
            fim: def.fim,
          }];
        }

        let finalCantorAtivo = data.cantor_ativo || false;
        let finalCantorNome = data.cantor_nome || "";
        let finalCantorInicio = data.cantor_inicio ? formatToLocal(data.cantor_inicio) : "";
        let finalCantorFim = data.cantor_fim ? formatToLocal(data.cantor_fim) : "";

        if (data.cantor_fim && new Date(data.cantor_fim).getTime() < nowMs) {
          finalCantorAtivo = false;
          finalCantorNome = "";
          const def = getDefaults();
          finalCantorInicio = def.inicio;
          finalCantorFim = def.fim;
        }

        setConfig({
          promocao_ativa: data.promocao_ativa || false,
          promocoes: loadedPromocoes,
          promocao_imagem_url: singlePromoExpired ? "" : (data.promocao_imagem_url || ""),
          promocao_titulo: singlePromoExpired ? "" : (data.promocao_titulo || ""),
          promocao_preco: singlePromoExpired ? "" : (data.promocao_preco ? String(data.promocao_preco) : ""),
          promocao_produto_id: singlePromoExpired ? "" : (data.promocao_produto_id || ""),
          promocao_rodape: singlePromoExpired ? "" : (data.promocao_rodape || ""),
          promocao_inicio: singlePromoExpired ? "" : (data.promocao_inicio ? formatToLocal(data.promocao_inicio) : ""),
          promocao_fim: singlePromoExpired ? "" : (data.promocao_fim ? formatToLocal(data.promocao_fim) : ""),
          cantor_ativo: finalCantorAtivo,
          cantor_nome: finalCantorNome,
          cantor_inicio: finalCantorInicio,
          cantor_fim: finalCantorFim,
          couvert_ativo: data.couvert_ativo || false,
          couvert_valor: data.valor_couvert || 10.0,
        });
      }

      const { data: prods } = await supabase
        .from("produtos")
        .select("id, nome, subcategoria, imagem_url, categorias(nome)")
        .order("nome");
      if (prods) setProdutos(prods);

      setLoading(false);
    }
    fetchConfig();
  }, []);

  // Auto-save silently after every config change (debounced 1.5s)
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    
    setSaveStatus('saving');
    
    const timer = setTimeout(async () => {
      const payload = {
        id: "global",
        promocao_ativa: config.promocao_ativa,
        promocoes: config.promocoes.map((p: any) => ({
          ...p,
          preco: p.preco ? parseFloat(p.preco.toString().replace(',', '.')) : null,
          inicio: p.inicio ? new Date(p.inicio).toISOString() : null,
          fim: p.fim ? new Date(p.fim).toISOString() : null,
        })),
        promocao_imagem_url: config.promocao_imagem_url,
        promocao_titulo: config.promocao_titulo,
        promocao_preco: config.promocao_preco ? parseFloat(config.promocao_preco.replace(',', '.')) : null,
        promocao_produto_id: config.promocao_produto_id || null,
        promocao_rodape: config.promocao_rodape || null,
        promocao_inicio: config.promocao_inicio ? new Date(config.promocao_inicio).toISOString() : null,
        promocao_fim: config.promocao_fim ? new Date(config.promocao_fim).toISOString() : null,
        cantor_ativo: config.cantor_ativo,
        cantor_nome: config.cantor_nome,
        cantor_inicio: config.cantor_inicio ? new Date(config.cantor_inicio).toISOString() : null,
        cantor_fim: config.cantor_fim ? new Date(config.cantor_fim).toISOString() : null,
        couvert_ativo: config.couvert_ativo,
        valor_couvert: config.couvert_valor,
      };
      const { error } = await supabase.from("configuracoes").upsert(payload, { onConflict: "id" });
      if (!error) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        toast.error("Erro ao salvar automaticamente.");
        setSaveStatus('idle');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [config]);

  const parsedAtracoes = (() => {
    if (!config.cantor_nome) return [""];
    try {
      const parsed = JSON.parse(config.cantor_nome);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      return [config.cantor_nome];
    } catch {
      return [config.cantor_nome];
    }
  })();

  const updateAtracao = (index: number, value: string) => {
    const newAtracoes = [...parsedAtracoes];
    newAtracoes[index] = value;
    setConfig({...config, cantor_nome: JSON.stringify(newAtracoes)});
  };

  const addAtracao = () => {
    setConfig({...config, cantor_nome: JSON.stringify([...parsedAtracoes, ""])});
  };

  const removeAtracao = (index: number) => {
    const newAtracoes = parsedAtracoes.filter((_, i) => i !== index);
    if (newAtracoes.length === 0) newAtracoes.push(""); // Keep at least one
    setConfig({...config, cantor_nome: JSON.stringify(newAtracoes)});
  };

  function formatToLocal(isoString: string) {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await uploadImageAction(formData);
      if (res.url) {
        updateCurrentPromo("imagem_url", res.url!);
        toast.success("Imagem da promoção anexada!");
      } else {
        toast.error("Erro ao fazer upload da imagem.");
      }
    } catch {
      toast.error("Erro desconhecido no upload.");
    } finally {
      setUploading(false);
    }
  }

  function updateCurrentPromo(field: string, value: any) {
    if (!config.promocoes || config.promocoes.length === 0) return;
    const newPromos = [...config.promocoes];
    newPromos[currentPromoIndex] = { ...newPromos[currentPromoIndex], [field]: value };
    setConfig({ ...config, promocoes: newPromos });
  }

  function addPromo() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 5, 0, 0);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const localString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    const newPromo = {
      imagem_url: "",
      titulo: "",
      preco: "",
      produto_id: "",
      rodape: "",
      inicio: localString(start),
      fim: localString(end),
    };
    setConfig({ ...config, promocoes: [...config.promocoes, newPromo] });
    setCurrentPromoIndex(config.promocoes.length);
  }

  function removePromo() {
    if (config.promocoes.length <= 1) {
      toast.error("Você precisa ter pelo menos 1 promoção.");
      return;
    }
    const newPromos = config.promocoes.filter((_, i) => i !== currentPromoIndex);
    setConfig({ ...config, promocoes: newPromos });
    setCurrentPromoIndex(Math.max(0, currentPromoIndex - 1));
  }



  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full space-y-8 p-8 max-w-4xl mx-auto mt-4 pb-24 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Destaques</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Gerencie promoções do dia, line-up de artistas e cobrança de couvert artístico.</p>
        </div>
        <div className="h-9 flex items-center px-3 gap-2">
          {saveStatus === 'saving' && (
            <span className="flex items-center text-xs text-muted-foreground font-medium animate-pulse">
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Salvando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center text-xs text-emerald-600 font-medium">
              <Check className="h-4 w-4 mr-1.5" /> Alterações salvas
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6">

        {/* Promotion Section */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase border-b pb-2 flex items-center gap-2">
            <Megaphone className="h-3.5 w-3.5" /> Promoção do Dia (Modal na Entrada)
          </h2>

          <div className="p-5 border rounded-xl bg-card shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Habilitar Modal de Promoção</p>
                <p className="text-[13px] text-muted-foreground font-medium">Exibe uma imagem em destaque (modal pop-up) quando o cliente abre o cardápio.</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, promocao_ativa: !config.promocao_ativa })}
                className={`relative inline-flex h-4 w-7 cursor-pointer items-center rounded-full transition-colors focus:outline-hidden ${config.promocao_ativa ? 'bg-emerald-500/80' : 'bg-muted-foreground/30'}`}
                role="switch"
                aria-checked={config.promocao_ativa}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config.promocao_ativa ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {config.promocao_ativa && config.promocoes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between mb-4 bg-muted/30 p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPromoIndex(Math.max(0, currentPromoIndex - 1))}
                      disabled={currentPromoIndex === 0}
                      className="h-8 w-8 p-0"
                    >
                      &larr;
                    </Button>
                    <span className="text-xs font-semibold w-24 text-center">
                      Promo {currentPromoIndex + 1} de {config.promocoes.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPromoIndex(Math.min(config.promocoes.length - 1, currentPromoIndex + 1))}
                      disabled={currentPromoIndex === config.promocoes.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      &rarr;
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={removePromo} className="h-8 px-3 rounded-md border-border bg-white hover:bg-muted text-[13px] font-medium text-foreground shadow-xs flex items-center gap-1.5 transition-colors">
                      <Trash strokeWidth={1.8} className="h-4 w-4 text-muted-foreground" /> Remover
                    </Button>
                    <Button variant="outline" size="sm" onClick={addPromo} className="h-8 px-3 rounded-md border-border bg-white hover:bg-muted text-[13px] font-medium text-foreground shadow-xs flex items-center gap-1.5 transition-colors">
                      <Plus strokeWidth={2} className="h-4 w-4 text-muted-foreground" /> Nova Promo
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Esquerda: Preview da Imagem */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-40 h-52 shrink-0 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-white flex items-center justify-center overflow-hidden relative shadow-sm">
                      {config.promocoes[currentPromoIndex]?.imagem_url ? (
                         <img src={config.promocoes[currentPromoIndex].imagem_url} alt="Promo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <ImageIcon className="h-8 w-8 opacity-40" />
                          <span className="text-[11px] uppercase font-bold tracking-wider opacity-50">Sem Imagem</span>
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-brand" />
                        </div>
                      )}
                    </div>
                    {/* Botão de upload opcional */}
                    <label className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border rounded-md cursor-pointer hover:bg-muted text-xs font-medium transition-colors mt-2">
                      <Upload className="h-3.5 w-3.5" /> Enviar Outra Imagem
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  </div>

                  {/* Direita: Controles da Promoção */}
                  <div className="space-y-4">
                    <div className="space-y-1.5" ref={searchRef}>
                      <label className="text-[12px] font-semibold text-foreground">Buscar Produto em Promoção</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowDropdown(true);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          placeholder="Digite o nome do produto... ex: Corona, Brahma"
                          className="h-9 pl-9 pr-8"
                        />
                        {productSearch && (
                          <button
                            onClick={() => { setProductSearch(""); setShowDropdown(false); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown de Resultados */}
                      {showDropdown && productSearch.trim().length > 0 && (() => {
                        const q = productSearch.trim().toLowerCase();
                        const filtered = produtos.filter(p =>
                          (p.nome || '').toLowerCase().includes(q) ||
                          (p.subcategoria || '').toLowerCase().includes(q) ||
                          (p.categorias?.nome || '').toLowerCase().includes(q)
                        );
                        return filtered.length > 0 ? (
                          <div className="mt-1 border rounded-xl bg-card shadow-lg overflow-hidden max-h-60 overflow-y-auto z-50 relative">
                            {filtered.map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedProduct(p);
                                  const newPromos = [...config.promocoes];
                                  newPromos[currentPromoIndex] = {
                                    ...newPromos[currentPromoIndex],
                                    imagem_url: p.imagem_url || "",
                                    titulo: `Promoção: ${p.nome}`,
                                    preco: "",
                                    produto_id: p.id
                                  };
                                  setConfig({ ...config, promocoes: newPromos });
                                  setProductSearch(p.nome);
                                  setShowDropdown(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0"
                              >
                                {p.imagem_url ? (
                                  <img src={p.imagem_url} alt={p.titulo} className="w-10 h-10 object-contain rounded-lg bg-white border shrink-0 p-0.5" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">{p.nome}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {p.categorias?.nome || 'Produto'} {p.subcategoria ? `• ${p.subcategoria}` : ''}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-1 border rounded-xl bg-card shadow-sm px-4 py-3 text-sm text-muted-foreground">
                            Nenhum produto encontrado para "{productSearch}"
                          </div>
                        );
                      })()}

                      {selectedProduct && (
                        <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                          ✓ {selectedProduct.nome} selecionado
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-foreground">Título no Modal</label>
                      <Input 
                        value={config.promocoes[currentPromoIndex]?.titulo || ""} 
                        onChange={e => updateCurrentPromo("titulo", e.target.value)} 
                        placeholder="Ex: Combo Especial, Promoção de Quarta..." 
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-foreground">Preço Promocional (R$)</label>
                      <Input 
                        value={config.promocoes[currentPromoIndex]?.preco || ""} 
                        onChange={e => updateCurrentPromo("preco", e.target.value)} 
                        placeholder="Ex: 19,90" 
                        className="h-9"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-foreground">Rodapé do Modal (opcional)</label>
                      <Input 
                        value={config.promocoes[currentPromoIndex]?.rodape || ""} 
                        onChange={e => updateCurrentPromo("rodape", e.target.value)} 
                        placeholder="Ex: Somente hoje! Válido até às 22h." 
                        className="h-9"
                      />
                      <p className="text-[10px] text-muted-foreground">Texto pequeno exibido embaixo da imagem no app.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-muted-foreground">Visível A Partir de:</label>
                    <Input type="datetime-local" value={config.promocoes[currentPromoIndex]?.inicio || ""} onChange={e => updateCurrentPromo("inicio", e.target.value)} className="h-9 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-muted-foreground">Ocultar Automaticamente Em:</label>
                    <Input type="datetime-local" value={config.promocoes[currentPromoIndex]?.fim || ""} onChange={e => updateCurrentPromo("fim", e.target.value)} className="h-9 font-mono" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Singer / Line-up Section */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase border-b pb-2 flex items-center gap-2">
            <Mic2 className="h-3.5 w-3.5" /> Cantor do Dia (Line-up / Atrações)
          </h2>

          <div className="p-5 border rounded-xl bg-card shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Habilitar Letreiro de Cantores</p>
                <p className="text-[13px] text-muted-foreground font-medium">Exibe uma faixa correndo no topo do cardápio com os shows ou programação da noite.</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, cantor_ativo: !config.cantor_ativo })}
                className={`relative inline-flex h-4 w-7 cursor-pointer items-center rounded-full transition-colors focus:outline-hidden ${config.cantor_ativo ? 'bg-emerald-500/80' : 'bg-muted-foreground/30'}`}
                role="switch"
                aria-checked={config.cantor_ativo}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config.cantor_ativo ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {config.cantor_ativo && (
              <div className="grid gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold">Atrações (Cantores/Bandas)</label>
                    <Button variant="outline" size="sm" onClick={addAtracao} className="h-7 text-[11px] px-2 flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Adicionar
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {parsedAtracoes.map((atracao, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={atracao}
                          onChange={e => updateAtracao(index, e.target.value)}
                          placeholder={`Ex: Atração ${index + 1}`}
                        />
                        {parsedAtracoes.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeAtracao(index)} className="h-9 w-9 text-muted-foreground hover:text-red-500 shrink-0">
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Adicione quantas atrações quiser. Elas passarão no letreiro uma após a outra, em loop contínuo.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-muted-foreground">Iniciar Letreiro Em:</label>
                    <Input type="datetime-local" value={config.cantor_inicio} onChange={e => setConfig({...config, cantor_inicio: e.target.value})} className="h-9 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-muted-foreground">Terminar Letreiro Em:</label>
                    <Input type="datetime-local" value={config.cantor_fim} onChange={e => setConfig({...config, cantor_fim: e.target.value})} className="h-9 font-mono" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Couvert Section */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase border-b pb-2 flex items-center gap-2">
            <Ticket className="h-3.5 w-3.5" /> Couvert Artístico
          </h2>

          <div className="p-5 border rounded-xl bg-card shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Cobrar Couvert Artístico</p>
                <p className="text-[13px] text-muted-foreground font-medium">
                  Quando ativo, o caixa poderá lançar o couvert diretamente em qualquer comanda, definindo a quantidade de pessoas.
                </p>
              </div>
              <button
                onClick={() => setConfig({ ...config, couvert_ativo: !config.couvert_ativo })}
                className={`relative inline-flex h-4 w-7 cursor-pointer items-center rounded-full transition-colors focus:outline-hidden ${config.couvert_ativo ? 'bg-emerald-500/80' : 'bg-muted-foreground/30'}`}
                role="switch"
                aria-checked={config.couvert_ativo}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config.couvert_ativo ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {config.couvert_ativo && (
              <div className="mt-4 pt-4 border-t border-border/50 max-w-xs space-y-2">
                <label className="text-xs font-semibold">Valor por Pessoa (R$)</label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={config.couvert_valor}
                  onChange={e => setConfig({...config, couvert_valor: parseFloat(e.target.value) || 0})}
                  className="h-9 font-mono"
                  placeholder="Ex: 15.00"
                />
                <p className="text-[11px] text-muted-foreground">
                  Este valor será inserido por pessoa na comanda. Para 5 pessoas, informe 5 na tela de Pedidos.
                </p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
