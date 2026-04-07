"use client";

import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();

  function handleCreateList() {
    const id = nanoid(10);
    router.push(`/list/${id}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm text-center shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-center mb-3">
            <ShoppingCart className="h-10 w-10 text-slate-600" />
          </div>
          <CardTitle className="text-2xl">Simple Grocery List</CardTitle>
          <CardDescription>
            Crie uma lista compartilhada em tempo real. Basta gerar o link e compartilhar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" size="lg" onClick={handleCreateList}>
            Criar Nova Lista
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
