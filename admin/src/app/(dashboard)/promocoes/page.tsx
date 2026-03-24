"use client";

import { useState, useEffect } from "react";
import { Megaphone, Mic2, Ticket, Upload, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { uploadImageAction } from "@/app/actions/upload-image";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PromocoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [config, setConfig] = useState({
    promocao_ativa: false,
    promocao_imagem_url: "",
    promocao_inicio: "",
    promocao_fim: "",
    cantor_ativo: false,
    cantor_nome: "",
    cantor_inicio: "",
    cantor_fim: "",
    couvert_ativo: false,
    couvert_valor: 10.0,
  });

  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase
        .from("configuracoes")
        .select("*")
        .limit(1)
        .single();

      if (data) {
        setConfig({
          promocao_ativa: data.promocao_ativa || false,
          promocao_imagem_url: data.promocao_imagem_url || "",
          promocao_inicio: data.promocao_inicio ? formatToLocal(data.promocao_inicio) : "",
          promocao_fim: data.promocao_fim ? formatToLocal(data.promocao_fim) : "",
          cantor_ativo: data.cantor_ativo || false,
          cantor_nome: data.cantor_nome || "",
          cantor_inicio: data.cantor_inicio ? formatToLocal(data.cantor_inicio) : "",
          cantor_fim: data.cantor_fim ? formatToLocal(data.cantor_fim) : "",
          couvert_ativo: data.couvert_ativo || false,
          couvert_valor: data.valor_couvert || 10.0,
        });
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  function formatToLocal(isoString: string) {
    if (!isoString) return "";
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
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
        setConfig(prev => ({ ...prev, promocao_imagem_url: res.url! }));
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

  async function handleSave() {
    setSaving(true);

    const payload = {
      id: "global",
      promocao_ativa: config.promocao_ativa,
      promocao_imagem_url: config.promocao_imagem_url,
      promocao_inicio: config.promocao_inicio ? new Date(config.promocao_inicio).toISOString() : null,
      promocao_fim: config.promocao_fim ? new Date(config.promocao_fim).toISOString() : null,
      cantor_ativo: config.cantor_ativo,
      cantor_nome: config.cantor_nome,
      cantor_inicio: config.cantor_inicio ? new Date(config.cantor_inicio).toISOString() : null,
      cantor_fim: config.cantor_fim ? new Date(config.cantor_fim).toISOString() : null,
      couvert_ativo: config.couvert_ativo,
      valor_couvert: config.couvert_valor,
    };

    const { error } = await supabase
      .from("configuracoes")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.error(error);
      toast.error("Erro ao salvar. Verifique as permissões do banco.");
    } else {
      toast.success("Configurações de Promoções salvas!");
    }
    setSaving(false);
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Promoções &amp; Couvert</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Gerencie promoções do dia, line-up de artistas e cobrança de couvert artístico.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-brand text-white hover:bg-brand/90 font-medium h-9">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Tudo
        </Button>
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
              <Switch checked={config.promocao_ativa} onCheckedChange={(v: boolean) => setConfig({ ...config, promocao_ativa: v })} />
            </div>

            {config.promocao_ativa && (
              <div className="grid gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-start gap-4">
                  <div className="w-32 h-40 shrink-0 border-2 border-dashed rounded-xl bg-muted/30 flex items-center justify-center overflow-hidden relative">
                    {config.promocao_imagem_url ? (
                       <img src={config.promocao_imagem_url} alt="Promo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ImageIcon className="h-6 w-6 opacity-40" />
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">Sem Imagem</span>
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-background/60 backdrop-blur-xs flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-brand" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold">Imagem do Modal</label>
                    <label className="flex items-center gap-2 px-4 py-2 bg-muted/50 border rounded-md cursor-pointer hover:bg-muted w-max text-sm font-medium transition-colors">
                      <Upload className="h-4 w-4" />
                      Anexar Imagem
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                    <p className="text-[11px] text-muted-foreground mt-2 max-w-sm">Use imagens verticais (tamanho de folheto/flyer de celular) para melhor encaixe na tela do cliente.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-muted-foreground">Visível A Partir de:</label>
                    <Input type="datetime-local" value={config.promocao_inicio} onChange={e => setConfig({...config, promocao_inicio: e.target.value})} className="h-9 font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-muted-foreground">Ocultar Automaticamente Em:</label>
                    <Input type="datetime-local" value={config.promocao_fim} onChange={e => setConfig({...config, promocao_fim: e.target.value})} className="h-9 font-mono" />
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
              <Switch checked={config.cantor_ativo} onCheckedChange={(v: boolean) => setConfig({ ...config, cantor_ativo: v })} />
            </div>

            {config.cantor_ativo && (
              <div className="grid gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="space-y-2">
                  <label className="text-xs font-semibold">Texto do Letreiro (O que vai passar escrito na tela?)</label>
                  <Input
                    value={config.cantor_nome}
                    onChange={e => setConfig({...config, cantor_nome: e.target.value})}
                    placeholder="Ex: 🎤 Atrações de Hoje: Banda X às 19h | DJ Silva às 22h"
                  />
                  <p className="text-[11px] text-muted-foreground">Escreva livremente todos os artistas e horários. O texto ficará repetindo em loop contínuo.</p>
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
              <Switch checked={config.couvert_ativo} onCheckedChange={(v: boolean) => setConfig({ ...config, couvert_ativo: v })} />
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
