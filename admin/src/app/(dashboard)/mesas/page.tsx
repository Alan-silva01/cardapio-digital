"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Users,
  MessageSquare,
  DollarSign,
  Timer,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface MesaStats {
  id?: string;
  numero: number;
  capacidade: number;
  status: "livre" | "ocupada" | "reservada" | "chamando";
  reserva_ativa?: boolean;
  reserva_nome?: string;
  reserva_data?: string;
  token?: string;
  ocupantes?: number;
  total?: string;
  tempo?: string;
  chamandoLabel?: "garçom" | "conta" | null;
}

export default function MesasPage() {
  const supabase = createClient();
  const [mesas, setMesas] = useState<MesaStats[]>([]);
  const [search, setSearch] = useState("");
  const [reservaModalOpen, setReservaModalOpen] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<MesaStats | null>(null);
  const [reservaForm, setReservaForm] = useState({ nome: "", telefone: "", data: "" });
  const [printMesa, setPrintMesa] = useState<MesaStats | null>(null);
  const [isSavingReserva, setIsSavingReserva] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMesasData = useCallback(async () => {
    // 1. Fetch mesas
    const { data: mesasData } = await supabase.from('mesas').select('*').order('numero', { ascending: true });
    
    // 2. Fetch active pedidos
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    const { data: pedidosData } = await supabase
      .from('pedidos')
      .select('numero_mesa, nome_pessoa, status, total, criado_em')
      .gte('criado_em', startDate.toISOString())
      .neq('status', 'entregue')
      .neq('status', 'cancelado');

    if (mesasData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stats = (mesasData as any[]).map((mesa: any) => {
        const tablePedidos = (pedidosData || []).filter(p => p.numero_mesa === mesa.numero);
        
        let status: MesaStats['status'] = mesa.reserva_ativa ? 'reservada' : 'livre';
        let chamandoLabel: MesaStats['chamandoLabel'] = null;
        let ocupantes = 0;
        let totalVal = 0;
        let tempo: string | undefined = undefined;

        if (tablePedidos.length > 0) {
          // If there are active orders, always show as ocupada even if reserved
          status = 'ocupada';
          
          const uniquePeople = new Set(tablePedidos.map(p => p.nome_pessoa || 'Cliente'));
          ocupantes = uniquePeople.size;

          totalVal = tablePedidos.reduce((acc, p) => acc + Number(p.total || 0), 0);

          const validPedidos = tablePedidos.filter(p => p.criado_em !== null);
          if (validPedidos.length > 0) {
              const earliestDate = validPedidos.reduce((earliest, p) => 
                p.criado_em! < earliest.criado_em! ? p : earliest, 
                validPedidos[0]
              ).criado_em;

              const diffMs = Date.now() - new Date(earliestDate!).getTime();
              const diffMin = Math.floor(diffMs / 60000);
              if (diffMin < 1) tempo = "agora";
              else if (diffMin < 60) tempo = `${diffMin}m`;
              else {
                const hours = Math.floor(diffMin / 60);
                const mins = diffMin % 60;
                tempo = `${hours}h${mins > 0 ? `${mins}m` : ""}`;
              }
          }
        }

        // Se chamando_garcom ou solicitando_conta, sobrepõe status
        if (mesa.solicitando_conta) {
          status = 'chamando';
          chamandoLabel = 'conta';
        } else if (mesa.chamando_garcom) {
          status = 'chamando';
          chamandoLabel = 'garçom';
        }

        return {
          id: mesa.id,
          numero: mesa.numero,
          capacidade: mesa.capacidade || 4,
          status,
          chamandoLabel,
          ocupantes: tablePedidos.length > 0 ? ocupantes : undefined,
          total: tablePedidos.length > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal) : undefined,
          tempo,
          reserva_ativa: !!mesa.reserva_ativa,
          reserva_nome: mesa.reserva_nome ?? undefined,
          reserva_data: mesa.reserva_data ?? undefined,
          token: mesa.token ?? undefined,
        };
      });

      setMesas(stats);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMesasData();
    // Refresh elapsed time periodically
    const interval = setInterval(fetchMesasData, 60000);
    return () => clearInterval(interval);
  }, [fetchMesasData]);

  useEffect(() => {
    const channel = supabase
      .channel('mesas-page-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchMesasData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' }, fetchMesasData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchMesasData]);

  
  const handleOpenReserva = (mesa?: MesaStats) => {
    setSelectedMesa(mesa || null);
    setReservaForm({ nome: "", telefone: "", data: "" });
    setReservaModalOpen(true);
  };

  const handleSaveReserva = async () => {
    if (!selectedMesa) return;
    setIsSavingReserva(true);
    let dateStr = reservaForm.data;
    if (dateStr) {
      // Formata data caso receba AAAA-MM-DD para DD-MM-AAAA
      const parts = dateStr.split('-');
      if (parts.length === 3) dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    const { error } = await supabase.from('mesas')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        reserva_ativa: true,
        reserva_nome: reservaForm.nome,
        reserva_telefone: reservaForm.telefone,
        reserva_data: dateStr,
      } as any)
      .eq('id', selectedMesa.id as string);
    
    if (!error) {
      setReservaModalOpen(false);
      setPrintMesa({
        ...selectedMesa,
        reserva_nome: reservaForm.nome,
        reserva_data: dateStr
      });
      setTimeout(() => {
        window.print();
        setPrintMesa(null);
      }, 500);
      fetchMesasData();
    } else {
      console.error(error);
    }
    setIsSavingReserva(false);
  };

  const handlePrintReserva = (e: React.MouseEvent, mesa: MesaStats) => {
    e.stopPropagation();
    setPrintMesa(mesa);
    setTimeout(() => {
      window.print();
      setPrintMesa(null);
    }, 500);
  };

  const clearChamado = async (e: React.MouseEvent, numeroMesa: number) => {
    e.stopPropagation();
    await supabase.from('mesas').update({ chamando_garcom: false, solicitando_conta: false }).eq('numero', numeroMesa);
    // Optimistic update done via fetch on next tick
    fetchMesasData();
  };

  const filteredMesas = mesas.filter(m => 
    search === "" || m.numero.toString().includes(search)
  );

  const getStatusColor = (status: MesaStats["status"]) => {
    switch (status) {
      case "livre": return "text-emerald-500 bg-emerald-500/10";
      case "ocupada": return "text-blue-500 bg-blue-500/10";
      case "chamando": return "text-red-500 bg-red-500/10 animate-pulse";
      case "reservada": return "text-amber-500 bg-amber-500/10";
      default: return "bg-muted";
    }
  };

  return (
    <>
    <div className="flex-1 print:hidden flex flex-col bg-background text-foreground min-h-screen print:bg-white">
      {/* Header / Subnav */}
      <div className="h-14 border-b px-6 flex items-center justify-between print:hidden bg-card text-foreground">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <span className="text-muted-foreground">Monitoramento</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Mapa de Mesas</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-md border p-0.5">
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold bg-background text-foreground shadow-xs">GRID</Button>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold text-muted-foreground hover:text-foreground">LISTA</Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-6 border-b border-border/50 flex items-center justify-between gap-4 print:hidden">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar mesa..."
            className="pl-10 bg-card border-border focus:border-border h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-card border-border text-muted-foreground h-9 text-xs">
            <Filter className="h-3.5 w-3.5 mr-2" />
            Filtros
          </Button>
          <Button onClick={() => handleOpenReserva()} className="bg-[#ff5e1e] hover:bg-[#e54e15] text-white h-9 text-xs font-bold shadow-none print:hidden">
            + Nova Reserva
          </Button>
        </div>
      </div>

      {/* Grid area */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground animate-pulse">Carregando mesas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredMesas.map((mesa) => (
              <Card key={mesa.id || mesa.numero} className={cn(
                "bg-card border-border transition-all cursor-pointer group hover:scale-[1.02] hover:border-border/80 shadow-xs flex flex-col",
                mesa.status === "chamando" && "ring-1 ring-red-500/50 scale-[1.01]"
              )}>
                <CardContent className="p-4 space-y-4 flex flex-col flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-1">MESA</p>
                      <h2 className="text-3xl font-serif font-black text-foreground">
                        {mesa.numero.toString().padStart(2, '0')}
                      </h2>
                    </div>
                    <Badge className={cn("border-none text-[10px] font-bold uppercase tracking-wider h-6 py-0 px-2", getStatusColor(mesa.status))}>
                      {mesa.status}
                    </Badge>
                  </div>


                  <div className="flex-1">
                    {mesa.reserva_ativa && mesa.status === "reservada" ? (
                      <div className="flex flex-col gap-2">
                        <div className="text-sm font-semibold text-amber-600">Reservada para {mesa.reserva_nome}</div>
                        <div className="text-xs text-muted-foreground">{mesa.reserva_data}</div>
                        <div className="mt-2 flex gap-2">
                            <Button variant="outline" size="sm" onClick={(e) => handlePrintReserva(e, mesa)} className="h-8 gap-2 w-full text-xs">
                                <Printer className="h-3 w-3" /> Imprimir
                            </Button>
                        </div>
                      </div>
                    ) : mesa.ocupantes ? (

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {mesa.ocupantes}/{mesa.capacidade} Pessoas
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            {mesa.tempo}
                          </div>
                        </div>
                        <div className="p-2 rounded bg-muted border flex items-center justify-between">
                          <DollarSign className="h-3 w-3 text-emerald-500" />
                          <span className="text-sm font-bold text-emerald-500 tracking-tight">{mesa.total}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Users className="h-3 w-3" />
                        Capacidade: {mesa.capacidade}
                      </div>
                    )}

                    {mesa.status === "chamando" && (
                      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-bold text-red-500 bg-red-500/5 p-2 rounded border border-red-500/20">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
                          {mesa.chamandoLabel === 'conta' ? 'SOLICITANDO CONTA!' : 'GARÇOM CHAMADO!'}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => clearChamado(e, mesa.numero)}
                          className="h-5 w-5 hover:bg-red-500/20 text-red-500 rounded-full"
                          title="Marcar como atendido"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t text-muted-foreground mt-auto">
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] hover:text-[#ff5e1e] hover:bg-[#ff5e1e]/10">
                      Detalhes
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
   
      {/* Modal Nova Reserva */}
      <Dialog open={reservaModalOpen} onOpenChange={setReservaModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Reserva</DialogTitle>
            <DialogDescription>Preencha os dados da reserva para imprimir o ticket.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Mesa</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedMesa?.id || ""} 
                onChange={(e) => setSelectedMesa(mesas.find(m => m.id === e.target.value) || null)}
              >
                <option value="">Selecione uma mesa</option>
                {mesas.filter(m => m.status === 'livre').map(m => (
                  <option key={m.id} value={m.id}>Mesa {m.numero.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Nome do Cliente</Label>
              <Input value={reservaForm.nome} onChange={e => setReservaForm({ ...reservaForm, nome: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input type="tel" value={reservaForm.telefone} onChange={e => setReservaForm({ ...reservaForm, telefone: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Data da Reserva</Label>
              <Input type="date" value={reservaForm.data} onChange={e => setReservaForm({ ...reservaForm, data: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setReservaModalOpen(false)}>Cancelar</Button>
             <Button onClick={handleSaveReserva} disabled={!selectedMesa || !reservaForm.nome || isSavingReserva}>
               Reservar e Imprimir
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket de Impressao Oculto (Aparece apenas na impressao e quando existe mesa a imprimir) */}
      {printMesa && (
        <div className="hidden print:flex fixed inset-0 z-[99999] bg-white text-black flex-col items-center justify-start py-8 px-4 font-mono text-center">
            <h1 className="text-3xl font-black mb-2 uppercase">Seu Manel</h1>
            <div className="w-[80mm] border-b border-dashed border-black my-4"></div>
            <p className="text-md font-bold mb-1 w-[80mm] leading-snug uppercase">Seja bem vindo ao Seu Manel</p>
            <p className="text-md font-bold mb-2 w-[80mm] leading-snug uppercase">é uma honra receber vocês!</p>
            <p className="text-sm uppercase mb-6">Sinta-se em casa</p>

            <h2 className="text-2xl font-black mb-2 uppercase">MESA {printMesa.numero.toString().padStart(2, '0')}</h2>
            <p className="text-lg uppercase">Reservada para: <span className="font-bold">{printMesa.reserva_nome}</span></p>
            <p className="text-md uppercase mb-8">Dia: {printMesa.reserva_data}</p>

            <div className="my-2 p-2 bg-white rounded-md">
                <QRCodeCanvas 
                  value={`https://paineladminmenubar.vercel.app/menu?t=${printMesa.token}`} 
                  size={200} 
                  level="H" 
                />
            </div>
            <p className="text-sm font-bold uppercase mt-2">Leia para acessar a mesa</p>
        </div>
      )}

   </>
  );
}
