import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useGetTransaction, useUpdateTransaction, getListTransactionsQueryKey, getGetDashboardSummaryQueryKey, getGetWeeklySummaryQueryKey } from "@workspace/api-client-react";
import { queryClient } from "../lib/queryClient";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive(),
  currency: z.string().min(1),
  category: z.string().min(1),
  paymentMethod: z.string().min(1),
  referenceNote: z.string().optional(),
  date: z.string().min(1),
});

export default function EditTransaction() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const params = useParams();
  const txId = Number(params.id);
  const { toast } = useToast();
  
  const { data: transaction, isLoading } = useGetTransaction(txId, {
    query: { enabled: !!txId, queryKey: ["/api/transactions", txId] }
  });
  const updateTx = useUpdateTransaction();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "income",
      amount: 0,
      currency: "XOF",
      category: "",
      paymentMethod: "",
      referenceNote: "",
      date: new Date().toISOString().split('T')[0],
    }
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        type: transaction.type as "income" | "expense",
        amount: transaction.amount,
        currency: transaction.currency || "XOF",
        category: transaction.category,
        paymentMethod: transaction.paymentMethod,
        referenceNote: transaction.referenceNote || "",
        date: new Date(transaction.date).toISOString().split('T')[0],
      });
    }
  }, [transaction, form]);

  const categoriesFr = ["Venta producto", "Servicio belleza", "Compra stock", "Transporte", "Mercado Pago recibido", "Nequi recibido", "Yape recibido", "Alimentación", "Alquiler", "Agua/Electricidad", "Otro"];
  const categoriesEn = ["Product sale", "Beauty service", "Stock purchase", "Transport", "Orange Money received", "Wave received", "MTN MoMo received", "Food", "Rent", "Water/Electricity", "Other"];
  const categories = language !== "en" ? categoriesFr : categoriesEn;

  const paymentMethods = ["Orange Money", "Wave", "MTN MoMo", "Cash", "Other"];

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateTx.mutate({ id: txId, data: values }, {
      onSuccess: () => {
        toast({ title: "Transaction modifiée" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWeeklySummaryQueryKey() });
        setLocation("/transactions");
      },
      onError: () => {
        toast({ title: "Erreur", description: "Impossible de modifier", variant: "destructive" });
      }
    });
  }

  if (isLoading) {
    return (
      <Layout>
         <div className="max-w-2xl mx-auto w-full space-y-6">
           <Skeleton className="h-12 w-1/2" />
           <Skeleton className="h-96 w-full" />
         </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Editar transacción</h1>
        </div>

        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="income" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">Ingreso</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="expense" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">Gasto</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} className="text-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Moneda</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="XOF">XOF (CFA)</SelectItem>
                          <SelectItem value="NGN">NGN (Naira)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elegir..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de pago</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elegir..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((pm) => (
                          <SelectItem key={pm} value={pm}>{pm}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note / Référence (Optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Client, motif..." {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full text-lg h-12 rounded-xl" disabled={updateTx.isPending}>
                {updateTx.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Enregistrer les modifications
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
