"use client";

import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { ArrowRight, CheckCircle2, Link2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();

  function handleCreateList() {
    const id = nanoid(10);
    router.push(`/list/${id}`);
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_58%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <Card className="w-full overflow-hidden rounded-3xl border-white/60 bg-white/72 shadow-[0_20px_70px_rgba(75,85,99,0.14)] backdrop-blur-xl">
          <CardHeader className="space-y-5 px-6 pt-7 pb-4 text-left">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                <ShoppingCart className="h-3.5 w-3.5 text-indigo-500" />
                one-go shared list
              </div>
              <div className="rounded-full bg-slate-900/4 p-2 text-slate-500">
                <Link2 className="h-4 w-4" />
              </div>
            </div>
            <div className="space-y-3">
              <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
                Crie uma lista e compartilhe em segundos.
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-600">
                Um link, uma lista, atualização em tempo real. Feito para compras rápidas no celular, sem login e sem atrito.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6">
            <div className="grid gap-3 rounded-[2rem] border border-white/70 bg-white/65 p-4 shadow-sm">
              <div className="flex items-start gap-3 rounded-2xl bg-slate-50/80 px-3 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-indigo-500" />
                <p className="text-sm leading-6 text-slate-600">
                  Compartilhe o link e veja os itens sendo marcados instantaneamente em qualquer dispositivo.
                </p>
              </div>
              <Button
                className="h-12 rounded-2xl bg-slate-900 text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] hover:bg-slate-800"
                size="lg"
                onClick={handleCreateList}
              >
                Criar Nova Lista
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">
              <span>mobile-first</span>
              <span>tempo real</span>
              <span>sem autenticação</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
