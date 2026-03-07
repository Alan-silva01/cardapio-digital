import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hammer } from "lucide-react";

export default function PlaceholderPage() {
  return (
    <div className="flex-1 w-full p-8 flex items-center justify-center">
      <Card className="max-w-md w-full text-center shadow-none rounded-md border-dashed">
        <CardHeader>
          <div className="mx-auto bg-muted w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Hammer className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta tela faz parte da Fase 2 do projeto e será desenvolvida em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
