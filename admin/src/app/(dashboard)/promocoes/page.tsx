"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Mic2, Ticket, Upload, Loader2, Image as ImageIcon,
  Plus, Trash, Search, X, Check, ChevronLeft, ChevronRight, CalendarDays,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadImageAction } from "@/app/actions/upload-image";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ─── Types ───
interface DayPromo {
  produto_id: string;
  grupo_id_sabor: string | null;
  aplicar_grupo: boolean;
  variacao_id: string | null;
  titulo: string;
  preco: string;
  imagem_url: string;
  rodape: string;
}

interface DayProgram {
  data: string;
  inicio: string;
  fim: string;
  atracoes: string[];
  promocoes: DayPromo[];
}

interface DBProduct {
  id: string;
  nome: string;
  subcategoria: string | null;
  grupo_id_sabor: string | null;
  imagem_url: string | null;
  categorias: { nome: string } | null;
}

interface DBVariant {
  id: string;
  produto_id: string;
  nome: string;
  preco: number;
}

// ─── Constants ───
const DAY_NAMES_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DAY_NAMES_FULL = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ─── Helpers ───
function pad(n: number) { return n.toString().padStart(2, "0"); }

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatToLocal(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(weekOffset: number) {
  const monday = getMonday(new Date());
  monday.setDate(monday.getDate() + weekOffset * 7);
  const todayStr = formatDateStr(new Date());

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatDateStr(d);
    return {
      date: d,
      dateStr,
      dayShort: DAY_NAMES_SHORT[d.getDay()],
      dayFull: DAY_NAMES_FULL[d.getDay()],
      dayNum: d.getDate(),
      month: MONTH_NAMES[d.getMonth()],
      isPast: dateStr < todayStr,
      isToday: dateStr === todayStr,
    };
  });
}

function getDefaultTimes(dateStr: string) {
  const nextDay = new Date(dateStr + "T00:00:00");
  nextDay.setDate(nextDay.getDate() + 1);
  return {
    inicio: `${dateStr}T13:00`,
    fim: `${formatDateStr(nextDay)}T05:00`,
  };
}

function emptyDayProgram(dateStr: string): DayProgram {
  const times = getDefaultTimes(dateStr);
  return {
    data: dateStr,
    inicio: times.inicio,
    fim: times.fim,
    atracoes: [],
    promocoes: [],
  };
}

function emptyPromo(): DayPromo {
  return {
    produto_id: "",
    grupo_id_sabor: null,
    aplicar_grupo: false,
    variacao_id: null,
    titulo: "",
    preco: "",
    imagem_url: "",
    rodape: "",
  };
}

