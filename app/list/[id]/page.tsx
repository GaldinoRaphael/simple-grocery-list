"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { ref, onValue, push, update, remove } from "firebase/database";
import { nanoid } from "nanoid";
import { CheckSquare, ClipboardCopy, Link2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
  createdAt: number;
}

export default function ListPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;

  const [items, setItems] = useState<GroceryItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real-time sync from Firebase
  useEffect(() => {
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
    const name = inputValue.trim();
    if (!name) return;

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

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a temp input for older browsers
    }
  }

  async function handleDiscardList() {
    await remove(ref(db, `lists/${listId}`));
    router.push("/");
  }

  const uncheckedCount = items.filter((i) => !i.checked).length;

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-lg space-y-4">
        {/* Header */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckSquare className="h-5 w-5 text-slate-600" />
                Lista de Compras
              </CardTitle>
              <span className="text-sm text-slate-500">
                {uncheckedCount} {uncheckedCount === 1 ? "item" : "itens"} restante
                {uncheckedCount !== 1 ? "s" : ""}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Add item form */}
            <form onSubmit={handleAddItem} className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Adicionar item..."
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="icon" aria-label="Adicionar">
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Link2 className="h-3.5 w-3.5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <ClipboardCopy className="h-3.5 w-3.5" />
                    Copiar Link
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={handleDiscardList}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Descartar Lista
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Items list */}
        {items.length === 0 ? (
          <p className="text-center text-sm text-slate-400 pt-4">
            Nenhum item ainda. Adicione o primeiro acima!
          </p>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-0 divide-y divide-slate-100">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => handleToggleItem(item)}
                    id={`item-${item.id}`}
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      item.checked && "line-through opacity-50"
                    )}
                  >
                    {item.name}
                  </span>
                </label>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
