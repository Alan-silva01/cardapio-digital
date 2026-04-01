"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Save, Store, Edit2, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Horario {
  id: string;
  dia_semana: number;
  aberto: boolean;
  hora_abertura: string;
  hora_fechamento: string;
}

interface Configuracao {
  modo_funcionamento: "automatico" | "aberto" | "fechado";
  mensagem_fechamento: string;
}

const DIAS_SEMANA = [
  { nome: "Domingo", curto: "Dom" },
  { nome: "Segunda-feira", curto: "Seg" },
  { nome: "Terça-feira", curto: "Ter" },
  { nome: "Quarta-feira", curto: "Qua" },
  { nome: "Quinta-feira", curto: "Qui" },
  { nome: "Sexta-feira", curto: "Sex" },
  { nome: "Sábado", curto: "Sáb" },
];

const MODOS = [
  {
    value: "automatico" as const,
    label: "Automático",
    description: "Seguir horários configurados",
  },
  {
    value: "aberto" as const,
    label: "Forçar Aberto",
    description: "Ignorar relógio e abrir",
  },
  {
    value: "fechado" as const,
    label: "Forçar Fechado",
    description: "Ignorar relógio e fechar",
  },
];

function getStatusAtual(
  config: Configuracao,
  horarios: Horario[]
): { aberto: boolean; proximoEvento: string | null } {
  if (config.modo_funcionamento === "aberto") {
    return { aberto: true, proximoEvento: null };
  }
  if (config.modo_funcionamento === "fechado") {
    return { aberto: false, proximoEvento: null };
  }

  // Automático — checa pelo horário de SP
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  const diaSemana = now.getDay();
  const horaAtual =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");

  const hoje = horarios.find((h) => h.dia_semana === diaSemana);

  if (!hoje || !hoje.aberto) {
    // Find next open day
    for (let i = 1; i <= 7; i++) {
      const nextDay = (diaSemana + i) % 7;
      const next = horarios.find((h) => h.dia_semana === nextDay);
      if (next?.aberto) {
        return {
          aberto: false,
          proximoEvento: `${DIAS_SEMANA[nextDay].curto} às ${next.hora_abertura.substring(0, 5)}`,
        };
      }
    }
    return { aberto: false, proximoEvento: null };
  }

  const abertura = hoje.hora_abertura.substring(0, 5);
  const fechamento = hoje.hora_fechamento.substring(0, 5);

  // Handle overnight hours (e.g., opens 18:00, closes 02:00)
  let estaAberto: boolean;
  if (fechamento < abertura) {
    // Overnight: open if current >= abertura OR current < fechamento
    estaAberto = horaAtual >= abertura || horaAtual < fechamento;
  } else {
    estaAberto = horaAtual >= abertura && horaAtual < fechamento;
  }

  if (estaAberto) {
    return { aberto: true, proximoEvento: `Fecha às ${fechamento}` };
  }

  if (horaAtual < abertura) {
    return { aberto: false, proximoEvento: `Abre às ${abertura}` };
  }

  // After closing, find next open
  for (let i = 1; i <= 7; i++) {
    const nextDay = (diaSemana + i) % 7;
    const next = horarios.find((h) => h.dia_semana === nextDay);
    if (next?.aberto) {
      return {
        aberto: false,
        proximoEvento: `${DIAS_SEMANA[nextDay].curto} às ${next.hora_abertura.substring(0, 5)}`,
      };
    }
  }

  return { aberto: false, proximoEvento: null };
}