// ─── Page ───
export default function ProgramacaoSemanalPage() {
  const supabase = createClient();

  // Core state
  const [programacao, setProgramacao] = useState<DayProgram[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Promo editor state
  const [promoIndex, setPromoIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DBProduct | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Product data
  const [produtos, setProdutos] = useState<DBProduct[]>([]);
  const [variacoes, setVariacoes] = useState<DBVariant[]>([]);

  // Couvert (global)
  const [couvertAtivo, setCouvertAtivo] = useState(false);
  const [couvertValor, setCouvertValor] = useState(10.0);

  // ─── Computed ───
  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const selectedDay = weekDays[selectedDayIdx];

  const dayData = useMemo(() => {
    const found = programacao.find((p) => p.data === selectedDay.dateStr);
    return found || emptyDayProgram(selectedDay.dateStr);
  }, [programacao, selectedDay.dateStr]);

  const hasContentMap = useMemo(() => {
    const map: Record<string, { atracoes: number; promocoes: number }> = {};
    programacao.forEach((p) => {
      map[p.data] = {
        atracoes: p.atracoes.filter(Boolean).length,
        promocoes: p.promocoes.filter((pr) => pr.titulo || pr.imagem_url).length,
      };
    });
    return map;
  }, [programacao]);

  // ─── Auto-select today on mount ───
  useEffect(() => {
    const todayStr = formatDateStr(new Date());
    const todayIdx = weekDays.findIndex((d) => d.dateStr === todayStr);
    if (todayIdx >= 0 && weekOffset === 0) setSelectedDayIdx(todayIdx);
  }, []);

  // Reset promo index when switching days
  useEffect(() => {
    setPromoIndex(0);
    setProductSearch("");
    setSelectedProduct(null);
    setShowDropdown(false);
  }, [selectedDayIdx, weekOffset]);

  // ─── Fetch ───
  useEffect(() => {
    async function fetchAll() {
      const [configRes, prodsRes, varsRes] = await Promise.all([
        supabase.from("configuracoes").select("*").limit(1).single(),
        supabase.from("produtos").select("id, nome, subcategoria, grupo_id_sabor, imagem_url, categorias(nome)").order("nome"),
        supabase.from("variacoes_produto").select("id, produto_id, nome, preco").eq("ativo", true),
      ]);

      if (prodsRes.data) setProdutos(prodsRes.data);
      if (varsRes.data) setVariacoes(varsRes.data);

      if (configRes.data) {
        const data = configRes.data;
        setCouvertAtivo(data.couvert_ativo || false);
        setCouvertValor(data.valor_couvert || 10.0);

        let prog: DayProgram[] = Array.isArray(data.programacao_semanal) ? (data.programacao_semanal as unknown as DayProgram[]) : [];

        // Format dates to local
        prog = prog.map((p) => ({
          ...p,
          inicio: p.inicio?.includes("T") ? (p.inicio.includes("Z") || p.inicio.includes("+") ? formatToLocal(p.inicio) : p.inicio) : p.inicio,
          fim: p.fim?.includes("T") ? (p.fim.includes("Z") || p.fim.includes("+") ? formatToLocal(p.fim) : p.fim) : p.fim,
          atracoes: Array.isArray(p.atracoes) ? p.atracoes : [],
          promocoes: Array.isArray(p.promocoes) ? p.promocoes : [],
        }));

        // Clean expired days (before today)
        const todayStr = formatDateStr(new Date());
        const cleaned = prog.filter((p) => p.data >= todayStr);
        if (cleaned.length < prog.length) {
          // @ts-expect-error JSON type mismatch
          await supabase.from("configuracoes").update({ programacao_semanal: cleaned }).eq("id", "global");
        }

        setProgramacao(cleaned);
      }

      setLoading(false);
    }
    fetchAll();
  }, []);

  // ─── Auto-save ───
  const isFirstLoad = useRef(true);
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (loading) return;

    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      const payload = {
        id: "global",
        programacao_semanal: programacao.map((p) => ({
          ...p,
          promocoes: p.promocoes.map((pr) => {
            let numPrice = null;
            if (pr.preco) {
               const parsed = parseFloat(pr.preco.toString().replace(",", "."));
               if (!isNaN(parsed)) numPrice = parsed;
            }
            return {
              ...pr,
              preco: numPrice,
            };
          }),
        })),
        couvert_ativo: couvertAtivo,
        valor_couvert: couvertValor,
      };
      const { error } = await supabase.from("configuracoes").upsert(payload, { onConflict: "id" });
      if (!error) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        toast.error("Erro ao salvar.");
        setSaveStatus("idle");
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [programacao, couvertAtivo, couvertValor]);

  // ─── Day data operations ───
  const updateProgramacao = useCallback(
    (dateStr: string, updater: (day: DayProgram) => DayProgram) => {
      setProgramacao((prev) => {
        const idx = prev.findIndex((p) => p.data === dateStr);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = updater(updated[idx]);
          return updated;
        }
        return [...prev, updater(emptyDayProgram(dateStr))];
      });
    },
    []
  );

  // Atrações
  function addAtracao() {
    updateProgramacao(selectedDay.dateStr, (day) => ({
      ...day,
      atracoes: [...day.atracoes, ""],
    }));
  }

  function updateAtracao(idx: number, value: string) {
    updateProgramacao(selectedDay.dateStr, (day) => {
      const atracoes = [...day.atracoes];
      atracoes[idx] = value;
      return { ...day, atracoes };
    });
  }

  function removeAtracao(idx: number) {
    updateProgramacao(selectedDay.dateStr, (day) => ({
      ...day,
      atracoes: day.atracoes.filter((_, i) => i !== idx),
    }));
  }

  // Promoções
  function addPromo() {
    updateProgramacao(selectedDay.dateStr, (day) => ({
      ...day,
      promocoes: [...day.promocoes, emptyPromo()],
    }));
    setPromoIndex(dayData.promocoes.length);
    setProductSearch("");
    setSelectedProduct(null);
  }

  function removePromo() {
    if (dayData.promocoes.length <= 1) {
      updateProgramacao(selectedDay.dateStr, (day) => ({
        ...day,
        promocoes: [],
      }));
      setPromoIndex(0);
      return;
    }
    updateProgramacao(selectedDay.dateStr, (day) => ({
      ...day,
      promocoes: day.promocoes.filter((_, i) => i !== promoIndex),
    }));
    setPromoIndex(Math.max(0, promoIndex - 1));
  }

  function updatePromo(field: string, value: any) {
    updateProgramacao(selectedDay.dateStr, (day) => {
      const promocoes = [...day.promocoes];
      if (!promocoes[promoIndex]) return day;
      promocoes[promoIndex] = { ...promocoes[promoIndex], [field]: value };
      return { ...day, promocoes };
    });
  }

  function updateDayTime(field: "inicio" | "fim", value: string) {
    updateProgramacao(selectedDay.dateStr, (day) => ({
      ...day,
      [field]: value,
    }));
  }

  // Image upload
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    try {
      const res = await uploadImageAction(formData);
      if (res.url) {
        updatePromo("imagem_url", res.url);
        toast.success("Imagem anexada!");
      } else {
        toast.error("Erro no upload.");
      }
    } catch {
      toast.error("Erro desconhecido.");
    } finally {
      setUploading(false);
    }
  }

  // Week header
  const weekLabel = useMemo(() => {
    const first = weekDays[0];
    const last = weekDays[6];
    if (first.date.getMonth() === last.date.getMonth()) {
      return `${first.dayNum} — ${last.dayNum} ${first.month}`;
    }
    return `${first.dayNum} ${first.month} — ${last.dayNum} ${last.month}`;
  }, [weekDays]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPromo = dayData.promocoes[promoIndex];

  return (
    <div className="flex-1 w-full space-y-6 p-8 max-w-4xl mx-auto mt-4 pb-24 relative">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Programação Semanal</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Programe atrações e promoções para cada dia. Edite a qualquer momento.</p>
        </div>
        <div className="h-9 flex items-center px-3 gap-2">
          {saveStatus === "saving" && (
            <span className="flex items-center text-xs text-muted-foreground font-medium animate-pulse">
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Salvando...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center text-xs text-emerald-600 font-medium">
              <Check className="h-4 w-4 mr-1.5" /> Salvo
            </span>
          )}
        </div>
      </div>

      {/* ── Week Navigation ── */}
      <div className="flex items-center justify-between bg-card border rounded-xl px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { setWeekOffset((w) => w - 1); setSelectedDayIdx(0); }}
          disabled={weekOffset <= 0}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          {weekLabel}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { setWeekOffset((w) => w + 1); setSelectedDayIdx(0); }}
          disabled={weekOffset >= 4}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Day Tabs ── */}
      <div className="flex gap-1.5">
        {weekDays.map((day, idx) => {
          const isSelected = selectedDayIdx === idx;
          const content = hasContentMap[day.dateStr];
          const dots = (content?.atracoes || 0) + (content?.promocoes || 0);

          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDayIdx(idx)}
              className={`
                flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer
                ${isSelected
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : day.isToday
                    ? "bg-card border-[#EC662D]/50 hover:border-[#EC662D]"
                    : day.isPast
                      ? "bg-muted/30 border-transparent opacity-50"
                      : "bg-card border-border hover:border-foreground/20"
                }
              `}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wide ${isSelected ? "text-background/70" : "text-muted-foreground"}`}>
                {day.dayShort}
              </span>
              <span className={`text-base font-bold leading-none ${isSelected ? "" : "text-foreground"}`}>
                {day.dayNum}
              </span>
              {/* Content indicators */}
              <div className="flex gap-0.5 mt-0.5 h-[6px]">
                {dots > 0 ? (
                  Array.from({ length: Math.min(dots, 4) }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-emerald-400" : "bg-emerald-500"}`}
                    />
                  ))
                ) : (
                  <div className="w-1.5 h-1.5" /> // Spacer to keep height consistent
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Day Content ── */}
      <div className="space-y-5">
        {/* Day title + Time */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground capitalize">
            {selectedDay.dayFull}, {selectedDay.dayNum}/{pad(selectedDay.date.getMonth() + 1)}
          </h2>
          {selectedDay.isPast && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Dia passado</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Início</label>
            <Input
              type="datetime-local"
              value={dayData.inicio}
              onChange={(e) => updateDayTime("inicio", e.target.value)}
              className="h-9 font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Fim</label>
            <Input
              type="datetime-local"
              value={dayData.fim}
              onChange={(e) => updateDayTime("fim", e.target.value)}
              className="h-9 font-mono text-xs"
            />
          </div>
        </div>

        {/* ── Atrações ── */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase border-b pb-2 flex items-center gap-2">
            <Mic2 className="h-3.5 w-3.5" /> Atrações da Noite
          </h3>

          <div className="p-4 border rounded-xl bg-card shadow-sm space-y-3">
            {dayData.atracoes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhuma atração adicionada</p>
            ) : (
              <div className="space-y-2">
                {dayData.atracoes.map((atracao, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50 text-muted-foreground text-[11px] font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <Input
                      value={atracao}
                      onChange={(e) => updateAtracao(idx, e.target.value)}
                      placeholder={`Ex: Banda, DJ, Karaokê...`}
                      className="h-9"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAtracao(idx)}
                      className="h-9 w-9 text-muted-foreground hover:text-red-500 shrink-0"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={addAtracao}
              className="w-full h-8 text-[12px] font-medium flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Atração
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Atrações aparecem no letreiro (marquee) do app durante o horário configurado.
            </p>
          </div>
        </section>

        {/* ── Promoções ── */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase border-b pb-2 flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" /> Promoções do Dia
          </h3>

          <div className="p-4 border rounded-xl bg-card shadow-sm space-y-4">
            {dayData.promocoes.length === 0 ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-xs text-muted-foreground">Nenhuma promoção para este dia</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPromo}
                  className="h-8 text-[12px] font-medium flex items-center gap-1.5 mx-auto"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Promoção
                </Button>
              </div>
            ) : (
              <>
                {/* Promo navigator */}
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPromoIndex(Math.max(0, promoIndex - 1))}
                      disabled={promoIndex === 0}
                      className="h-8 w-8 p-0"
                    >
                      &larr;
                    </Button>
                    <span className="text-xs font-semibold w-24 text-center">
                      Promo {promoIndex + 1} de {dayData.promocoes.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPromoIndex(Math.min(dayData.promocoes.length - 1, promoIndex + 1))}
                      disabled={promoIndex === dayData.promocoes.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      &rarr;
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removePromo}
                      className="h-8 px-3 text-[12px] font-medium flex items-center gap-1.5"
                    >
                      <Trash className="h-3.5 w-3.5 text-muted-foreground" /> Remover
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addPromo}
                      className="h-8 px-3 text-[12px] font-medium flex items-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Nova
                    </Button>
                  </div>
                </div>

                {currentPromo && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Left: Image */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-40 h-52 shrink-0 border-2 border-dashed border-muted-foreground/30 rounded-xl bg-white flex items-center justify-center overflow-hidden relative shadow-sm">
                        {currentPromo.imagem_url ? (
                          <img src={currentPromo.imagem_url} alt="Promo" className="w-full h-full object-contain p-2" />
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
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border rounded-md cursor-pointer hover:bg-muted text-xs font-medium transition-colors mt-1">
                        <Upload className="h-3.5 w-3.5" /> Enviar Imagem
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                      </label>
                    </div>

                    {/* Right: Controls */}
                    <div className="space-y-3" ref={searchRef}>
                      {/* Product Search */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-foreground">Buscar Produto</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            value={productSearch}
                            onChange={(e) => { setProductSearch(e.target.value); setShowDropdown(true); }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="Ex: Corona, Brahma..."
                            className="h-9 pl-9 pr-8"
                          />
                          {productSearch && (
                            <button onClick={() => { setProductSearch(""); setShowDropdown(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Search dropdown */}
                        {showDropdown && productSearch.trim().length > 0 && (() => {
                          const q = productSearch.trim().toLowerCase();
                          const filtered = produtos.filter((p) =>
                            (p.nome || "").toLowerCase().includes(q) ||
                            (p.subcategoria || "").toLowerCase().includes(q) ||
                            (p.categorias?.nome || "").toLowerCase().includes(q)
                          );
                          return filtered.length > 0 ? (
                            <div className="mt-1 border rounded-xl bg-card shadow-lg overflow-hidden max-h-52 overflow-y-auto z-50 relative">
                              {filtered.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => {
                                    setSelectedProduct(p);
                                    updateProgramacao(selectedDay.dateStr, (day) => {
                                      const promocoes = [...day.promocoes];
                                      if (promocoes[promoIndex]) {
                                        promocoes[promoIndex] = {
                                          ...promocoes[promoIndex],
                                          imagem_url: p.imagem_url || "",
                                          titulo: `Promoção: ${p.nome}`,
                                          preco: "",
                                          produto_id: p.id,
                                          grupo_id_sabor: p.grupo_id_sabor || null,
                                          aplicar_grupo: !!p.grupo_id_sabor,
                                          variacao_id: null,
                                        };
                                      }
                                      return { ...day, promocoes };
                                    });
                                    setProductSearch(p.nome);
                                    setShowDropdown(false);
                                  }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0"
                                >
                                  {p.imagem_url ? (
                                    <img src={p.imagem_url} alt="" className="w-10 h-10 object-contain rounded-lg bg-white border shrink-0 p-0.5" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{p.nome}</p>
                                    <p className="text-xs text-muted-foreground truncate">{p.categorias?.nome || "Produto"}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-1 border rounded-xl bg-card shadow-sm px-4 py-3 text-sm text-muted-foreground">
                              Nenhum produto encontrado
                            </div>
                          );
                        })()}

                        {/* Selected product info */}
                        {selectedProduct && currentPromo?.produto_id === selectedProduct.id && (
                          <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              ✓ {selectedProduct.nome}
                            </p>

                            {selectedProduct.grupo_id_sabor && (
                              <div className="flex items-center justify-between p-2 mt-1.5 bg-white dark:bg-background/80 rounded border border-border/50 shadow-xs">
                                <div>
                                  <label className="text-[10px] font-semibold text-foreground">Desconto para toda a linha?</label>
                                  <p className="text-[9px] text-muted-foreground">Todos sabores da linha</p>
                                </div>
                                <Switch
                                  checked={currentPromo?.aplicar_grupo ?? true}
                                  onCheckedChange={(checked) => updatePromo("aplicar_grupo", checked)}
                                />
                              </div>
                            )}

                            {(!selectedProduct.grupo_id_sabor || !currentPromo?.aplicar_grupo) && (() => {
                              const productVars = variacoes.filter((v) => v.produto_id === selectedProduct.id);
                              if (productVars.length > 1) {
                                return (
                                  <div className="mt-1.5">
                                    <label className="text-[10px] font-semibold">Tamanho/formato:</label>
                                    <select
                                      className="w-full text-[11px] h-7 rounded-md border bg-transparent px-2 mt-0.5"
                                      value={currentPromo?.variacao_id || ""}
                                      onChange={(e) => updatePromo("variacao_id", e.target.value === "" ? null : e.target.value)}
                                    >
                                      <option value="">Todas variações</option>
                                      {productVars.map((v) => (
                                        <option key={v.id} value={v.id}>{v.nome} - R$ {v.preco}</option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-foreground">Título no Modal</label>
                        <Input
                          value={currentPromo?.titulo || ""}
                          onChange={(e) => updatePromo("titulo", e.target.value)}
                          placeholder="Ex: Combo Especial, Promoção de Quarta..."
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-foreground">Preço Promocional (R$)</label>
                        <Input
                          value={currentPromo?.preco || ""}
                          onChange={(e) => updatePromo("preco", e.target.value)}
                          placeholder="Ex: 19,90"
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-foreground">Rodapé (opcional)</label>
                        <Input
                          value={currentPromo?.rodape || ""}
                          onChange={(e) => updatePromo("rodape", e.target.value)}
                          placeholder="Ex: Somente hoje! Válido até 22h."
                          className="h-9"
                        />
                        <p className="text-[10px] text-muted-foreground">Texto exibido abaixo da imagem no app.</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── Couvert (Global) ── */}
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase border-b pb-2 flex items-center gap-2">
            <Ticket className="h-3.5 w-3.5" /> Couvert Artístico
          </h3>

          <div className="p-4 border rounded-xl bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Cobrar Couvert Artístico</p>
                <p className="text-[12px] text-muted-foreground font-medium">Lançar couvert diretamente na comanda, definindo qtd de pessoas.</p>
              </div>
              <button
                onClick={() => setCouvertAtivo(!couvertAtivo)}
                className={`relative inline-flex h-4 w-7 cursor-pointer items-center rounded-full transition-colors focus:outline-hidden ${couvertAtivo ? "bg-emerald-500/80" : "bg-muted-foreground/30"}`}
                role="switch"
                aria-checked={couvertAtivo}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${couvertAtivo ? "translate-x-3.5" : "translate-x-0.5"}`} />
              </button>
            </div>

            {couvertAtivo && (
              <div className="mt-3 pt-3 border-t border-border/50 max-w-xs space-y-2">
                <label className="text-xs font-semibold">Valor por Pessoa (R$)</label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={couvertValor}
                  onChange={(e) => setCouvertValor(parseFloat(e.target.value) || 0)}
                  className="h-9 font-mono"
                  placeholder="Ex: 15.00"
                />
                <p className="text-[10px] text-muted-foreground">
                  Este valor será inserido por pessoa na comanda.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
