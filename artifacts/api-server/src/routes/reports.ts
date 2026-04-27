import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
}

router.get("/reports/monthly", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;
  const now = new Date();
  const year = parseInt(req.query.year as string) || now.getFullYear();
  const month = parseInt(req.query.month as string) || now.getMonth() + 1;

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        gte(transactionsTable.date, startDate),
        lte(transactionsTable.date, endDate)
      )
    )
    .orderBy(transactionsTable.date);

  const currency = transactions[0]?.currency ?? "XOF";
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of transactions) {
    const amt = parseFloat(t.amount);
    if (t.type === "income") totalIncome += amt;
    else totalExpenses += amt;
  }

  const dailyMap = new Map<string, { date: string; income: number; expenses: number }>();
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dailyMap.set(dateStr, { date: dateStr, income: 0, expenses: 0 });
  }
  for (const t of transactions) {
    const day = dailyMap.get(t.date);
    if (day) {
      const amt = parseFloat(t.amount);
      if (t.type === "income") day.income += amt;
      else day.expenses += amt;
    }
  }

  const catMap = new Map<string, { category: string; total: number; type: string; count: number }>();
  for (const t of transactions) {
    const key = `${t.category}::${t.type}`;
    const existing = catMap.get(key);
    if (existing) {
      existing.total += parseFloat(t.amount);
      existing.count++;
    } else {
      catMap.set(key, {
        category: t.category,
        total: parseFloat(t.amount),
        type: t.type,
        count: 1,
      });
    }
  }

  const sorted = [...catMap.values()].sort((a, b) => b.total - a.total);
  const catTotal = sorted.reduce((s, c) => s + c.total, 0);
  const categories = sorted.map((c) => ({
    ...c,
    percentage: catTotal > 0 ? Math.round((c.total / catTotal) * 100) : 0,
  }));

  res.json({
    summary: {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      currency,
    },
    daily: [...dailyMap.values()],
    categories,
    transactions: transactions.map((t) => ({
      ...t,
      amount: parseFloat(t.amount),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  });
});

export default router;
