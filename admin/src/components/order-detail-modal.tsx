"use client";

import React, { useState, useCallback, useMemo } from "react";
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

interface ItemPedido {
  id: string;
  quantidade: number;
  nome_produto: string;
  nome_variacao: string | null;
  servido: boolean;
}

interface ComandaAgrupada {
  comanda_id: string;
  numero_mesa: number;
  status: "recebido" | "preparando" | "pronto" | "entregue";
  total: number;
  criado_em: string;
  pedido_ids: string[];
  numero_pedido: number;
  pessoas: {
    nome: string;
    subtotal: number;
    itens: ItemPedido[];
  }[];
}

interface OrderDetailModalProps {
  comanda: ComandaAgrupada | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleItemServido: (itemId: string, currentValue: boolean) => void;
  onConfirmPayment?: (comandaId: string) => void;
  onCancelOrder?: (comandaId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  recebido: { label: "Recebido", color: "bg-muted text-muted-foreground" },
  preparando: { label: "Preparando", color: "bg-amber-500/10 text-amber-500" },
  pronto: { label: "Servido", color: "bg-emerald-500/10 text-emerald-500" },
  entregue: { label: "Entregue", color: "bg-muted text-muted-foreground" },
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
    <button
      type="button"
      className={`flex items-center gap-3 w-full text-left py-2.5 px-3 rounded-lg transition-all duration-200 group/item ${
        canToggle ? "hover:bg-muted/50 cursor-pointer" : "cursor-default"
      }`}
      onClick={handleClick}
    >
      <div
        className={`h-[18px] w-[18px] shrink-0 rounded border-[1.5px] flex items-center justify-center transition-all duration-300 ${
          isServed
            ? "bg-emerald-500 border-emerald-500"
            : "border-muted-foreground/25 group-hover/item:border-muted-foreground/50"
        }`}
      >
        {isServed && (
          <Check className="h-3 w-3 text-white animate-in zoom-in-50 duration-200" />
        )}
      </div>
      <span
        className={`text-[13px] leading-relaxed transition-colors duration-200 ${
          isServed
            ? "text-emerald-600 dark:text-emerald-400 font-medium"
            : "text-foreground"
        }`}
      >
        <span className="font-medium">{item.quantidade}x</span>{" "}
        {item.nome_produto}
        {item.nome_variacao && (
          <span className="text-muted-foreground/70 ml-1">
            ({item.nome_variacao})
          </span>
        )}
      </span>
    </button>
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
}: OrderDetailModalProps) {
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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

  if (!comanda) return null;

  const statusConfig = STATUS_CONFIG[comanda.status];
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
                    Pedido {String(comanda.numero_pedido).padStart(2, "0")} — Mesa {String(comanda.numero_mesa).padStart(2, "0")}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-1.5 text-xs mt-0.5">
                    <Clock className="h-3 w-3" />
                    {elapsed}
                    <span className="text-muted-foreground/30">·</span>
                    {time}
                    <span className="text-muted-foreground/30">·</span>
                    {comanda.pessoas.length} {comanda.pessoas.length === 1 ? "pessoa" : "pessoas"}
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
                <div key={pessoa.nome} className="space-y-1 py-4 first:pt-0 last:pb-0">
                  {/* Person name */}
                  <div className="flex items-center justify-between mb-1 px-1">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-brand" />
                      <span className="text-sm font-semibold text-brand">
                        {pessoa.nome}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {pessoa.itens.reduce((sum, i) => sum + i.quantidade, 0)} itens
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      R$ {pessoa.subtotal.toFixed(2)}
                    </span>
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
              ))}
            </div>
          </ScrollArea>

          <Separator />

          {/* Footer */}
          <div className="px-6 py-3 flex items-center gap-3">
            <Button
              variant="outline"
              className="flex-1 h-9 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5"
              onClick={() => setShowCancelConfirm(true)}
            >
              <Ban className="h-3.5 w-3.5 mr-1.5" />
              Cancelar Pedido
            </Button>
            <Button
              className="flex-1 h-9 text-xs bg-brand hover:bg-brand/90 text-white font-semibold"
              onClick={() => setShowPaymentConfirm(true)}
            >
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Confirmar Pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={showPaymentConfirm}
        onOpenChange={setShowPaymentConfirm}
        title="Confirmar Pagamento"
        description={`Deseja confirmar o pagamento de R$ ${Number(comanda.total).toFixed(2)} da Mesa ${String(comanda.numero_mesa).padStart(2, "0")}?`}
        confirmLabel="Sim, Confirmar"
        icon={CreditCard}
        onConfirm={() => onConfirmPayment?.(comanda.comanda_id)}
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
    </>
  );
});
