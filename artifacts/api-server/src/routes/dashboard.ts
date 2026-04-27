import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, gte, sql } from "drizzle-orm";
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

router.get("/dashboard/summary", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const weekStartStr = startOfWeek.toISOString().slice(0, 10);

  // Previous week: 7 days before current week start
  const prevWeekStart = new Date(startOfWeek);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekStartStr = prevWeekStart.toISOString().slice(0, 10);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = startOfMonth.toISOString().slice(0, 10);

  // Query from prevWeekStart to cover both current and previous week
  const queryFrom = prevWeekStartStr < monthStartStr ? prevWeekStartStr : monthStartStr;

  const all = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), gte(transactionsTable.date, queryFrom)));

  let todayIncome = 0, todayExpenses = 0;
  let weekIncome = 0, weekExpenses = 0;
  let monthIncome = 0, monthExpenses = 0;
  let prevWeekIncome = 0, prevWeekExpenses = 0;

  for (const t of all) {
    const amt = parseFloat(t.amount);
    if (t.date >= monthStartStr) {
      if (t.type === "income") monthIncome += amt;
      else monthExpenses += amt;
    }
    if (t.date >= weekStartStr) {
      if (t.type === "income") weekIncome += amt;
      else weekExpenses += amt;
    } else if (t.date >= prevWeekStartStr) {
      if (t.type === "income") prevWeekIncome += amt;
      else prevWeekExpenses += amt;
    }
    if (t.date === todayStr) {
      if (t.type === "income") todayIncome += amt;
      else todayExpenses += amt;
    }
  }

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId));

  const totalTransactions = Number(countResult[0]?.count ?? 0);

  const firstTx = await db
    .select({ currency: transactionsTable.currency })
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .limit(1);

  const currency = firstTx[0]?.currency ?? "XOF";

  res.json({
    todayBalance: todayIncome - todayExpenses,
    todayIncome,
    todayExpenses,
    weekIncome,
    weekExpenses,
    weekProfit: weekIncome - weekExpenses,
    prevWeekIncome,
    prevWeekExpenses,
    monthIncome,
    monthExpenses,
    monthProfit: monthIncome - monthExpenses,
    totalTransactions,
    currency,
  });
});

router.get("/dashboard/weekly", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;
  const now = new Date();

  const days: { date: string; income: number; expenses: number; profit: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), income: 0, expenses: 0, profit: 0 });
  }

  const startDate = days[0].date;
  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), gte(transactionsTable.date, startDate)));

  for (const t of transactions) {
    const day = days.find((d) => d.date === t.date);
    if (day) {
      const amt = parseFloat(t.amount);
      if (t.type === "income") day.income += amt;
      else day.expenses += amt;
      day.profit = day.income - day.expenses;
    }
  }

  res.json(days);
});

router.get("/dashboard/by-category", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;
  const period = (req.query.period as string) || "month";

  const now = new Date();
  let startDate: string | undefined;

  if (period === "week") {
    const d = new Date(now);
    d.setDate(now.getDate() - 6);
    startDate = d.toISOString().slice(0, 10);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  }

  const conditions = [eq(transactionsTable.userId, userId)];
  if (startDate) conditions.push(gte(transactionsTable.date, startDate));

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(and(...conditions));

  const map = new Map<string, { category: string; type: string; total: number; count: number }>();

  for (const t of transactions) {
    const key = `${t.category}::${t.type}`;
    const existing = map.get(key);
    if (existing) {
      existing.total += parseFloat(t.amount);
      existing.count++;
    } else {
      map.set(key, { category: t.category, type: t.type, total: parseFloat(t.amount), count: 1 });
    }
  }

  res.json([...map.values()].sort((a, b) => b.total - a.total));
});

router.get("/dashboard/by-payment-method", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId;
  const period = (req.query.period as string) || "month";

  const now = new Date();
  let startDate: string | undefined;

  if (period === "week") {
    const d = new Date(now);
    d.setDate(now.getDate() - 6);
    startDate = d.toISOString().slice(0, 10);
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  }

  const conditions = [eq(transactionsTable.userId, userId)];
  if (startDate) conditions.push(gte(transactionsTable.date, startDate));

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(and(...conditions));

  const map = new Map<string, { paymentMethod: string; total: number; count: number }>();

  for (const t of transactions) {
    const key = t.paymentMethod;
    const existing = map.get(key);
    if (existing) {
      existing.total += parseFloat(t.amount);
      existing.count++;
    } else {
      map.set(key, { paymentMethod: t.paymentMethod, total: parseFloat(t.amount), count: 1 });
    }
  }

  res.json([...map.values()].sort((a, b) => b.total - a.total));
});

export default router;
