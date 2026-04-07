const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/(dashboard)/mesas/page.tsx');
let code = fs.readFileSync(file, 'utf8');

// Add imports
code = code.replace('import { Button } from "@/components/ui/button";', `import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";`);

// Update MesaStats
code = code.replace(
  'status: "livre" | "ocupada" | "reservada" | "chamando";',
  'status: "livre" | "ocupada" | "reservada" | "chamando";\n  reserva_ativa?: boolean;\n  reserva_nome?: string;\n  reserva_data?: string;\n  token?: string;'
);

// Add states
const stateIndex = code.indexOf('const [search, setSearch] = useState("");');
const injectStates = `const [search, setSearch] = useState("");
  const [reservaModalOpen, setReservaModalOpen] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<MesaStats | null>(null);
  const [reservaForm, setReservaForm] = useState({ nome: "", telefone: "", data: "" });
  const [printMesa, setPrintMesa] = useState<MesaStats | null>(null);
  const [isSavingReserva, setIsSavingReserva] = useState(false);`;
code = code.replace('const [search, setSearch] = useState("");', injectStates);

// Update status calculation
code = code.replace(
`let status: MesaStats['status'] = 'livre';`,
`let status: MesaStats['status'] = mesa.reserva_ativa ? 'reservada' : 'livre';`
);

const returnObj = `        return {
          id: mesa.id,
          numero: mesa.numero,
          capacidade: mesa.capacidade || 4,
          status,
          chamandoLabel,
          ocupantes: tablePedidos.length > 0 ? ocupantes : undefined,
          total: tablePedidos.length > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalVal) : undefined,
          tempo,
          reserva_ativa: mesa.reserva_ativa,
          reserva_nome: mesa.reserva_nome,
          reserva_data: mesa.reserva_data,
          token: mesa.token,
        };`;
code = code.replace(/return \{\s*id: mesa\.id,[\s\S]*?tempo,\s*\};/, returnObj);

// Functions for Reserva
const functionsCode = `
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
      if (parts.length === 3) dateStr = \`\${parts[2]}-\${parts[1]}-\${parts[0]}\`;
    }

    const { error } = await supabase.from('mesas').update({
      reserva_ativa: true,
      reserva_nome: reservaForm.nome,
      reserva_telefone: reservaForm.telefone,
      reserva_data: dateStr,
    }).eq('id', selectedMesa.id);
    
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
`;
code = code.replace('const clearChamado = async', functionsCode + '\n  const clearChamado = async');

// Update Nova Reserva Button
code = code.replace(
  '<Button className="bg-[#ff5e1e] hover:bg-[#e54e15] text-white h-9 text-xs font-bold shadow-none">',
  '<Button onClick={() => handleOpenReserva()} className="bg-[#ff5e1e] hover:bg-[#e54e15] text-white h-9 text-xs font-bold shadow-none print:hidden">'
);

// Make sure other buttons are hidden in print
code = code.replace('flex-1 flex flex-col bg-background text-foreground min-h-screen', 'flex-1 flex flex-col bg-background text-foreground min-h-screen print:bg-white');
code = code.replace('h-14 border-b px-6 flex items-center justify-between', 'h-14 border-b px-6 flex items-center justify-between print:hidden');
code = code.replace('p-6 border-b border-border/50 flex items-center justify-between gap-4', 'p-6 border-b border-border/50 flex items-center justify-between gap-4 print:hidden');

const cardReplacement = `
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
`;
code = code.replace('                  <div className="flex-1">\n                    {mesa.ocupantes ? (', cardReplacement);

// Print style
const modalsCode = `
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
                  value={\`https://paineladminmenubar.vercel.app/menu?t=\${printMesa.token}\`} 
                  size={200} 
                  level="H" 
                />
            </div>
            <p className="text-sm font-bold uppercase mt-2">Leia para acessar a mesa</p>
        </div>
      )}
`;

code = code.replace('return (\n    <div className="flex-1', 'return (\n    <>\n    <div className="flex-1 print:hidden"');
code = code.replace('</div>\n  );\n}\n', '</div>\n   ' + modalsCode + '\n   </>\n  );\n}\n');

fs.writeFileSync(file, code);
console.log('Script updated successfully!');
