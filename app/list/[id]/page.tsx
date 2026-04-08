"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue, push, update, remove } from "firebase/database";
import { nanoid } from "nanoid";
import { CheckCircle2, ChevronDown, ChevronRight, ClipboardCopy, Link2, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  createdAt: number;
}

const VALID_LIST_ID = /^[a-zA-Z0-9_-]{6,32}$/;

export default function ListPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;
  const listId = VALID_LIST_ID.test(rawId) ? rawId : null;

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDiscardingList, setIsDiscardingList] = useState(false);
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Guard: invalid list ID → redirect home
  useEffect(() => {
    if (!listId) router.replace("/");
  }, [listId, router]);

  useEffect(() => {
    if (!isConfirmOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsConfirmOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmOpen]);

  // Real-time sync from Firebase
  useEffect(() => {
    if (!listId) return;
    const itemsRef = ref(db, `lists/${listId}/items`);
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setItems([]);
        return;
      }
      const parsed: GroceryItem[] = Object.entries(data).map(([id, val]) => ({
        id,
        ...(val as Omit<GroceryItem, "id">),
      }));
      // Sort: unchecked first (by createdAt asc), checked last (by createdAt asc)
      parsed.sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return a.createdAt - b.createdAt;
      });
      setItems(parsed);
    });
    return () => unsubscribe();
  }, [listId]);

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    const name = inputValue.trim().slice(0, 200);
    if (!name || !listId) return;

    const optimisticId = nanoid();
    const newItem: GroceryItem = {
      id: optimisticId,
      name,
      checked: false,
      createdAt: Date.now(),
    };

    // Optimistic update
    setItems((prev) => {
      const updated = [...prev, newItem];
      updated.sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return a.createdAt - b.createdAt;
      });
      return updated;
    });
    setInputValue("");
    inputRef.current?.focus();

    // Persist to Firebase
    push(ref(db, `lists/${listId}/items`), {
      name: newItem.name,
      checked: false,
      createdAt: newItem.createdAt,
    });
  }

  function handleToggleItem(item: GroceryItem) {
    const newChecked = !item.checked;

    // Optimistic update
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.id === item.id ? { ...i, checked: newChecked } : i
      );
      updated.sort((a, b) => {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return a.createdAt - b.createdAt;
      });
      return updated;
    });

    // Persist to Firebase
    update(ref(db, `lists/${listId}/items/${item.id}`), {
      checked: newChecked,
    });
  }

  async function handleDeleteItem(itemId: string) {
    if (!listId) return;

    setItems((prev) => prev.filter((item) => item.id !== itemId));
    await remove(ref(db, `lists/${listId}/items/${itemId}`));
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Link copiado", {
        description: "Compartilhe a URL para editar a lista em tempo real.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nao foi possivel copiar o link.");
    }
  }

  async function handleDiscardList() {
    if (!listId || isDiscardingList) return;

    try {
      setIsDiscardingList(true);
      await remove(ref(db, `lists/${listId}`));
      toast.success("Lista excluida.");
      router.push("/");
    } catch {
      toast.error("Nao foi possivel excluir a lista.");
    } finally {
      setIsDiscardingList(false);
      setIsConfirmOpen(false);
    }
  }

  const uncheckedCount = items.filter((i) => !i.checked).length;
  const pendingItemsCount = items.filter((item) => !item.checked).length;
  const pendingItems = items.filter((item) => !item.checked);
  const completedItems = items.filter((item) => item.checked);

  return (
    <>
      <main className="min-h-screen px-4 pb-12 pt-4">
        <div className="mx-auto max-w-md">
          <header className="sticky top-4 z-10 mb-5 rounded-3xl border border-white/60 bg-white/72 px-4 py-4 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  <ShoppingBasket className="h-3.5 w-3.5 text-indigo-500" />
                  simple grocery list
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900">Lista de compras</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    {uncheckedCount} {uncheckedCount === 1 ? "item restante" : "itens restantes"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl border-white/70 bg-white/80 px-3 text-slate-600 shadow-sm hover:bg-white"
                onClick={handleCopyLink}
              >
                {copied ? <Link2 className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
                <span>{copied ? "Copiado" : "Compartilhar"}</span>
              </Button>
            </div>
          </header>

          <section className="mb-5 rounded-[2rem] border border-white/65 bg-white/72 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <form onSubmit={handleAddItem} className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-1 shadow-inner shadow-slate-200/40 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
                <Plus className="h-4 w-4 text-indigo-500" />
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Adicione arroz, leite, frutas..."
                  className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  autoFocus
                  maxLength={200}
                />
              </div>
              <Button
                type="submit"
                size="icon-lg"
                aria-label="Adicionar"
                className="rounded-2xl bg-slate-900 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)] hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </section>

          {items.length === 0 ? (
            <Card className="rounded-[2rem] border-white/65 bg-white/68 py-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <CardContent className="space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-indigo-500 shadow-sm">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-medium text-slate-900">Sua lista esta vazia</h2>
                  <p className="text-sm leading-6 text-slate-500">
                    Comece adicionando os primeiros itens e compartilhe o link quando quiser colaborar.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <section className="space-y-4">
              {pendingItems.length > 0 ? (
                <div className="space-y-3">
                  {pendingItems.map((item) => (
                    <article
                      key={item.id}
                      className="group flex items-center gap-3 rounded-[1.75rem] border border-white/70 bg-white/78 px-4 py-4 text-slate-900 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
                    >
                      <label
                        htmlFor={`item-${item.id}`}
                        className="flex flex-1 cursor-pointer items-center gap-3"
                      >
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => handleToggleItem(item)}
                          id={`item-${item.id}`}
                          className="size-5 rounded-full"
                        />
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="truncate text-sm font-medium transition-all duration-200">
                            {item.name}
                          </span>
                        </div>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Excluir ${item.name}`}
                        className="rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </article>
                  ))}
                </div>
              ) : (
                <Card className="rounded-[1.75rem] border-white/65 bg-white/68 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                  <CardContent className="py-5 text-center text-sm text-slate-500">
                    Tudo concluido. Nenhum item pendente.
                  </CardContent>
                </Card>
              )}

              {completedItems.length > 0 && (
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-100/70 shadow-sm backdrop-blur-sm">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-4 text-left"
                    onClick={() => setIsCompletedCollapsed((prev) => !prev)}
                    aria-expanded={!isCompletedCollapsed}
                  >
                    <div>
                      <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Já estão no carrinho
                      </p>
                      <p className="text-xs text-slate-500">
                        {completedItems.length} {completedItems.length === 1 ? "item concluído" : "itens concluídos"}
                      </p>
                    </div>
                    {isCompletedCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )}
                  </button>

                  {!isCompletedCollapsed && (
                    <div className="space-y-3 border-t border-slate-200/70 px-3 py-3">
                      {completedItems.map((item) => (
                        <article
                          key={item.id}
                          className="group flex items-center gap-3 rounded-[1.5rem] border border-slate-200/80 bg-slate-100/75 px-4 py-4 text-slate-500 shadow-sm transition-all duration-200"
                        >
                          <label
                            htmlFor={`item-${item.id}`}
                            className="flex flex-1 cursor-pointer items-center gap-3"
                          >
                            <Checkbox
                              checked={item.checked}
                              onCheckedChange={() => handleToggleItem(item)}
                              id={`item-${item.id}`}
                              className="size-5 rounded-full"
                            />
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <span className="truncate text-sm font-medium line-through opacity-60 transition-all duration-200">
                                {item.name}
                              </span>
                            </div>
                          </label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Excluir ${item.name}`}
                            className="rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl border-red-200/70 bg-white/55 px-4 text-red-500 shadow-sm hover:bg-red-50 hover:text-red-600"
              onClick={() => setIsConfirmOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Descartar lista
            </Button>
          </div>
        </div>
      </main>

      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
          onClick={() => setIsConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-list-title"
            aria-describedby="discard-list-description"
            className="w-full max-w-sm rounded-[2rem] border border-white/70 bg-white/88 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.22)] backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Trash2 className="h-5 w-5" />
            </div>

            <div className="space-y-2">
              <h2 id="discard-list-title" className="text-lg font-semibold text-slate-900">
                Excluir esta lista?
              </h2>
              <p id="discard-list-description" className="text-sm leading-6 text-slate-500">
                Essa acao remove todos os itens e nao pode ser desfeita.
              </p>
            </div>

            {pendingItemsCount > 0 && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Ainda existem {pendingItemsCount} {pendingItemsCount === 1 ? "item pendente" : "itens pendentes"} nesta lista.
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-2xl"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isDiscardingList}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1 rounded-2xl"
                onClick={handleDiscardList}
                disabled={isDiscardingList}
              >
                {isDiscardingList ? "Excluindo..." : "Excluir lista"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
