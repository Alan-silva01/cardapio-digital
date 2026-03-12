"use client";

import React, { useState, useCallback, useMemo } from "react";
import { PaymentModal, FormaPagamento } from "@/components/payment-modal";
import {
  Clock,
  User,
  Check,
  DollarSign,
  Ban,
  CreditCard,
  AlertTriangle,
  Package,
  Receipt,
  Image as ImageIcon,
  Printer,
  BadgeDollarSign,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface ItemPedido {
  id: string;
  quantidade: number;
  nome_produto: string;
  nome_variacao: string | null;
  preco_unitario: number;
  preco_total: number;
  servido: boolean;
  produtos?: any;
}

interface ComandaAgrupada {
  comanda_id: string;
  numero_mesa: number;
  status: "recebido" | "preparando" | "pronto" | "entregue" | "cancelado";
  total: number;
  criado_em: string;
  pedido_ids: string[];
  order_number: string;
  order_id: string;
  forma_pagamento?: FormaPagamento;
  pessoas: {
    nome: string;
    subtotal: number;
    itens: ItemPedido[];
    pago?: boolean;
    cancelado?: boolean;
  }[];
}

interface OrderDetailModalProps {
  comanda: ComandaAgrupada | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleItemServido: (itemId: string, currentValue: boolean) => void;
  onConfirmPayment?: (comandaId: string, forma: FormaPagamento) => void;
  onCancelOrder?: (comandaId: string) => void;
  onReactivateOrder?: (comandaId: string) => void;
  onConfirmPaymentPerson?: (comandaId: string, nomePessoa: string, forma: FormaPagamento) => void;
  onPrintPerson?: (comanda: ComandaAgrupada, nomePessoa: string) => void;
  onPrintAll?: (comanda: ComandaAgrupada) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  recebido: { label: "Recebido", color: "bg-muted text-muted-foreground" },
  preparando: { label: "Preparando", color: "bg-amber-500/10 text-amber-500" },
  pronto: { label: "Servido", color: "bg-emerald-500/10 text-emerald-500" },
  entregue: { label: "Entregue", color: "bg-muted text-muted-foreground" },
  cancelado: { label: "Cancelado", color: "bg-red-500/10 text-red-500" },
};

function formatElapsedTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return `${hours}h${mins > 0 ? ` ${mins}min` : ""}`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ItemCheckbox({
  item,
  comandaStatus,
  onToggle,
}: {
  item: ItemPedido;
  comandaStatus: string;
  onToggle: (itemId: string, currentValue: boolean) => void;
}) {
  const isServed = item.servido || comandaStatus === "pronto" || comandaStatus === "entregue";
  const canToggle = comandaStatus !== "entregue";

  const handleClick = useCallback(() => {
    if (canToggle) {
      onToggle(item.id, item.servido);
    }
  }, [canToggle, onToggle, item.id, item.servido]);

  return (
    <div className="flex items-center w-full group/item">
      <div className="flex items-center gap-3 flex-1 py-2.5 px-3 rounded-lg">
        <button
          type="button"
          className={`h-[18px] w-[18px] shrink-0 rounded border-[1.5px] flex items-center justify-center transition-all duration-300 ${
            isServed
              ? "bg-emerald-400 border-emerald-400"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          } ${canToggle ? "cursor-pointer" : "cursor-default"}`}
          onClick={handleClick}
        >
          {isServed && (
            <Check className="h-3 w-3 text-background animate-in zoom-in-50 duration-200" />
          )}
        </button>
        <div className="flex-1 flex justify-between items-start text-[13px] leading-relaxed text-foreground select-none min-w-0 pr-2">
          <span className="truncate pr-2 border-b border-transparent border-dashed">
            <span className="font-medium">{item.quantidade}x</span>{" "}
            {item.nome_produto}
            {(item.nome_variacao && item.nome_variacao.toLowerCase() !== 'unidade') && (
              <span className="text-muted-foreground/70 ml-1">
                ({item.nome_variacao})
              </span>
            )}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground shrink-0 pt-[2px]">
            R$ {Number(item.preco_total).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Render Image Icon if imageUrl exists */}
      {(() => {
        const imageUrl = Array.isArray(item.produtos)
          ? item.produtos[0]?.imagem_url
          : item.produtos?.imagem_url;

        if (!imageUrl) return null;

        return (
          <HoverCard>
            <HoverCardTrigger className="p-2 mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50 focus:outline-hidden cursor-pointer">
              <ImageIcon className="h-4 w-4" />
            </HoverCardTrigger>
            <HoverCardContent side="top" className="w-auto p-1.5 border-border/50 bg-background/95 backdrop-blur-xs">
              <div className="rounded-md overflow-hidden bg-muted/50 flex items-center justify-center">
                <img 
                  src={imageUrl} 
                  alt={item.nome_produto}
                  className="w-[160px] h-[192px] object-cover rounded-md block"
                  loading="lazy"
                />
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })()}
    </div>
  );
}

const MemoizedItemCheckbox = React.memo(ItemCheckbox);

function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  icon: Icon,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  icon: React.ElementType;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                confirmVariant === "destructive"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-brand/10 text-brand"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button
            variant={confirmVariant === "destructive" ? "destructive" : "default"}
            className={
              confirmVariant !== "destructive"
                ? "bg-brand hover:bg-brand/90 text-white"
                : ""
            }
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const OrderDetailModal = React.memo(function OrderDetailModal({
  comanda,
  open,
  onOpenChange,
  onToggleItemServido,
  onConfirmPayment,
  onCancelOrder,
  onReactivateOrder,
  onConfirmPaymentPerson,
  onPrintPerson,
  onPrintAll,
}: OrderDetailModalProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [personPayConfirm, setPersonPayConfirm] = useState<string | null>(null);

  const totalItems = useMemo(() => {
    if (!comanda) return 0;
    return comanda.pessoas.reduce(
      (sum, p) => sum + p.itens.reduce((s, item) => s + item.quantidade, 0),
      0
    );
  }, [comanda]);

  const allItems = useMemo(() => {
    if (!comanda) return [];
    return comanda.pessoas.flatMap((p) => p.itens);
  }, [comanda]);

  const servedCount = useMemo(() => {
    if (!comanda) return 0;
    return allItems.filter(
      (item) => item.servido || comanda.status === "pronto" || comanda.status === "entregue"
    ).length;
  }, [comanda, allItems]);

  const totalPendente = useMemo(() => {
    if (!comanda) return 0;
    const hasPagamentoTotal = !!comanda.forma_pagamento;
    if (hasPagamentoTotal) return 0;
    return comanda.total - comanda.pessoas.filter(p => p.pago).reduce((sum, p) => sum + p.subtotal, 0);
  }, [comanda]);

  const allPaid = useMemo(() => {
    if (!comanda) return false;
    return comanda.pessoas.length > 0 && comanda.pessoas.every((p) => p.pago);
  }, [comanda]);

  if (!comanda) return null;

  const statusConfig = STATUS_CONFIG[comanda.status] || STATUS_CONFIG.cancelado;
  const elapsed = formatElapsedTime(comanda.criado_em);
  const time = formatTime(comanda.criado_em);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden" showCloseButton={false}>
          {/* Header */}
          <div className="px-6 pt-5 pb-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Receipt className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-bold tracking-tight">
                    Pedido: {comanda.order_number} — Mesa {String(comanda.numero_mesa).padStart(2, "0")}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-1.5 text-xs mt-0.5">
                    <Clock className="h-3 w-3" />
                    {elapsed}
                    <span className="text-muted-foreground/30">·</span>
                    {time}
                    <span className="text-muted-foreground/30">·</span>
                    {comanda.pessoas.length} {comanda.pessoas.length === 1 ? "comanda" : "comandas"}
                  </DialogDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`${statusConfig.color} border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0`}
              >
                {statusConfig.label}
              </Badge>
            </div>

            {/* Info row */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                <Package className="h-3 w-3" />
                {totalItems} itens
              </div>
              <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                <Check className="h-3 w-3" />
                {servedCount}/{allItems.length} prontos
              </div>
              <div className="ml-auto font-mono text-sm font-bold text-foreground">
                R$ {Number(comanda.total).toFixed(2)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Body — Items grouped by person */}
          <ScrollArea className="max-h-[60vh]">
            <div className="px-6 py-4 divide-y divide-border">
              {comanda.pessoas.map((pessoa) => (
                <div key={pessoa.nome} className="relative py-4 first:pt-0 last:pb-0">
                  {pessoa.pago || pessoa.cancelado ? (
                    /* ── PAID OR CANCELED STATE: blur + overlay ── */
                    <div className="relative">
                      <div className={`blur-[2px] opacity-40 pointer-events-none space-y-1 ${pessoa.cancelado ? 'grayscale' : ''}`}>
                        <div className="flex items-center justify-between mb-1 px-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-foreground" />
                            <span className="text-sm font-bold text-foreground">{pessoa.nome}</span>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            R$ {pessoa.subtotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          {pessoa.itens.slice(0, 2).map((item) => (
                            <div key={item.id} className="py-2.5 px-3 text-[13px]"> 
                              {item.quantidade}x {item.nome_produto}
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className={`flex items-center gap-1.5 ${pessoa.cancelado ? "text-red-500" : "text-emerald-500"}`}>
                          {pessoa.cancelado ? <Ban className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                          <span className="text-sm font-bold">
                            {pessoa.cancelado ? "Comanda Cancelada" : "Comanda Fechada — Pago"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
                        >
                          <Eye className="h-3 w-3" />
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── NORMAL STATE ── */
                    <div className="space-y-1">
                      {/* Person name + action buttons */}
                      <div className="flex items-center justify-between mb-1 px-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-foreground" />
                          <span className="text-sm font-bold text-foreground">
                            {pessoa.nome}
                          </span>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {pessoa.itens.reduce((sum, i) => sum + i.quantidade, 0)} itens
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Per-person Print */}
                          <button
                            type="button"
                            className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors"
                            title={`Imprimir comanda de ${pessoa.nome}`}
                            onClick={() => onPrintPerson?.(comanda, pessoa.nome)}
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>
                          {/* Per-person Pay */}
                          <button
                            type="button"
                            className="p-1.5 rounded-md text-muted-foreground/50 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                            title={`Confirmar pagamento de ${pessoa.nome}`}
                            onClick={() => setPersonPayConfirm(pessoa.nome)}
                          >
                            <BadgeDollarSign className="h-3.5 w-3.5" />
                          </button>
                          {/* Subtotal */}
                          <span className="text-xs text-muted-foreground font-mono ml-1">
                            R$ {pessoa.subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-0.5">
                        {pessoa.itens.map((item) => (
                          <MemoizedItemCheckbox
                            key={item.id}
                            item={item}
                            comandaStatus={comanda.status}
                            onToggle={onToggleItemServido}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          {/* Footer */}
          <div className="px-6 pt-3 pb-8 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {comanda.status === "cancelado" ? (
                <Button
                  variant="outline"
                  className="flex-1 h-9 text-xs font-semibold hover:text-foreground"
                  onClick={() => onReactivateOrder?.(comanda.comanda_id)}
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Reativar Pedido
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="h-9 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5"
                    onClick={() => setShowCancelConfirm(true)}
                  >
                    <Ban className="h-3.5 w-3.5 mr-1.5" />
                    Cancelar
                  </Button>
                  <Button
                    variant="outline"
                    className="h-9 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    onClick={() => onPrintAll?.(comanda)}
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    Imprimir
                  </Button>
                  <Button
                    className="flex-1 h-9 text-xs bg-brand hover:bg-brand/90 text-white font-semibold"
                    onClick={() => setShowPaymentModal(true)}
                    disabled={allPaid || totalPendente <= 0}
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                    {allPaid || totalPendente <= 0 
                      ? "Totalmente Pago" 
                      : `Cobrar Restante (R$ ${totalPendente.toFixed(2)})`}
                  </Button>
                </>
              )}
            </div>
            <div className="text-[10px] text-center text-muted-foreground/60 w-full flex items-center justify-center gap-1.5 select-all">
              ID: {comanda.order_id}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment modal — whole order (or remaining) */}
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        total={totalPendente > 0 ? totalPendente : comanda.total}
        label={`Mesa ${String(comanda.numero_mesa).padStart(2, "0")} · Pedido ${comanda.order_number}`}
        onConfirm={(forma) => onConfirmPayment?.(comanda.comanda_id, forma)}
      />

      <ConfirmationDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Cancelar Pedido"
        description={`Tem certeza que deseja cancelar o pedido da Mesa ${String(comanda.numero_mesa).padStart(2, "0")}? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, Cancelar"
        confirmVariant="destructive"
        icon={AlertTriangle}
        onConfirm={() => onCancelOrder?.(comanda.comanda_id)}
      />

      {/* Per-person payment modal */}
      {personPayConfirm && (() => {
        const pessoa = comanda.pessoas.find((p) => p.nome === personPayConfirm);
        if (!pessoa) return null;
        return (
          <PaymentModal
            open={!!personPayConfirm}
            onOpenChange={(open) => { if (!open) setPersonPayConfirm(null); }}
            total={pessoa.subtotal}
            label={`${personPayConfirm} · Mesa ${String(comanda.numero_mesa).padStart(2, "0")}`}
            onConfirm={(forma) => {
              onConfirmPaymentPerson?.(comanda.comanda_id, personPayConfirm, forma);
              setPersonPayConfirm(null);
            }}
          />
        );
      })()}
    </>
  );
});
