"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "./theme-toggle";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "pt-BR", label: "Português (BR)", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
];

export default function ConfiguracoesPage() {
  const [lang, setLang] = useState("pt-BR");

  useEffect(() => {
    const saved = localStorage.getItem("app-language");
    if (saved) setLang(saved);
  }, []);

  function handleLanguageChange(code: string) {
    setLang(code);
    localStorage.setItem("app-language", code);
  }

  return (
    <div className="flex-1 w-full space-y-8 p-8 max-w-4xl mx-auto mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configurações Gerais</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Gerencie as preferências e a aparência do painel administrativo.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Appearance Section */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase border-b pb-2">Aparência do Painel</h2>

          <div className="flex items-center justify-between p-5 border rounded-xl bg-card shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Tema da Interface</p>
              <p className="text-[13px] text-muted-foreground font-medium">Personalize a aparência do painel de controle do restaurante.</p>
            </div>
            <ThemeToggle />
          </div>
        </section>

        {/* Language Section */}
        <section className="space-y-4">
          <h2 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase border-b pb-2">Idioma</h2>

          <div className="p-5 border rounded-xl bg-card shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-foreground">Idioma do Painel</p>
                <p className="text-[13px] text-muted-foreground font-medium">Selecione o idioma principal do painel administrativo.</p>
              </div>
            </div>

            <div className="flex gap-3">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${lang === l.code
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                >
                  <span className="text-base">{l.flag}</span>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Other settings stubs for future phases */}
        <section className="space-y-4 opacity-50 cursor-not-allowed">
          <h2 className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase border-b pb-2">Dados do Restaurante <span className="text-[9px] bg-muted px-2 py-0.5 rounded-full ml-2 text-foreground font-semibold">Em Breve</span></h2>
          <div className="flex items-center justify-between p-5 border rounded-xl bg-card">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Informações Básicas</p>
              <p className="text-[13px] text-muted-foreground font-medium">Nome, endereço e dados de contato que aparecem no app principal.</p>
            </div>
            <button disabled className="px-4 py-1.5 text-xs font-medium border rounded-md bg-muted text-muted-foreground">Configurar</button>
          </div>
        </section>
      </div>
    </div>
  );
}
