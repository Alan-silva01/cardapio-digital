"use client";

import React, { useState, useCallback, useMemo } from "react";
import { PaymentModal, FormaPagamento } from "@/components/payment-modal";
import {
  Clock,
  User,
  Check,
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
  Ticket,
  Trash2,
  PlusCircle,
  Plus,
  ArrowRightLeft,
  Pencil,
  Minus,
  HandCoins,
  X,
  Save,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AddProductModal } from "./add-product-modal";

interface ItemPedido {
  id: string;
  quantidade: number;
  nome_produto: string;
  nome_variacao: string | null;
  preco_unitario: number;
  preco_total: number;
  servido: boolean;
  observacao?: string | null;
  criado_em?: string;
  produtos?: any;
}

interface Contribuicao {
  id: string;
  nome_pagador: string;
  nome_pessoa_alvo: string;
  valor: number;
  metodo: string;
  criado_em: string;
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
  contribuicoes?: Contribuicao[];
}

interface MesaLivre {
  id: string;
  numero: number;
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
  mesasStatus?: Record<number, { garcom: boolean; conta: boolean }>;
  onClearService?: (mesa: number, type: 'garcom' | 'conta') => void;
  config?: any;
  onAddCouvert?: (comandaId: string, quantidade: number, valorUnitario: number, nomePessoa?: string) => void;
  onRemoveItem?: (itemId: string, comandaId: string) => void;
  onAddProduct?: (
    comandaId: string,
    produtoId: string,
    variacaoId: string | null,
    quantidade: number,
    observacao: string,
    nomePessoa: string
  ) => Promise<void>;
  mesasLivres?: MesaLivre[];
  onTransferirMesa?: (comandaId: string, mesaOrigemId: string, mesaDestinoId: string, novaMesaNumero: number) => Promise<void>;
  mesaOrigemId?: string;
  onEditItem?: (itemId: string, novaQuantidade: number, observacao: string) => Promise<void>;
  onRegistrarContribuicao?: (comandaId: string, nomePessoaAlvo: string, nomePagador: string, valor: number, metodo: string) => Promise<void>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon?: any }> = {
  recebido: { label: "Recebido", color: "bg-orange-500/10 text-orange-600" },
  preparando: { label: "Preparando", color: "bg-brand text-white border-transparent" },
  pronto: { label: "Pronto", color: "bg-emerald-500/10 text-emerald-600" },
  entregue: { label: "Finalizada", color: "bg-emerald-500/10 text-emerald-600" },
  cancelado: { label: "Cancelado", color: "bg-red-500/10 text-red-600" },
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
  onRemove,
  onEdit,
}: {
  item: ItemPedido;
  comandaStatus: string;
  onToggle: (itemId: string, currentValue: boolean) => void;
  onRemove?: (itemId: string) => void;
  onEdit?: (itemId: string, novaQtd: number, obs: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editQtd, setEditQtd] = useState(item.quantidade);
  const [editObs, setEditObs] = useState(item.observacao || "");
  const [editLoading, setEditLoading] = useState(false);

  const isServed = item.servido || comandaStatus === "pronto" || comandaStatus === "entregue";
  const canToggle = comandaStatus !== "entregue";
  const canEdit = comandaStatus !== "entregue" && comandaStatus !== "cancelado";

  const handleClick = useCallback(() => {
    if (canToggle) {
      onToggle(item.id, item.servido);
    }
  }, [canToggle, onToggle, item.id, item.servido]);

  const handleStartEdit = () => {
    setEditQtd(item.quantidade);
    setEditObs(item.observacao || "");
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!onEdit || editQtd < 1) return;
    setEditLoading(true);
    try {
      await onEdit(item.id, editQtd, editObs);
      setEditing(false);
    } finally {
      setEditLoading(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-foreground">
            {item.nome_produto}
            {(item.nome_variacao && item.nome_variacao.toLowerCase() !== 'unidade') && (
              <span className="text-muted-foreground/70 ml-1">({item.nome_variacao})</span>
            )}
          </span>
          <button onClick={() => setEditing(false)} className="p-1 text-muted-foreground hover:text-foreground rounded">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0">
            <button
              type="button"
              onClick={() => setEditQtd(Math.max(1, editQtd - 1))}
              className="h-8 w-8 flex items-center justify-center rounded-l-md bg-muted hover:bg-muted/80 border border-border text-foreground transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <div className="h-8 w-10 flex items-center justify-center border-y border-border bg-background text-sm font-bold">
              {editQtd}
            </div>
            <button
              type="button"
              onClick={() => setEditQtd(editQtd + 1)}
              className="h-8 w-8 flex items-center justify-center rounded-r-md bg-muted hover:bg-muted/80 border border-border text-foreground transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            R$ {(item.preco_unitario * editQtd).toFixed(2)}
          </span>
        </div>
        <Input
          placeholder="Observação (opcional)"
          value={editObs}
          onChange={(e) => setEditObs(e.target.value)}
          className="h-8 text-xs"
        />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 text-[11px] flex-1" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            className="h-7 text-[11px] flex-1 bg-brand hover:bg-brand/90 text-white"
            onClick={handleSaveEdit}
            disabled={editLoading || editQtd < 1}
          >
            {editLoading ? (
              <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <><Save className="h-3 w-3 mr-1" />Salvar</>
            )}
          </Button>
        </div>
      </div>
    );
  }

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
        <div className="flex-1 flex gap-2 justify-between items-start text-[13px] leading-relaxed text-foreground select-none min-w-0 pr-2">
          <span className="truncate flex-1 border-b border-transparent border-dashed break-words whitespace-normal">
            <span className="font-medium">{item.quantidade}x</span>{" "}
            {item.nome_produto}
            {(item.nome_variacao && item.nome_variacao.toLowerCase() !== 'unidade') && (
              <span className="text-muted-foreground/70 ml-1">
                ({item.nome_variacao})
              </span>
            )}
            {item.observacao && (
              <div className="mt-0.5 text-[10px] text-muted-foreground italic font-normal">
                Obs: {item.observacao}
              </div>
            )}
          </span>
          <div className="flex flex-col items-end shrink-0 pt-[2px] min-w-[60px]">
            <span className="font-mono text-[11px] text-muted-foreground">
              R$ {Number(item.preco_total).toFixed(2)}
            </span>
            {item.criado_em && (
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground mt-0.5">
                <Clock className="h-2.5 w-2.5 opacity-70" />
                {formatElapsedTime(item.criado_em)}
              </span>
            )}
          </div>
          {canEdit && onEdit && (
            <button
              onClick={handleStartEdit}
              className="p-1.5 ml-0.5 text-muted-foreground/30 hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
              title="Editar item"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onRemove && canEdit && (
            <button
              onClick={() => onRemove(item.id)}
              className="p-1.5 ml-0.5 text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
              title="Remover item do pedido"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
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
            <div className={confirmVariant === "destructive" ? "text-red-500" : "text-brand"}>
              <Icon className="h-6 w-6" />
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

function CouvertModal({
  open,
  onOpenChange,
  valorCouvert,
  nomePessoa,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  valorCouvert: number;
  nomePessoa?: string;
  onConfirm: (quantidade: number) => void;
}) {
  const [qtd, setQtd] = React.useState<number | "">(1);

  React.useEffect(() => {
    if (open) setQtd(1);
  }, [open]);

  const isPessoaSpecific = !!nomePessoa;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="text-brand">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle>
                {isPessoaSpecific
                  ? `Couvert para ${nomePessoa}`
                  : "Lançar Couvert Artístico"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isPessoaSpecific
                  ? `Quantas pessoas na comanda de ${nomePessoa}?`
                  : "Quantidade de pessoas na mesa"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-2">
          <div className="bg-muted/30 p-4 rounded-xl space-y-3">
            {isPessoaSpecific && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                <span className="bg-brand/10 text-brand px-2 py-0.5 rounded-full font-semibold">{nomePessoa}</span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {isPessoaSpecific ? "Qt. Couvert" : "Pessoas na Mesa"}
              </label>
              <Input 
                type="number" 
                value={qtd} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setQtd("");
                  } else {
                    setQtd(Math.max(1, parseInt(val) || 1));
                  }
                }}
                onFocus={(e) => e.target.select()}
                min={1}
                className="h-10 text-center font-bold text-lg"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between text-sm mt-3 border-t border-border/50 pt-3">
              <span className="text-muted-foreground text-xs">Valor por couvert:</span>
              <span className="font-semibold text-xs">R$ {valorCouvert.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground">Total do Couvert:</span>
              <span className="font-bold text-brand text-base">R$ {(Number(qtd || 0) * valorCouvert).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:space-x-0 mt-2">
          <Button variant="outline" className="h-9 text-xs w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="h-9 text-xs bg-brand hover:bg-brand/90 text-white font-semibold flex-1"
            onClick={() => {
              onConfirm(Number(qtd) || 1);
              onOpenChange(false);
            }}
          >
            {isPessoaSpecific ? `Lançar na Comanda` : "Adicionar à Mesa"}
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
  mesasStatus = {},
  onClearService,
  config,
  onAddCouvert,
  onRemoveItem,
  onAddProduct,
  mesasLivres = [],
  onTransferirMesa,
  mesaOrigemId,
  onEditItem,
  onRegistrarContribuicao,
}: OrderDetailModalProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [personPayConfirm, setPersonPayConfirm] = useState<string | null>(null);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showCouvertPrompt, setShowCouvertPrompt] = useState(false);
  const [couvertFromPrompt, setCouvertFromPrompt] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addPessoaName, setAddPessoaName] = useState<string | undefined>(undefined);
  const [couvertTargetPerson, setCouvertTargetPerson] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedMesaDestino, setSelectedMesaDestino] = useState<string>("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [contribTarget, setContribTarget] = useState<string | null>(null);
  const [contribNome, setContribNome] = useState("");
  const [contribValor, setContribValor] = useState<number | "">(0);
  const [contribMetodo, setContribMetodo] = useState("pix");
  const [contribLoading, setContribLoading] = useState(false);

  const hasCouvert = useMemo(() => {
    if (!comanda) return false;
    return comanda.pessoas.some(p =>
      p.itens.some(i => i.nome_produto.toLowerCase().includes("couvert"))
    );
  }, [comanda]);

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

  // Open payment modal after couvert is added from the prompt flow
  React.useEffect(() => {
    if (couvertFromPrompt && !showCoverModal) {
      setCouvertFromPrompt(false);
      const timer = setTimeout(() => setShowPaymentModal(true), 150);
      return () => clearTimeout(timer);
    }
  }, [couvertFromPrompt, showCoverModal]);

  // Clean up states when modal closes
  React.useEffect(() => {
    if (!open) {
      setShowCouvertPrompt(false);
      setCouvertFromPrompt(false);
    }
  }, [open]);

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
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-base font-bold tracking-tight">
                        Pedido: {comanda.order_number} — Mesa {String(comanda.numero_mesa).padStart(2, "0")}
                      </DialogTitle>
                    </div>
                    {(mesasStatus[comanda.numero_mesa]?.garcom || mesasStatus[comanda.numero_mesa]?.conta) && 
                      comanda.status !== "entregue" && 
                      comanda.status !== "cancelado" && (
                      <div className="flex items-center gap-2">
                        {mesasStatus[comanda.numero_mesa]?.garcom && (
                          <Badge 
                            variant="destructive"
                            onClick={(e) => { e.stopPropagation(); onClearService?.(comanda.numero_mesa, 'garcom'); }}
                            className="inline-flex cursor-pointer items-center justify-center gap-1.5 px-2.5 py-0.5 text-[9px] font-semibold text-white bg-brand hover:bg-brand/90 border-transparent uppercase tracking-wider transition-colors whitespace-nowrap shadow-sm"
                            title="Desmarcar alerta de Garçom"
                          >
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                            </span>
                            Chamando Garçom
                          </Badge>
                        )}
                        {mesasStatus[comanda.numero_mesa]?.conta && (
                          <Badge
                            variant="destructive"
                            onClick={(e) => { e.stopPropagation(); onClearService?.(comanda.numero_mesa, 'conta'); }}
                            className="inline-flex cursor-pointer items-center justify-center gap-1.5 px-2.5 py-0.5 text-[9px] font-semibold text-white bg-brand hover:bg-brand/90 border-transparent uppercase tracking-wider transition-colors whitespace-nowrap shadow-sm"
                            title="Desmarcar alerta de Conta"
                          >
                            <span className="relative flex h-1.5 w-1.5 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                            </span>
                            Fechar Conta
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
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
              {onAddProduct && comanda.status !== "entregue" && comanda.status !== "cancelado" && (
                <button
                  type="button"
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-brand/10 hover:bg-brand/20 border border-brand/20 text-brand transition-colors"
                  title="Adicionar item à mesa"
                  onClick={() => {
                    setAddPessoaName(undefined);
                    setShowAddProduct(true);
                  }}
                >
                  <PlusCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Info row */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                <Package className="h-3 w-3" />
                {totalItems} itens
              </div>
              <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                <Check className="h-3 w-3" />
                {servedCount}/{allItems.length} prontos
              </div>
              {onTransferirMesa && comanda.status !== "entregue" && comanda.status !== "cancelado" && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMesaDestino("");
                    setShowTransferModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 px-2.5 py-1 rounded-md transition-colors font-medium"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  Mudar de Mesa
                </button>
              )}
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
                          {onAddProduct && (
                            <button
                              type="button"
                              onClick={() => {
                                setAddPessoaName(pessoa.nome);
                                setShowAddProduct(true);
                              }}
                              className="h-5 w-5 flex items-center justify-center rounded bg-brand/10 hover:bg-brand/20 text-brand transition-colors ml-1 cursor-pointer shrink-0"
                              title="Adicionar item a esta comanda"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Per-person Couvert */}
                          {config?.couvert_ativo && onAddCouvert && (
                            <button
                              type="button"
                              className="p-1.5 rounded-md text-muted-foreground/50 hover:text-brand hover:bg-brand/10 transition-colors"
                              title={`Adicionar couvert a ${pessoa.nome}`}
                              onClick={() => {
                                setCouvertTargetPerson(pessoa.nome);
                                setShowCoverModal(true);
                              }}
                            >
                              <Ticket className="h-3.5 w-3.5" />
                            </button>
                          )}
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

                      <div className="space-y-0.5">
                        {pessoa.itens.map((item) => (
                          <MemoizedItemCheckbox
                            key={item.id}
                            item={item}
                            comandaStatus={comanda.status}
                            onToggle={onToggleItemServido}
                            onRemove={setItemToRemove}
                            onEdit={onEditItem}
                          />
                        ))}
                      </div>

                      {/* Contribution history for this person */}
                      {(() => {
                        const pessoaContribs = comanda.contribuicoes?.filter(c => c.nome_pessoa_alvo === pessoa.nome) || [];
                        const totalPago = pessoaContribs.reduce((sum, c) => sum + c.valor, 0);
                        const saldo = pessoa.subtotal - totalPago;

                        if (pessoaContribs.length === 0 && !onRegistrarContribuicao) return null;

                        return (
                          <div className="mt-2 px-3">
                            {pessoaContribs.length > 0 && (
                              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5 space-y-1.5 mb-2">
                                <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Pagamentos Recebidos</span>
                                {pessoaContribs.map((c) => (
                                  <div key={c.id} className="flex items-center justify-between text-[11px]">
                                    <span className="text-foreground">
                                      <span className="font-medium">{c.nome_pagador}</span>
                                      <span className="text-muted-foreground ml-1">({c.metodo.toUpperCase()})</span>
                                    </span>
                                    <span className="font-mono text-emerald-500 font-medium">R$ {c.valor.toFixed(2)}</span>
                                  </div>
                                ))}
                                <div className="flex items-center justify-between text-[11px] border-t border-emerald-500/10 pt-1.5 mt-1">
                                  <span className="text-muted-foreground font-medium">Total pago:</span>
                                  <span className="font-mono font-bold text-foreground">R$ {totalPago.toFixed(2)}</span>
                                </div>
                                {saldo > 0.01 && (
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-muted-foreground font-medium">Saldo restante:</span>
                                    <span className="font-mono font-bold text-brand">R$ {saldo.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {onRegistrarContribuicao && saldo > 0.01 && comanda.status !== "entregue" && comanda.status !== "cancelado" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setContribTarget(pessoa.nome);
                                  setContribNome("");
                                  setContribValor("");
                                  setContribMetodo("pix");
                                }}
                                className="flex items-center gap-1.5 text-[11px] text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded-md transition-colors font-medium"
                              >
                                <HandCoins className="h-3 w-3" />
                                Receber Pagamento Parcial
                              </button>
                            )}
                          </div>
                        );
                      })()}
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
                    className="h-9 px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    title="Imprimir"
                    onClick={() => onPrintAll?.(comanda)}
                  >
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                  {config?.couvert_ativo && (
                    <Button
                      variant="outline"
                      className="flex-1 max-w-[125px] h-9 px-2 text-xs font-semibold text-brand border-brand/20 bg-brand/5 hover:bg-brand/10 transition-colors shrink-0"
                      onClick={() => setShowCoverModal(true)}
                    >
                      <Ticket className="h-3.5 w-3.5 mr-1" />
                      Add Couvert
                    </Button>
                  )}
                  <Button
                    className="flex-1 h-9 text-xs bg-brand hover:bg-brand/90 text-white font-semibold min-w-[130px]"
                    onClick={() => {
                      if (config?.couvert_ativo && !hasCouvert) {
                        setShowCouvertPrompt(true);
                      } else {
                        setShowPaymentModal(true);
                      }
                    }}
                    disabled={allPaid || totalPendente <= 0}
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
                    {allPaid || totalPendente <= 0 
                      ? "Totalmente Pago" 
                      : `Cobrar (R$ ${totalPendente.toFixed(2)})`}
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

      <CouvertModal
        open={showCoverModal}
        onOpenChange={(open) => {
          setShowCoverModal(open);
          if (!open) setCouvertTargetPerson(null);
        }}
        valorCouvert={config?.valor_couvert || 10}
        nomePessoa={couvertTargetPerson ?? undefined}
        onConfirm={(qtd) => {
          if (onAddCouvert) {
            onAddCouvert(
              comanda.comanda_id,
              qtd,
              config?.valor_couvert || 10,
              couvertTargetPerson ?? undefined
            );
          }
        }}
      />

      <ConfirmationDialog
        open={!!itemToRemove}
        onOpenChange={(open) => { if (!open) setItemToRemove(null); }}
        title="Remover Item"
        description="Tem certeza que deseja remover este item da comanda? O total da mesa será recalculado."
        confirmLabel="Sim, Remover"
        confirmVariant="destructive"
        icon={Trash2}
        onConfirm={() => {
          if (itemToRemove && onRemoveItem) {
            onRemoveItem(itemToRemove, comanda.comanda_id);
          }
          setItemToRemove(null);
        }}
      />

      {showAddProduct && (
        <AddProductModal
          open={showAddProduct}
          onOpenChange={setShowAddProduct}
          comanda={comanda}
          defaultPessoa={addPessoaName}
          onAdd={async (...args) => {
            if (onAddProduct) {
              await onAddProduct(comanda.comanda_id, ...args);
            }
          }}
        />
      )}

      {/* Couvert prompt — appears before payment when couvert hasn't been added yet */}
      <Dialog open={showCouvertPrompt} onOpenChange={setShowCouvertPrompt}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                <Ticket className="h-4.5 w-4.5 text-brand" />
              </div>
              <div>
                <DialogTitle>Couvert Artístico</DialogTitle>
                <DialogDescription className="mt-1">
                  Deseja adicionar o couvert artístico a essa mesa?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:space-x-0 mt-2">
            <Button
              variant="outline"
              className="h-9 text-xs w-full sm:w-auto"
              onClick={() => {
                setShowCouvertPrompt(false);
                setShowPaymentModal(true);
              }}
            >
              Não, Continuar
            </Button>
            <Button
              className="h-9 text-xs bg-brand hover:bg-brand/90 text-white font-semibold flex-1"
              onClick={() => {
                setShowCouvertPrompt(false);
                setCouvertFromPrompt(true);
                setShowCoverModal(true);
              }}
            >
              <Ticket className="h-3.5 w-3.5 mr-1" />
              Sim, Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer table modal */}
      <Dialog open={showTransferModal} onOpenChange={(open) => {
        if (!open) setSelectedMesaDestino("");
        setShowTransferModal(open);
      }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <ArrowRightLeft className="h-4.5 w-4.5 text-blue-500" />
              </div>
              <div>
                <DialogTitle>Mudar de Mesa</DialogTitle>
                <DialogDescription className="mt-1">
                  Mesa <strong>{String(comanda.numero_mesa).padStart(2, "0")}</strong> → selecione a mesa de destino.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2">
            <div className="bg-muted/30 p-4 rounded-xl space-y-3">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Mesa de Destino
              </label>
              {mesasLivres.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhuma mesa livre disponível.
                </p>
              ) : (
                <Select
                  value={selectedMesaDestino}
                  onValueChange={(v) => setSelectedMesaDestino(v ?? "")}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione uma mesa livre..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mesasLivres.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        Mesa {String(m.numero).padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedMesaDestino && (() => {
                const mesa = mesasLivres.find(m => m.id === selectedMesaDestino);
                return mesa ? (
                  <div className="flex items-center justify-between text-sm border-t border-border/50 pt-3">
                    <span className="text-muted-foreground text-xs">Transferindo:</span>
                    <span className="font-semibold text-xs">
                      Mesa {String(comanda.numero_mesa).padStart(2, "0")} → Mesa {String(mesa.numero).padStart(2, "0")}
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:space-x-0 mt-2">
            <Button
              variant="outline"
              className="h-9 text-xs w-full sm:w-auto"
              onClick={() => setShowTransferModal(false)}
              disabled={transferLoading}
            >
              Cancelar
            </Button>
            <Button
              className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold flex-1"
              disabled={!selectedMesaDestino || transferLoading}
              onClick={async () => {
                if (!selectedMesaDestino || !mesaOrigemId || !onTransferirMesa) return;
                const mesa = mesasLivres.find(m => m.id === selectedMesaDestino);
                if (!mesa) return;
                setTransferLoading(true);
                try {
                  await onTransferirMesa(comanda.comanda_id, mesaOrigemId, selectedMesaDestino, mesa.numero);
                  setShowTransferModal(false);
                  setSelectedMesaDestino("");
                  onOpenChange(false);
                } finally {
                  setTransferLoading(false);
                }
              }}
            >
              {transferLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Transferindo...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Confirmar Transferência
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contribution modal */}
      <Dialog open={!!contribTarget} onOpenChange={(open) => { if (!open) setContribTarget(null); }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <HandCoins className="h-4.5 w-4.5 text-emerald-500" />
              </div>
              <div>
                <DialogTitle>Receber Pagamento Parcial</DialogTitle>
                <DialogDescription className="mt-1">
                  Registrar pagamento parcial na comanda de <strong>{contribTarget}</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2">
            <div className="bg-muted/30 p-4 rounded-xl space-y-3">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Quem está pagando?
                </label>
                <Input
                  placeholder="Nome de quem está pagando..."
                  value={contribNome}
                  onChange={(e) => setContribNome(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Valor (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={contribValor}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') { setContribValor(""); } else { setContribValor(parseFloat(v) || 0); }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="h-9 text-sm font-mono"
                />
                {(() => {
                  const pessoaData = comanda.pessoas.find(p => p.nome === contribTarget);
                  const totalPago = comanda.contribuicoes?.filter(c => c.nome_pessoa_alvo === contribTarget).reduce((s, c) => s + c.valor, 0) || 0;
                  const saldo = (pessoaData?.subtotal || 0) - totalPago;
                  return saldo > 0 ? (
                    <button
                      type="button"
                      className="text-[10px] text-brand hover:underline"
                      onClick={() => setContribValor(saldo)}
                    >
                      Saldo restante: R$ {saldo.toFixed(2)} — clique para preencher
                    </button>
                  ) : null;
                })()}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Método
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["pix", "credito", "debito", "dinheiro"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setContribMetodo(m)}
                      className={`h-8 text-[10px] font-semibold rounded-md border transition-colors ${
                        contribMetodo === m
                          ? "bg-brand/10 border-brand text-brand"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {m === "credito" ? "Crédito" : m === "debito" ? "Débito" : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:space-x-0 mt-2">
            <Button variant="outline" className="h-9 text-xs w-full sm:w-auto" onClick={() => setContribTarget(null)} disabled={contribLoading}>
              Cancelar
            </Button>
            <Button
              className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex-1"
              disabled={!contribNome.trim() || !contribValor || contribValor <= 0 || contribLoading}
              onClick={async () => {
                if (!contribTarget || !onRegistrarContribuicao || !contribValor || contribValor <= 0) return;
                setContribLoading(true);
                try {
                  await onRegistrarContribuicao(comanda.comanda_id, contribTarget, contribNome.trim(), contribValor, contribMetodo);
                  setContribTarget(null);
                } finally {
                  setContribLoading(false);
                }
              }}
            >
              {contribLoading ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Registrando...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <HandCoins className="h-3.5 w-3.5" />
                  Registrar Pagamento
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});
