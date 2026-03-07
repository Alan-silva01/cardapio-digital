"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer, Link as LinkIcon, Hash, Download } from "lucide-react";

export default function QRCodesPage() {
  const [baseUrl, setBaseUrl] = useState("https://menu-bar-xi.vercel.app");
  const [tableCount, setTableCount] = useState(20);

  const handlePrint = () => {
    window.print();
  };

  const downloadQR = (tableNumber: number) => {
    const canvas = document.getElementById(`qr-code-${tableNumber}`) as HTMLCanvasElement;
    if (!canvas) return;
    // Get high-res PNG image from the canvas
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QR_Mesa_${tableNumber}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  return (
    <div className="flex-1 w-full p-4 md:p-8 flex flex-col gap-6">
      {/* Configuration Header - Hidden during print */}
      <div className="flex items-center justify-between bg-card p-4 md:p-6 rounded-xl border shadow-sm print:hidden">
        <div>
          <h2 className="text-xl font-bold tracking-tight">QR Codes das Mesas</h2>
          <p className="text-sm text-muted-foreground mt-1">Imprima os QR Codes oficiais das mesas para acesso direto ao Menu Interativo.</p>
        </div>

        <Button onClick={handlePrint} className="h-10 gap-2 shrink-0">
          <Printer size={18} />
          Imprimir / PDF
        </Button>
      </div>

      {/* QR Codes Grid - Optimized for print layout and reduced sizes */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 print:grid-cols-5 print:gap-4 print:p-0">
        {tables.map((tableNumber) => {
          const tableUrl = `${baseUrl}?mesa=${tableNumber}`;
          return (
            <Card key={tableNumber} className="overflow-hidden border-2 shadow-sm break-inside-avoid print:shadow-none print:border-gray-200">
              <CardContent className="p-0 flex flex-col items-center justify-center bg-white aspect-[3/4] relative group">
                <div className="p-4 w-full h-full flex flex-col items-center justify-center -mt-6">
                  {/* High res canvas (size 512) rendered visually smaller */}
                  <QRCodeCanvas
                    id={`qr-code-${tableNumber}`}
                    value={tableUrl}
                    size={512}
                    style={{ height: 'auto', maxWidth: '120px', width: '100%' }}
                    level="H"
                    includeMargin={false}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />

                  {/* Download Action (Visible on hover on desktop, or always on mobile. Hidden on print) */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 h-7 text-xs print:hidden z-10 transition-opacity bg-white/90 text-black hover:bg-gray-100 border-gray-300"
                    onClick={() => downloadQR(tableNumber)}
                  >
                    <Download size={12} className="mr-1" />
                    Baixar PNG
                  </Button>
                </div>

                {/* Overlay Text for Print / Display */}
                <div className="absolute bottom-0 left-0 right-0 bg-black text-white text-center py-2 md:py-3 border-t-2 border-dashed border-gray-600 print:bg-white print:text-black print:border-t print:border-solid print:border-gray-400">
                  <h3 className="font-bold text-base md:text-lg tracking-widest uppercase">
                    Mesa {tableNumber}
                  </h3>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
