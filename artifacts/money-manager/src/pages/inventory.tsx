import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { useListInventoryItems, useCreateInventoryItem, useDeleteInventoryItem, useUpdateInventoryItem, getListInventoryItemsQueryKey } from "@workspace/api-client-react";
import { queryClient } from "../lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Loader2, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Inventory() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { data: items, isLoading } = useListInventoryItems();
  const createItem = useCreateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const updateItem = useUpdateInventoryItem();

  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editQty, setEditQty] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newQty) return;

    createItem.mutate({ data: { name: newName, quantity: Number(newQty), unit: "pcs" } }, {
      onSuccess: () => {
        setNewName("");
        setNewQty("");
        toast({ title: "Artículo agregado" });
        queryClient.invalidateQueries({ queryKey: getListInventoryItemsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if(confirm("¿Confirmar eliminación?")) {
      deleteItem.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Artículo eliminado" });
          queryClient.invalidateQueries({ queryKey: getListInventoryItemsQueryKey() });
        }
      });
    }
  };

  const startEditing = (item: any) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQty(item.quantity.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditQty("");
  };

  const saveEditing = (id: number) => {
    if (!editName || !editQty) return;
    updateItem.mutate({ id, data: { name: editName, quantity: Number(editQty) } }, {
      onSuccess: () => {
        toast({ title: "Artículo actualizado" });
        queryClient.invalidateQueries({ queryKey: getListInventoryItemsQueryKey() });
        setEditingId(null);
      },
      onError: () => {
        toast({ title: "Error", variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.inventory")}</h1>
          <p className="text-muted-foreground">Gestiona tu inventario fácilmente.</p>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/20">
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input placeholder="Nombre del artículo" value={newName} onChange={(e) => setNewName(e.target.value)} className="flex-1" />
              <Input type="number" placeholder="Cant." value={newQty} onChange={(e) => setNewQty(e.target.value)} className="w-24" />
              <Button type="submit" disabled={createItem.isPending}>
                {createItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </Button>
            </form>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items && items.length > 0 ? (
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                  {editingId === item.id ? (
                     <div className="flex flex-1 items-center gap-2">
                       <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1" />
                       <Input type="number" value={editQty} onChange={(e) => setEditQty(e.target.value)} className="w-24" />
                     </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Agregado el {new Date(item.createdAt).toLocaleDateString("es-CO")}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    {editingId !== item.id && (
                      <div className="font-bold text-lg bg-secondary/10 text-secondary px-3 py-1 rounded-lg">
                        {item.quantity} {item.unit}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                       {editingId === item.id ? (
                         <>
                           <Button variant="ghost" size="icon" onClick={() => saveEditing(item.id)} disabled={updateItem.isPending} className="text-green-600">
                             {updateItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                           </Button>
                           <Button variant="ghost" size="icon" onClick={cancelEditing} disabled={updateItem.isPending} className="text-muted-foreground hover:text-foreground">
                             <X className="w-4 h-4" />
                           </Button>
                         </>
                       ) : (
                         <>
                           <Button variant="ghost" size="icon" onClick={() => startEditing(item)}>
                             <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} disabled={deleteItem.isPending}>
                             <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                           </Button>
                         </>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <p>Votre inventaire est vide.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
