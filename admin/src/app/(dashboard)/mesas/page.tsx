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
  CheckCircle2,
  Trash2
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    
    // Limit to 11 digits
    if (value.length > 11) value = value.slice(0, 11);

    // Apply Mask: (99) 99999-9999 or (99) 9999-9999
    if (value.length > 10) {
      // 11 digits: (99) 99999-9999
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (value.length > 6) {
      // (99) 9999-9999
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (value.length > 2) {
      // (99) 9999
      value = value.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    } else if (value.length > 0) {
      // (99
      value = value.replace(/^(\d{0,2}).*/, "($1");
    }

    setReservaForm({ ...reservaForm, telefone: value });
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

  const handleCancelarReserva = async (e: React.MouseEvent, mesaId: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja cancelar esta reserva?")) return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('mesas').update({
      reserva_ativa: false,
      reserva_nome: null,
      reserva_telefone: null,
      reserva_data: null
    } as any).eq('id', mesaId);
    
    if (!error) {
      fetchMesasData();
    }
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
                      <div className="flex flex-col gap-3 h-full">
                        <div className="flex flex-col gap-1 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                          <p className="text-[10px] font-bold text-amber-600/60 uppercase tracking-tight">Reservada para</p>
                          <h3 className="text-sm font-bold text-amber-700 leading-tight truncate">
                            {mesa.reserva_nome}
                          </h3>
                          <p className="text-[11px] font-medium text-amber-600/80 mt-1 flex items-center gap-1.5">
                            <Timer className="h-3 w-3" />
                            {mesa.reserva_data
                              ? mesa.reserva_data.includes('T')
                                ? new Date(mesa.reserva_data).toLocaleDateString('pt-BR')
                                : (() => {
                                    // Stored as DD-MM-AAAA → display as DD/MM/AAAA
                                    const parts = mesa.reserva_data!.split('-');
                                    if (parts.length === 3 && parts[0].length === 2) {
                                      return `${parts[0]}/${parts[1]}/${parts[2]}`;
                                    }
                                    // Stored as AAAA-MM-DD → format to DD/MM/AAAA
                                    if (parts.length === 3 && parts[0].length === 4) {
                                      return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                    }
                                    return mesa.reserva_data;
                                  })()
                              : '—'}
                          </p>
                        </div>
                        <div className="mt-auto pt-2 flex flex-col gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => handlePrintReserva(e, mesa)} 
                              className="h-9 gap-2 w-full text-xs font-bold border-amber-500/20 text-amber-700 hover:bg-amber-500/10 hover:text-amber-700 transition-all rounded-xl shadow-none"
                            >
                                <Printer className="h-3.5 w-3.5" /> Re-imprimir Ticket
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => handleCancelarReserva(e, mesa.id as string)} 
                              className="h-9 gap-2 w-full text-xs font-bold text-red-500/70 hover:bg-red-500/10 hover:text-red-600 transition-all rounded-xl shadow-none"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Cancelar Reserva
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
              <Input 
                type="tel" 
                value={reservaForm.telefone} 
                onChange={handlePhoneChange} 
              />
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

      {/* Ticket de Impressão — layout otimizado para 80mm térmico */}
      {printMesa && (
        <div
          className="hidden print:block fixed inset-0 z-[99999] bg-white text-black"
          style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "11px", padding: "0", margin: "0" }}
        >
          <div style={{ width: "72mm", margin: "0 auto", paddingTop: "6mm", textAlign: "center" }}>
            {/* Logo */}
            <img
              src="https://res.cloudinary.com/dvhkcemd0/image/upload/v1773870490/migrated/csxl9gvgqpm5vqj8ww5w.png"
              alt="Seu Manel"
              style={{ maxWidth: "35mm", height: "auto", filter: "grayscale(100%) brightness(0)", margin: "0 auto 4mm" }}
            />

            {/* Divisor */}
            <div style={{ borderBottom: "1px dashed #000", margin: "4mm 0" }} />

            {/* Saudação */}
            <p style={{ fontWeight: "bold", fontSize: "11px", textTransform: "uppercase", margin: "2mm 0 1mm" }}>
              Seja bem vindo ao Seu Manel!
            </p>
            <p style={{ fontWeight: "bold", fontSize: "11px", textTransform: "uppercase", margin: "0 0 1mm" }}>
              É uma honra receber vocês!
            </p>
            <p style={{ fontSize: "10px", textTransform: "uppercase", margin: "0 0 4mm" }}>
              Sinta-se em casa
            </p>

            {/* Divisor */}
            <div style={{ borderBottom: "1px dashed #000", margin: "4mm 0" }} />

            {/* Mesa e Reserva */}
            <p style={{ fontSize: "16px", fontWeight: "900", textTransform: "uppercase", margin: "3mm 0 2mm", letterSpacing: "2px" }}>
              MESA {printMesa.numero.toString().padStart(2, "0")}
            </p>
            <p style={{ fontSize: "11px", textTransform: "uppercase", margin: "1mm 0" }}>
              Reservada para: <strong>{printMesa.reserva_nome}</strong>
            </p>
            <p style={{ fontSize: "10px", textTransform: "uppercase", margin: "1mm 0 4mm" }}>
              Data: {printMesa.reserva_data}
            </p>

            {/* Divisor */}
            <div style={{ borderBottom: "1px dashed #000", margin: "4mm 0" }} />

            {/* QR Code — 120px é suficiente para 80mm */}
            <div style={{ display: "flex", justifyContent: "center", margin: "3mm 0 2mm" }}>
              <QRCodeCanvas
                value={`https://paineladminmenubar.vercel.app/menu?t=${printMesa.token}`}
                size={120}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            <p style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", margin: "1mm 0 6mm" }}>
              Leia o QR Code para acessar a mesa
            </p>
          </div>
        </div>
      )}

   </>
  );
}
