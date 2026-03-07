import { ThemeToggle } from "./theme-toggle";

export default function ConfiguracoesPage() {
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
