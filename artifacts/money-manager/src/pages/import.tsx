import { useState, useRef, ChangeEvent } from "react";
import { useLanguage } from "../lib/language-context";
import { Layout } from "../components/layout";
import { useCreateTransaction, getListTransactionsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { parseMultipleSms, type ParsedSmsTransaction } from "../lib/smsParser";
import { parseCsvFile, mapRows, type ParsedCsv, type MappedTransaction, type ColumnMapping } from "../lib/csvImporter";
import { parsePdfFile, type PdfParseResult } from "../lib/pdfImporter";
import { Loader2, Trash2, UploadCloud, CheckCircle, FileUp, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type EditableSmsTx = ParsedSmsTransaction & { id: string };

export default function Import() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const createTx = useCreateTransaction();
  
  // SMS State
  const [smsText, setSmsText] = useState("");
  const [parsedSms, setParsedSms] = useState<EditableSmsTx[]>([]);
  const [isParsingSms, setIsParsingSms] = useState(false);
  const [isImportingSms, setIsImportingSms] = useState(false);
  const [smsProgress, setSmsProgress] = useState(0);
  const [smsSuccessCount, setSmsSuccessCount] = useState(0);

  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCsv, setParsedCsv] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [mappedCsvRows, setMappedCsvRows] = useState<(MappedTransaction & { id: string; selected: boolean })[]>([]);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvSuccessCount, setCsvSuccessCount] = useState(0);
  const [csvErrorCount, setCsvErrorCount] = useState(0);

  // PDF State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfResult, setPdfResult] = useState<PdfParseResult | null>(null);
  const [isPdfParsing, setIsPdfParsing] = useState(false);
  const [pdfRows, setPdfRows] = useState<(MappedTransaction & { id: string; selected: boolean })[]>([]);
  const [isImportingPdf, setIsImportingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfSuccessCount, setPdfSuccessCount] = useState(0);
  const [pdfErrorCount, setPdfErrorCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const categoriesFr = ["Vente produit", "Service coiffure", "Achat stock", "Transport", "Orange Money reçu", "Wave reçu", "MTN MoMo reçu", "Nourriture", "Loyer", "Eau/Électricité", "Autre"];
  const categoriesEn = ["Product sale", "Beauty service", "Stock purchase", "Transport", "Orange Money received", "Wave received", "MTN MoMo received", "Food", "Rent", "Water/Electricity", "Other"];
  const categories = language === "fr" ? categoriesFr : categoriesEn;
  const paymentMethods = ["Orange Money", "Wave", "MTN MoMo", "Cash", "Other"];

  // --- SMS Logic ---
  const handleAnalyzeSms = () => {
    setIsParsingSms(true);
    setTimeout(() => {
      const results = parseMultipleSms(smsText);
      setParsedSms(results.map((r, i) => ({ ...r, id: `sms-${i}` })));
      setIsParsingSms(false);
      setSmsSuccessCount(0);
      setSmsProgress(0);
    }, 500);
  };

  const updateSmsTx = (id: string, field: keyof EditableSmsTx, value: any) => {
    setParsedSms(prev => prev.map(tx => tx.id === id ? { ...tx, [field]: value } : tx));
  };

  const removeSmsTx = (id: string) => {
    setParsedSms(prev => prev.filter(tx => tx.id !== id));
  };

  const handleImportSms = async () => {
    if (parsedSms.length === 0) return;
    setIsImportingSms(true);
    setSmsProgress(0);
    let success = 0;

    for (let i = 0; i < parsedSms.length; i++) {
      const tx = parsedSms[i];
      try {
        await createTx.mutateAsync({
          data: {
            type: tx.type,
            amount: Number(tx.amount),
            currency: tx.currency || "XOF",
            category: tx.category || "Autre",
            paymentMethod: tx.paymentMethod || "Other",
            referenceNote: tx.referenceNote || "",
            date: tx.date || new Date().toISOString().split('T')[0]
          }
        });
        success++;
      } catch (err) {
        console.error("Failed to import SMS tx", err);
      }
      setSmsProgress(Math.round(((i + 1) / parsedSms.length) * 100));
    }

    setSmsSuccessCount(success);
    setIsImportingSms(false);
    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    
    toast({ title: language === "fr" ? "Import terminé" : "Import completed", description: `${success} transactions importées.` });
    if (success === parsedSms.length) {
      setParsedSms([]);
      setSmsText("");
    }
  };

  // --- CSV Logic ---
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    try {
      const parsed = await parseCsvFile(file);
      setParsedCsv(parsed);
      setMapping(parsed.suggestedMapping || {});
      setCsvSuccessCount(0);
      setCsvErrorCount(0);
      setCsvProgress(0);
      setMappedCsvRows([]);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de lire le fichier CSV", variant: "destructive" });
    }
  };

  const handleUpdateMapping = (field: keyof ColumnMapping, column: string) => {
    const newMapping = { ...mapping, [field]: column === "none" ? undefined : column };
    setMapping(newMapping);
  };

  const handlePreviewCsv = () => {
    if (!parsedCsv) return;
    const mapped = mapRows(parsedCsv.rows, mapping);
    setMappedCsvRows(mapped.map((r, i) => ({ ...r, id: `csv-${i}`, selected: true })));
  };

  const toggleCsvRowSelection = (id: string) => {
    setMappedCsvRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const handleImportCsv = async () => {
    const toImport = mappedCsvRows.filter(r => r.selected);
    if (toImport.length === 0) return;
    
    setIsImportingCsv(true);
    setCsvProgress(0);
    let success = 0;
    let errors = 0;

    for (let i = 0; i < toImport.length; i++) {
      const tx = toImport[i];
      try {
        await createTx.mutateAsync({
          data: {
            type: tx.type,
            amount: Number(tx.amount),
            currency: tx.currency || "XOF",
            category: tx.category || "Autre",
            paymentMethod: tx.paymentMethod || "Other",
            referenceNote: tx.referenceNote || "",
            date: tx.date || new Date().toISOString().split('T')[0]
          }
        });
        success++;
      } catch (err) {
        console.error("Failed to import CSV tx", err);
        errors++;
      }
      setCsvProgress(Math.round(((i + 1) / toImport.length) * 100));
    }

    setCsvSuccessCount(success);
    setCsvErrorCount(errors);
    setIsImportingCsv(false);
    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    
    toast({ 
      title: language === "fr" ? "Import terminé" : "Import completed", 
      description: `${success} importées, ${errors} erreurs.` 
    });
  };

  // --- PDF Logic ---
  const handlePdfSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    setPdfResult(null);
    setPdfRows([]);
    setPdfSuccessCount(0);
    setPdfErrorCount(0);
    setPdfProgress(0);
    setIsPdfParsing(true);
    try {
      const result = await parsePdfFile(file);
      setPdfResult(result);
      setPdfRows(result.transactions.map((tx, i) => ({ ...tx, id: `pdf-${i}`, selected: true })));
    } catch (err) {
      toast({ title: "Erreur PDF", description: language === "fr" ? "Impossible de lire ce fichier PDF." : "Could not read this PDF file.", variant: "destructive" });
    } finally {
      setIsPdfParsing(false);
    }
  };

  const togglePdfRowSelection = (id: string) => {
    setPdfRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const handleImportPdf = async () => {
    const toImport = pdfRows.filter(r => r.selected);
    if (toImport.length === 0) return;
    setIsImportingPdf(true);
    setPdfProgress(0);
    let success = 0;
    let errors = 0;

    for (let i = 0; i < toImport.length; i++) {
      const tx = toImport[i];
      try {
        await createTx.mutateAsync({
          data: {
            type: tx.type,
            amount: Number(tx.amount),
            currency: tx.currency || "XOF",
            category: tx.category || "Autre",
            paymentMethod: tx.paymentMethod || "Other",
            referenceNote: tx.referenceNote || "",
            date: tx.date || new Date().toISOString().split("T")[0],
          },
        });
        success++;
      } catch {
        errors++;
      }
      setPdfProgress(Math.round(((i + 1) / toImport.length) * 100));
    }

    setPdfSuccessCount(success);
    setPdfErrorCount(errors);
    setIsImportingPdf(false);
    queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    toast({
      title: language === "fr" ? "Import terminé" : "Import completed",
      description: `${success} ${language === "fr" ? "importées" : "imported"}${errors > 0 ? `, ${errors} erreurs` : ""}.`,
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">{language === "fr" ? "Importer des transactions" : "Import Transactions"}</h1>
          <p className="text-muted-foreground">
            {language === "fr" ? "Importez depuis vos SMS, un fichier CSV ou un relevé PDF." : "Import from SMS, a CSV file, or a PDF statement."}
          </p>
        </div>

        <Tabs defaultValue="sms" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="sms" className="text-base py-3">SMS</TabsTrigger>
            <TabsTrigger value="csv" className="text-base py-3">CSV</TabsTrigger>
            <TabsTrigger value="pdf" className="text-base py-3">PDF</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sms" className="space-y-6">
            <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
              <Label className="text-lg font-semibold">{language === "fr" ? "Collez vos SMS" : "Paste your SMS messages"}</Label>
              <Textarea 
                placeholder={language === "fr" ? "Collez ici les SMS de notification (Orange Money, Wave, etc.)\nSéparés par un retour à la ligne." : "Paste payment notification SMS here\nSeparated by newlines."}
                className="min-h-[200px] text-base"
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
              />
              <Button onClick={handleAnalyzeSms} disabled={!smsText || isParsingSms} size="lg" className="w-full rounded-xl">
                {isParsingSms && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {language === "fr" ? "Analyser" : "Analyze"}
              </Button>
            </div>

            {parsedSms.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{parsedSms.length} {language === "fr" ? "transactions détectées" : "transactions detected"}</h3>
                </div>
                
                <div className="space-y-4">
                  {parsedSms.map((tx) => (
                    <Card key={tx.id} className="overflow-hidden">
                      <CardContent className="p-4 sm:p-6 grid gap-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={tx.confidence === 'high' ? 'default' : tx.confidence === 'medium' ? 'secondary' : 'destructive'} className={tx.confidence === 'high' ? 'bg-green-500 hover:bg-green-600 text-white' : tx.confidence === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600 text-yellow-950' : ''}>
                              {tx.confidence === 'high' ? (language === "fr" ? "Haute confiance" : "High confidence") : 
                               tx.confidence === 'medium' ? (language === "fr" ? "Confiance moyenne" : "Medium confidence") : 
                               (language === "fr" ? "Faible confiance" : "Low confidence")}
                            </Badge>
                            {tx.detectedService && (
                              <Badge variant="outline">{tx.detectedService}</Badge>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeSmsTx(tx.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={tx.type} onValueChange={(val) => updateSmsTx(tx.id, 'type', val)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="income">{language === "fr" ? "Revenu" : "Income"}</SelectItem>
                                <SelectItem value="expense">{language === "fr" ? "Dépense" : "Expense"}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>{language === "fr" ? "Montant" : "Amount"}</Label>
                            <Input type="number" value={tx.amount || ""} onChange={(e) => updateSmsTx(tx.id, 'amount', e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>{language === "fr" ? "Devise" : "Currency"}</Label>
                            <Select value={tx.currency} onValueChange={(val) => updateSmsTx(tx.id, 'currency', val)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="XOF">XOF (CFA)</SelectItem>
                                <SelectItem value="NGN">NGN (Naira)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>{language === "fr" ? "Catégorie" : "Category"}</Label>
                            <Select value={tx.category} onValueChange={(val) => updateSmsTx(tx.id, 'category', val)}>
                              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>{language === "fr" ? "Méthode" : "Method"}</Label>
                            <Select value={tx.paymentMethod} onValueChange={(val) => updateSmsTx(tx.id, 'paymentMethod', val)}>
                              <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                              <SelectContent>
                                {paymentMethods.map((pm) => (
                                  <SelectItem key={pm} value={pm}>{pm}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={tx.date || ""} onChange={(e) => updateSmsTx(tx.id, 'date', e.target.value)} />
                          </div>
                          <div className="space-y-2 sm:col-span-2 md:col-span-3">
                            <Label>Reference / Note</Label>
                            <Input value={tx.referenceNote || ""} onChange={(e) => updateSmsTx(tx.id, 'referenceNote', e.target.value)} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4 sticky bottom-4 z-10 mt-6">
                  {isImportingSms || smsSuccessCount > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{language === "fr" ? "Progression" : "Progress"}</span>
                        <span className="font-bold">{smsProgress}%</span>
                      </div>
                      <Progress value={smsProgress} className="h-2" />
                      {smsSuccessCount > 0 && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500 mt-2">
                          <CheckCircle className="h-5 w-5" />
                          <span>{smsSuccessCount} {language === "fr" ? "transactions importées" : "transactions imported"}</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                  <Button onClick={handleImportSms} disabled={isImportingSms || parsedSms.length === 0} size="lg" className="w-full rounded-xl h-14 text-lg">
                    {isImportingSms && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {language === "fr" ? "Tout importer" : "Import All"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="csv" className="space-y-6">
            <div className="bg-card p-8 rounded-2xl border shadow-sm border-dashed text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <FileUp className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{language === "fr" ? "Sélectionner un fichier CSV" : "Select CSV file"}</h3>
                <p className="text-muted-foreground mb-6">
                  {language === "fr" ? "Relevé bancaire ou export Mobile Money" : "Bank statement or Mobile Money export"}
                </p>
                <input 
                  type="file" 
                  accept=".csv" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileSelect} 
                />
                <Button onClick={() => fileInputRef.current?.click()} size="lg" variant="outline" className="rounded-xl">
                  {language === "fr" ? "Parcourir" : "Browse files"}
                </Button>
              </div>
              {csvFile && (
                <div className="mt-4 pt-4 border-t text-sm font-medium">
                  {csvFile.name} 
                  {parsedCsv?.detectedFormat && parsedCsv.detectedFormat !== "Generic" && (
                    <Badge variant="secondary" className="ml-2">Format: {parsedCsv.detectedFormat}</Badge>
                  )}
                </div>
              )}
            </div>

            {parsedCsv && mappedCsvRows.length === 0 && (
              <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-6">
                <h3 className="text-xl font-bold">{language === "fr" ? "Mappage des colonnes" : "Column Mapping"}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    { key: "date", label: "Date" },
                    { key: "amount", label: language === "fr" ? "Montant" : "Amount" },
                    { key: "type", label: "Type (Revenu/Dépense)" },
                    { key: "description", label: "Description" },
                    { key: "reference", label: "Reference" },
                    { key: "debit", label: "Débit (Optionnel)" },
                    { key: "credit", label: "Crédit (Optionnel)" },
                  ].map(field => (
                    <div key={field.key} className="space-y-2">
                      <Label>{field.label}</Label>
                      <Select 
                        value={mapping[field.key as keyof ColumnMapping] || "none"} 
                        onValueChange={(val) => handleUpdateMapping(field.key as keyof ColumnMapping, val)}
                      >
                        <SelectTrigger><SelectValue placeholder="Ignorer" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">-- {language === "fr" ? "Ignorer" : "Ignore"} --</SelectItem>
                          {parsedCsv.headers.map(h => (
                            <SelectItem key={h} value={h}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                
                <Button onClick={handlePreviewCsv} size="lg" className="w-full rounded-xl">
                  {language === "fr" ? "Prévisualiser" : "Preview"}
                </Button>
              </div>
            )}

            {mappedCsvRows.length > 0 && (
              <div className="space-y-4">
                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-bold">{mappedCsvRows.length} {language === "fr" ? "lignes prêtes" : "rows ready"}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>{language === "fr" ? "Montant" : "Amount"}</TableHead>
                          <TableHead>{language === "fr" ? "Catégorie" : "Category"}</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mappedCsvRows.slice(0, 20).map((row) => (
                          <TableRow key={row.id}>
                            <TableCell>
                              <Checkbox 
                                checked={row.selected} 
                                onCheckedChange={() => toggleCsvRowSelection(row.id)} 
                              />
                            </TableCell>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>
                              <Badge variant={row.type === 'income' ? 'default' : 'secondary'} className={row.type === 'income' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}>
                                {row.type === 'income' ? '+' : '-'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold">{row.amount}</TableCell>
                            <TableCell>{row.category}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={row.referenceNote}>{row.referenceNote}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {mappedCsvRows.length > 20 && (
                    <div className="p-4 text-center text-sm text-muted-foreground border-t">
                      {language === "fr" ? "Et" : "And"} {mappedCsvRows.length - 20} {language === "fr" ? "autres lignes..." : "more rows..."}
                    </div>
                  )}
                </div>

                <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4 sticky bottom-4 z-10">
                  {isImportingCsv || csvSuccessCount > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{language === "fr" ? "Progression" : "Progress"}</span>
                        <span className="font-bold">{csvProgress}%</span>
                      </div>
                      <Progress value={csvProgress} className="h-2" />
                      {(csvSuccessCount > 0 || csvErrorCount > 0) && (
                        <div className="flex items-center gap-4 mt-2">
                          {csvSuccessCount > 0 && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                              <CheckCircle className="h-5 w-5" />
                              <span>{csvSuccessCount} {language === "fr" ? "succès" : "success"}</span>
                            </div>
                          )}
                          {csvErrorCount > 0 && (
                            <div className="flex items-center gap-2 text-destructive">
                              <span>{csvErrorCount} {language === "fr" ? "erreurs" : "errors"}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                  <Button 
                    onClick={handleImportCsv} 
                    disabled={isImportingCsv || mappedCsvRows.filter(r => r.selected).length === 0} 
                    size="lg" 
                    className="w-full rounded-xl h-14 text-lg"
                  >
                    {isImportingCsv && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {language === "fr" ? "Importer" : "Import"} {mappedCsvRows.filter(r => r.selected).length} transactions
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pdf" className="space-y-6">
            <div className="bg-card p-8 rounded-2xl border shadow-sm border-dashed text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {language === "fr" ? "Sélectionner un relevé PDF" : "Select a PDF statement"}
                </h3>
                <p className="text-muted-foreground mb-1">
                  {language === "fr"
                    ? "Relevé bancaire, historique Orange Money, Wave ou MTN MoMo"
                    : "Bank statement, Orange Money, Wave or MTN MoMo history"}
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  {language === "fr"
                    ? "Le fichier est analysé directement sur votre appareil, aucune donnée n'est envoyée."
                    : "The file is processed directly on your device — nothing is uploaded."}
                </p>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  ref={pdfInputRef}
                  className="hidden"
                  onChange={handlePdfSelect}
                />
                <Button onClick={() => pdfInputRef.current?.click()} size="lg" variant="outline" className="rounded-xl" disabled={isPdfParsing}>
                  {isPdfParsing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {isPdfParsing
                    ? (language === "fr" ? "Analyse en cours..." : "Analyzing...")
                    : (language === "fr" ? "Parcourir" : "Browse files")}
                </Button>
              </div>
              {pdfFile && !isPdfParsing && (
                <div className="mt-4 pt-4 border-t text-sm font-medium flex flex-wrap items-center justify-center gap-2">
                  <span>{pdfFile.name}</span>
                  {pdfResult && (
                    <>
                      <Badge variant="secondary">{pdfResult.detectedFormat}</Badge>
                      <Badge variant="outline">{pdfResult.pageCount} {language === "fr" ? "pages" : "pages"}</Badge>
                    </>
                  )}
                </div>
              )}
            </div>

            {pdfResult && pdfRows.length === 0 && !isPdfParsing && (
              <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4">
                <p className="text-muted-foreground text-center">
                  {language === "fr"
                    ? "Aucune transaction détectée automatiquement. Voici le texte extrait du PDF — copiez-le dans l'onglet SMS si c'est un relevé mobile money."
                    : "No transactions detected automatically. Here is the text extracted from the PDF — paste it into the SMS tab if it's a mobile money statement."}
                </p>
                {pdfResult.reconstructedLines.length > 0 && (
                  <div className="bg-muted rounded-xl p-4 max-h-64 overflow-y-auto">
                    <p className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
                      {pdfResult.reconstructedLines.slice(0, 100).join("\n")}
                    </p>
                  </div>
                )}
              </div>
            )}

            {pdfRows.length > 0 && (
              <div className="space-y-4">
                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                    <h3 className="font-bold">
                      {pdfRows.filter(r => r.selected).length} / {pdfRows.length} {language === "fr" ? "transactions sélectionnées" : "transactions selected"}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPdfRows(prev => {
                        const allSelected = prev.every(r => r.selected);
                        return prev.map(r => ({ ...r, selected: !allSelected }));
                      })}
                    >
                      {language === "fr" ? "Tout sélectionner / désélectionner" : "Select / deselect all"}
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>{language === "fr" ? "Montant" : "Amount"}</TableHead>
                          <TableHead>{language === "fr" ? "Devise" : "Currency"}</TableHead>
                          <TableHead>{language === "fr" ? "Catégorie" : "Category"}</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pdfRows.slice(0, 50).map((row) => (
                          <TableRow key={row.id} className={!row.selected ? "opacity-40" : ""}>
                            <TableCell>
                              <Checkbox checked={row.selected} onCheckedChange={() => togglePdfRowSelection(row.id)} />
                            </TableCell>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>
                              <Badge
                                variant={row.type === "income" ? "default" : "secondary"}
                                className={row.type === "income" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
                              >
                                {row.type === "income" ? (language === "fr" ? "Revenu" : "Income") : (language === "fr" ? "Dépense" : "Expense")}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold">{row.amount.toLocaleString()}</TableCell>
                            <TableCell>{row.currency}</TableCell>
                            <TableCell>{row.category}</TableCell>
                            <TableCell className="max-w-[180px] truncate" title={row.referenceNote}>{row.referenceNote}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {pdfRows.length > 50 && (
                    <div className="p-4 text-center text-sm text-muted-foreground border-t">
                      {language === "fr" ? "Et" : "And"} {pdfRows.length - 50} {language === "fr" ? "autres lignes..." : "more rows..."}
                    </div>
                  )}
                </div>

                <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4 sticky bottom-4 z-10">
                  {isImportingPdf || pdfSuccessCount > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{language === "fr" ? "Progression" : "Progress"}</span>
                        <span className="font-bold">{pdfProgress}%</span>
                      </div>
                      <Progress value={pdfProgress} className="h-2" />
                      {(pdfSuccessCount > 0 || pdfErrorCount > 0) && (
                        <div className="flex items-center gap-4 mt-2">
                          {pdfSuccessCount > 0 && (
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                              <CheckCircle className="h-5 w-5" />
                              <span>{pdfSuccessCount} {language === "fr" ? "succès" : "success"}</span>
                            </div>
                          )}
                          {pdfErrorCount > 0 && (
                            <div className="flex items-center gap-2 text-destructive">
                              <span>{pdfErrorCount} {language === "fr" ? "erreurs" : "errors"}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
                  <Button
                    onClick={handleImportPdf}
                    disabled={isImportingPdf || pdfRows.filter(r => r.selected).length === 0}
                    size="lg"
                    className="w-full rounded-xl h-14 text-lg"
                  >
                    {isImportingPdf && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {language === "fr" ? "Importer" : "Import"} {pdfRows.filter(r => r.selected).length} transactions
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}