export default function HorariosPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [config, setConfig] = useState<Configuracao>({
    modo_funcionamento: "automatico",
    mensagem_fechamento:
      "Nosso estabelecimento encontra-se fechado no momento. Voltaremos em breve!",
  });

  const diaAtual = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  ).getDay();

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { data: configData } = await supabase
      .from("configuracoes")
      .select("modo_funcionamento, mensagem_fechamento")
      .limit(1)
      .single();

    if (configData) {
      setConfig({
        modo_funcionamento:
          (configData.modo_funcionamento as Configuracao["modo_funcionamento"]) ||
          "automatico",
        mensagem_fechamento:
          configData.mensagem_fechamento ||
          "Nosso estabelecimento encontra-se fechado no momento. Voltaremos em breve!",
      });
    }

    const { data: horariosData } = await supabase
      .from("horarios_funcionamento")
      .select("*")
      .order("dia_semana", { ascending: true });

    if (horariosData && horariosData.length > 0) {
      setHorarios(horariosData as Horario[]);
    } else {
      const newHorarios: any[] = [];
      for (let i = 0; i < 7; i++) {
        newHorarios.push({
          dia_semana: i,
          aberto: i > 0 && i < 6,
          hora_abertura: "11:00:00",
          hora_fechamento: "23:00:00",
        });
      }
      const { data: inserted } = await supabase
        .from("horarios_funcionamento")
        .insert(newHorarios)
        .select();
      if (inserted) setHorarios(inserted as Horario[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime: atualiza status a cada 60s
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update status
      setHorarios((prev) => [...prev]);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Realtime subscription on configuracoes
  useEffect(() => {
    const channel = supabase
      .channel("horarios-config-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "configuracoes" },
        (payload) => {
          const d = payload.new;
          if (d.modo_funcionamento || d.mensagem_fechamento) {
            setConfig((prev) => ({
              ...prev,
              modo_funcionamento: d.modo_funcionamento || prev.modo_funcionamento,
              mensagem_fechamento: d.mensagem_fechamento || prev.mensagem_fechamento,
            }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "horarios_funcionamento" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleHorarioChange = (
    index: number,
    field: keyof Horario,
    value: any
  ) => {
    const updated = [...horarios];
    updated[index] = { ...updated[index], [field]: value };
    setHorarios(updated);
  };

  const saveToSupabase = async () => {
    setSaving(true);

    try {
      const { data: oldConfig } = await supabase
        .from("configuracoes")
        .select("id")
        .limit(1)
        .single();

      if (oldConfig) {
        await supabase
          .from("configuracoes")
          .update({
            modo_funcionamento: config.modo_funcionamento,
            mensagem_fechamento: config.mensagem_fechamento,
          })
          .eq("id", oldConfig.id);
      }

      for (const h of horarios) {
        await supabase
          .from("horarios_funcionamento")
          .update({
            aberto: h.aberto,
            hora_abertura: h.hora_abertura,
            hora_fechamento: h.hora_fechamento,
          })
          .eq("id", h.id);
      }

      toast.success("Horários salvos com sucesso");
    } catch {
      toast.error("Erro ao salvar horários");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[500px]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const status = getStatusAtual(config, horarios);

  return (
    <div className="flex-1 w-full space-y-8 p-8 max-w-4xl mx-auto mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Horários de Funcionamento
            </h1>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium gap-1.5",
                status.aberto
                  ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5"
                  : "border-red-500/30 text-red-500 bg-red-500/5"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  status.aberto ? "bg-emerald-500" : "bg-red-500"
                )}
              />
              {status.aberto ? "Aberto" : "Fechado"}
            </Badge>
          </div>
          <p className="text-[13px] text-muted-foreground mt-1">
            Gerencie os horários do estabelecimento e o comportamento do cardápio
            digital.
            {status.proximoEvento && (
              <span className="ml-1 text-foreground font-medium">
                · {status.proximoEvento}
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={saveToSupabase}
          disabled={saving}
          size="sm"
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Salvar
        </Button>
      </div>

      {/* Modo de Funcionamento */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase border-b pb-2">
          <Store className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
          Modo de Funcionamento
        </h2>

        <div className="p-5 border rounded-xl bg-card shadow-sm space-y-4">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              Controle de Status
            </p>
            <p className="text-[13px] text-muted-foreground font-medium">
              Defina como o cardápio digital se comporta — automático segue os
              horários abaixo.
            </p>
          </div>

          <div className="flex gap-3">
            {MODOS.map((modo) => (
              <button
                key={modo.value}
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    modo_funcionamento: modo.value,
                  }))
                }
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer text-center",
                  config.modo_funcionamento === modo.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {modo.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Quadro Semanal */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase border-b pb-2">
          <Clock className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
          Quadro de Horários Semanais
        </h2>

        <div className="border rounded-xl bg-card shadow-sm divide-y">
          {horarios.map((dia, index) => {
            const isHoje = dia.dia_semana === diaAtual;
            const isFimDeSemana =
              dia.dia_semana === 0 || dia.dia_semana === 6;

            return (
              <div
                key={dia.id}
                className={cn(
                  "flex items-center justify-between px-5 py-3.5 transition-colors",
                  isHoje && "bg-muted/30"
                )}
              >
                {/* Day name + switch */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <Switch
                    checked={dia.aberto}
                    onCheckedChange={(val) =>
                      handleHorarioChange(index, "aberto", val)
                    }
                  />
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        dia.aberto
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {DIAS_SEMANA[dia.dia_semana].nome}
                    </span>
                    {isHoje && (
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 font-semibold"
                      >
                        Hoje
                      </Badge>
                    )}
                    {isFimDeSemana && !isHoje && (
                      <span className="text-[10px] text-muted-foreground/60">
                        Fim de semana
                      </span>
                    )}
                  </div>
                </div>

                {/* Time inputs or Fechado */}
                <div className="flex items-center gap-2">
                  {dia.aberto ? (
                    <>
                      <Input
                        type="time"
                        value={dia.hora_abertura.substring(0, 5)}
                        onChange={(e) =>
                          handleHorarioChange(
                            index,
                            "hora_abertura",
                            e.target.value + ":00"
                          )
                        }
                        className="w-[110px] h-8 text-[13px] bg-background"
                      />
                      <span className="text-muted-foreground text-xs">até</span>
                      <Input
                        type="time"
                        value={dia.hora_fechamento.substring(0, 5)}
                        onChange={(e) =>
                          handleHorarioChange(
                            index,
                            "hora_fechamento",
                            e.target.value + ":00"
                          )
                        }
                        className="w-[110px] h-8 text-[13px] bg-background"
                      />
                    </>
                  ) : (
                    <span className="text-[13px] text-muted-foreground font-medium px-2">
                      Fechado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mensagem de Fechamento */}
      <section className="space-y-4">
        <h2 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase border-b pb-2">
          <Edit2 className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />
          Mensagem de Fechamento
        </h2>

        <div className="p-5 border rounded-xl bg-card shadow-sm space-y-3">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              Mensagem exibida no cardápio
            </p>
            <p className="text-[13px] text-muted-foreground font-medium">
              Texto que o cliente verá quando o estabelecimento estiver fechado.
              No modo automático, o horário de reabertura é adicionado
              automaticamente.
            </p>
          </div>
          <Input
            value={config.mensagem_fechamento}
            onChange={(e) =>
              setConfig({ ...config, mensagem_fechamento: e.target.value })
            }
            className="h-auto py-2.5"
            placeholder="Mensagem quando o restaurante estiver fechado"
          />
        </div>
      </section>
    </div>
  );
}
