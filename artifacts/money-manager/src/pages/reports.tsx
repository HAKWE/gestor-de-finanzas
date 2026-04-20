import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { useGetSummaryByCategory, useGetSummaryByPaymentMethod } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Reports() {
  const { t, language } = useLanguage();
  const { data: catData, isLoading: isLoadingCat } = useGetSummaryByCategory();
  const { data: payData, isLoading: isLoadingPay } = useGetSummaryByPaymentMethod();

  const handlePrint = () => {
    window.print();
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">{t("nav.reports")}</h1>
            <p className="text-muted-foreground">Analysez votre activité en détail.</p>
          </div>
          <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto rounded-xl">
            <Printer className="w-5 h-5 mr-2" />
            Exporter PDF
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h2 className="text-xl font-semibold">Par Catégorie</h2>
            <div className="h-64">
              {isLoadingCat ? (
                <Skeleton className="w-full h-full" />
              ) : catData && catData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={catData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="total"
                      nameKey="category"
                    >
                      {catData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => new Intl.NumberFormat().format(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">Pas de données</div>
              )}
            </div>
            {catData && catData.length > 0 && (
              <div className="space-y-2 mt-4 max-h-40 overflow-y-auto pr-2">
                 {catData.map((cat, i) => (
                   <div key={cat.category} className="flex justify-between items-center text-sm">
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                       <span>{cat.category}</span>
                     </div>
                     <span className="font-medium">{new Intl.NumberFormat().format(cat.total)}</span>
                   </div>
                 ))}
              </div>
            )}
          </div>

          <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
            <h2 className="text-xl font-semibold">Par Moyen de Paiement</h2>
            <div className="h-64">
              {isLoadingPay ? (
                <Skeleton className="w-full h-full" />
              ) : payData && payData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="paymentMethod" type="category" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => new Intl.NumberFormat().format(value)} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">Pas de données</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
