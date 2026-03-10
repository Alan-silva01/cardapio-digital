"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Printer, Download, Plus, AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BASE_URL = "https://menu-bar-xi.vercel.app";

interface Mesa {
  id: string;
  numero: number;
  qr_code_url: string | null;
}

export default function QRCodesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<"choice" | "single" | "bulk">("choice");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<number | null>(null);

  // Fetch mesas from Supabase
  const fetchMesas = useCallback(async () => {
    const { data, error } = await supabase
      .from("mesas")
      .select("id, numero, qr_code_url")
      .order("numero", { ascending: true });

    if (error) {
      console.error("Erro ao buscar mesas:", error);
      return;
    }
    if (data) setMesas(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchMesas();
  }, [fetchMesas]);

  const handlePrint = () => window.print();

  const handleOpenDialog = () => {
    setDialogStep("choice");
    setNewTableNumber("");
    setRangeStart("");
    setRangeEnd("");
    setIsDialogOpen(true);
  };

  // Create single mesa in Supabase
  const addTable = async () => {
    const num = parseInt(newTableNumber);
    if (isNaN(num) || mesas.some((m) => m.numero === num)) return;

    setSaving(true);
    const { error } = await supabase.from("mesas").insert({
      id: `mesa-${num}`,
      numero: num,
      qr_code_url: `${BASE_URL}?mesa=${num}`,
    });

    if (error) {
      console.error("Erro ao criar mesa:", error);
    } else {
      await fetchMesas();
    }
    setSaving(false);
    setIsDialogOpen(false);
  };

  // Create range of mesas in Supabase
  const addTableRange = async () => {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);
    if (isNaN(start) || isNaN(end) || start > end) return;

    const existingNumbers = new Set(mesas.map((m) => m.numero));
    const newMesas = [];
    for (let i = start; i <= end; i++) {
      if (!existingNumbers.has(i)) {
        newMesas.push({
          id: `mesa-${i}`,
          numero: i,
          qr_code_url: `${BASE_URL}?mesa=${i}`,
        });
      }
    }

    if (newMesas.length === 0) {
      setIsDialogOpen(false);
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("mesas").insert(newMesas);

    if (error) {
      console.error("Erro ao criar mesas:", error);
    } else {
      await fetchMesas();
    }
    setSaving(false);
    setIsDialogOpen(false);
  };

  const confirmDelete = (tableNumber: number) => {
    setTableToDelete(tableNumber);
    setIsConfirmOpen(true);
  };

  // Delete mesa from Supabase
  const removeTable = async () => {
    if (tableToDelete === null) return;

    setSaving(true);
    const { error } = await supabase
      .from("mesas")
      .delete()
      .eq("numero", tableToDelete);

    if (error) {
      console.error("Erro ao excluir mesa:", error);
      // Padrão de erro de Foreign Key do Postgres (23503) ou mensagem contendo 'comandas'
      if (error.code === '23503' || error.message.includes('comandas')) {
        alert("❌ Esta mesa não pode ser excluída pois possui pedidos ou comandas vinculadas a ela no histórico.");
      } else {
        alert(`Erro ao excluir mesa: ${error.message}`);
      }
    } else {
      await fetchMesas();
    }
    setSaving(false);
    setTableToDelete(null);
    setIsConfirmOpen(false);
  };

  const downloadQR = async (tableNumber: number) => {
    const qrCanvas = document.getElementById(`qr-code-${tableNumber}`) as HTMLCanvasElement;
    if (!qrCanvas) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 60;
    const qrSize = 512;
    const textHeight = 100;
    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + textHeight + padding * 2;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(qrCanvas, padding, padding, qrSize, qrSize);

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.font = "bold 80px sans-serif";
    ctx.fillText(`Mesa ${tableNumber}`, canvas.width / 2, canvas.height - padding - 20);

    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_Mesa_${tableNumber}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 w-full p-4 md:p-8 flex flex-col gap-6">
      {/* Configuration Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-card p-4 md:p-6 rounded-xl border shadow-sm print:hidden gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">QR Codes das Mesas</h2>
          <p className="text-sm text-muted-foreground mt-1">Imprima os QR Codes oficiais das mesas para acesso direto ao Menu Interativo.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Modal */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger
              render={
                <Button onClick={handleOpenDialog} variant="outline" className="h-10 gap-2 font-semibold border-border bg-card hover:bg-muted text-foreground transition-all px-4" />
              }
            >
              <Plus size={18} />
              Nova Mesa
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-xl border border-border shadow-lg">
              <div className="p-6">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-lg font-bold">Adicionar Mesas</DialogTitle>
                  <DialogDescription className="text-sm">
                    Como você deseja gerar os novos QR Codes?
                  </DialogDescription>
                </DialogHeader>

                {dialogStep === "choice" && (
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    <button
                      onClick={() => setDialogStep("single")}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-brand hover:bg-brand/5 transition-all group text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                        <Plus className="h-5 w-5 text-muted-foreground group-hover:text-brand" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Mesa Única</p>
                        <p className="text-xs text-muted-foreground">Adicionar apenas uma mesa específica.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setDialogStep("bulk")}
                      className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-brand hover:bg-brand/5 transition-all group text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-brand/10 transition-colors">
                        <Plus className="h-5 w-5 text-muted-foreground group-hover:text-brand" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Várias Mesas</p>
                        <p className="text-xs text-muted-foreground">Gerar um intervalo de mesas (ex: 1 a 20).</p>
                      </div>
                    </button>
                  </div>
                )}

                {dialogStep === "single" && (
                  <div className="space-y-4 py-2">
                    <div className="grid gap-2">
                      <Label htmlFor="tableNumber" className="text-sm font-medium">Número da Mesa</Label>
                      <Input
                        id="tableNumber"
                        type="number"
                        placeholder="ex: 7"
                        className="h-10 placeholder:opacity-30"
                        value={newTableNumber}
                        onChange={(e) => setNewTableNumber(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTable()}
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {dialogStep === "bulk" && (
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="start" className="text-sm font-medium">Início (De)</Label>
                        <Input
                          id="start"
                          type="number"
                          placeholder="ex: 1"
                          className="h-10 placeholder:opacity-30"
                          value={rangeStart}
                          onChange={(e) => setRangeStart(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="end" className="text-sm font-medium">Fim (Até)</Label>
                        <Input
                          id="end"
                          type="number"
                          placeholder="ex: 20"
                          className="h-10 placeholder:opacity-30"
                          value={rangeEnd}
                          onChange={(e) => setRangeEnd(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {dialogStep !== "choice" && (
                <div className="bg-muted/30 p-4 flex gap-3 border-t">
                  <Button variant="ghost" onClick={() => setDialogStep("choice")} className="flex-1 h-9 text-sm" disabled={saving}>
                    Voltar
                  </Button>
                  <Button
                    onClick={dialogStep === "single" ? addTable : addTableRange}
                    className="flex-1 bg-brand hover:bg-brand/90 text-white h-9 text-sm font-bold"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar"}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Modal */}
          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-xl border border-border shadow-lg">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-2">
                  <AlertTriangle className="h-6 w-6 text-brand shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Excluir Mesa {tableToDelete}?</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Esta ação não poderá ser desfeita.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-muted/30 p-4 flex gap-3 border-t">
                <Button
                  variant="ghost"
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1 h-9 text-sm font-semibold"
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={removeTable}
                  className="flex-1 bg-brand hover:bg-brand/90 text-white h-9 text-sm font-bold shadow-sm"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir Mesa"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handlePrint} className="h-10 gap-2 bg-brand hover:bg-brand/90 text-white font-bold shadow-sm px-4">
            <Printer size={18} />
            Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* QR Codes Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 print:grid-cols-5 print:gap-4 print:p-0">
        {mesas.map((mesa) => {
          const tableUrl = `${BASE_URL}?mesa=${mesa.numero}`;
          return (
            <Card key={mesa.id} className="overflow-hidden border border-border/80 shadow-xs break-inside-avoid print:shadow-none print:border-gray-200 transition-all hover:border-brand/40 hover:shadow-md group">
              <CardContent className="p-0 flex flex-col items-center justify-center bg-card aspect-[3/4.1] relative transition-all duration-300">
                <div className="p-4 w-full h-full flex flex-col items-center justify-center">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm transition-transform group-hover:scale-105 duration-300">
                    <QRCodeCanvas
                      id={`qr-code-${mesa.numero}`}
                      value={tableUrl}
                      size={512}
                      style={{ height: 'auto', maxWidth: '140px', width: '100%' }}
                      level="H"
                      includeMargin={false}
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                    />
                  </div>

                  <div className="mt-4 text-center space-y-0.5">
                    <p className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase opacity-70">Mesa</p>
                    <h3 className="font-bold text-3xl md:text-4xl text-foreground tracking-tight">
                      {mesa.numero}
                    </h3>
                  </div>

                  {/* Actions Stack */}
                  <div className="mt-6 flex flex-col items-center gap-1.5 w-full print:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[11px] font-bold tracking-wider uppercase text-muted-foreground/60 hover:text-brand hover:bg-brand/5 transition-all rounded-lg px-6 border border-transparent hover:border-brand/20"
                      onClick={() => downloadQR(mesa.numero)}
                    >
                      <Download size={14} className="mr-2" />
                      Baixar
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] font-bold tracking-wider uppercase text-brand/40 hover:text-brand hover:bg-brand/5 transition-all rounded-lg px-4"
                      onClick={() => confirmDelete(mesa.numero)}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
