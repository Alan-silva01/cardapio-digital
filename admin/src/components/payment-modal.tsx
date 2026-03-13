"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  label: string; // e.g. "Mesa 01" or "Alan Silva - Mesa 01"
  onConfirm: (forma: FormaPagamento) => void;
}

export interface FormaPagamento {
  pix: number;
  credito: number;
  debito: number;
  dinheiro: number;
}

const METHODS = [
  { key: "pix" as const, label: "PIX", icon: QrCode },
  { key: "credito" as const, label: "Crédito", icon: CreditCard },
  { key: "debito" as const, label: "Débito", icon: Smartphone },
  { key: "dinheiro" as const, label: "Dinheiro", icon: Banknote },
];

export function PaymentModal({
  open,
  onOpenChange,
  total,
  label,
  onConfirm,
}: PaymentModalProps) {
  const [values, setValues] = useState<FormaPagamento>({
    pix: 0,
    credito: 0,
    debito: 0,
    dinheiro: 0,
  });

  // Reset values when modal opens
  useEffect(() => {
    if (open) {
      setValues({ pix: 0, credito: 0, debito: 0, dinheiro: 0 });
    }
  }, [open]);

  const currentTotal = useMemo(
    () => values.pix + values.credito + values.debito + values.dinheiro,
    [values]
  );

  const remaining = useMemo(() => total - currentTotal, [total, currentTotal]);
  const isValid = useMemo(() => Math.abs(remaining) < 0.01, [remaining]);

  const handleChange = useCallback(
    (key: keyof FormaPagamento, raw: string) => {
      const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
      const num = parseFloat(cleaned) || 0;
      setValues((prev) => ({ ...prev, [key]: num }));
    },
    []
  );

  const handleQuickFill = useCallback(
    (key: keyof FormaPagamento) => {
      // Fill remaining amount into this field
      if (remaining > 0) {
        setValues((prev) => ({
          ...prev,
          [key]: Math.round((prev[key] + remaining) * 100) / 100,
        }));
      }
    },
    [remaining]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3">
          <DialogTitle className="text-base font-bold">
            Forma de Pagamento
          </DialogTitle>
          <DialogDescription className="text-xs">
            {label} · Total:{" "}
            <span className="font-bold text-foreground">
              R$ {total.toFixed(2)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="px-6 py-4 space-y-3">
          {METHODS.map(({ key, label: methodLabel, icon: Icon }) => (
            <div key={key} className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-foreground"
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-foreground w-20 shrink-0">
                {methodLabel}
              </span>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full h-9 rounded-lg border border-border bg-background pl-9 pr-3 text-sm font-mono text-right focus:outline-none focus:ring-1 focus:ring-brand/50 focus:border-brand/50 transition-colors"
                  placeholder="0.00"
                  value={values[key] > 0 ? values[key].toString() : ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              </div>
              {remaining > 0.01 && (
                <button
                  type="button"
                  className="text-[10px] text-muted-foreground hover:text-brand transition-colors px-1.5 py-0.5 rounded border border-border hover:border-brand/30 shrink-0"
                  onClick={() => handleQuickFill(key)}
                  title={currentTotal < 0.01 ? "Preencher total" : "Preencher restante"}
                >
                  {currentTotal < 0.01 ? "Total" : "Resto"}
                </button>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Summary */}
        <div className="px-6 py-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Preenchido</span>
          <span
            className={`font-mono font-bold ${
              isValid
                ? "text-emerald-500"
                : currentTotal > total
                  ? "text-red-500"
                  : "text-foreground"
            }`}
          >
            R$ {currentTotal.toFixed(2)}
            {!isValid && (
              <span className="text-[10px] font-normal text-muted-foreground ml-2">
                {remaining > 0
                  ? `falta R$ ${remaining.toFixed(2)}`
                  : `excede R$ ${Math.abs(remaining).toFixed(2)}`}
              </span>
            )}
            {isValid && (
              <CheckCircle2 className="inline h-3.5 w-3.5 ml-1.5 text-emerald-500" />
            )}
          </span>
        </div>

        <Separator />

        <div className="px-6 pt-3 pb-5 flex flex-col gap-3">
          <div className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="flex-1 h-9 text-xs font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Voltar
            </Button>
            <Button
              className="flex-1 h-9 text-xs bg-brand hover:bg-brand/90 text-white font-semibold shadow-xs"
              disabled={!isValid}
              onClick={() => {
                onConfirm(values);
                onOpenChange(false);
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Confirmar Pagamento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
