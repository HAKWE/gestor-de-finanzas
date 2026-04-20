import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and, gte, lte, ilike, or } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import {
  CreateTransactionBody,
  UpdateTransactionBody,
  GetTransactionParams,
  UpdateTransactionParams,
  DeleteTransactionParams,
  ListTransactionsQueryParams,
} from "@workspace/api-zod";

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

router.get("/transactions", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { startDate, endDate, type, category, paymentMethod, search } = parsed.data;
  const userId = req.userId;

  const conditions = [eq(transactionsTable.userId, userId)];

  if (startDate) conditions.push(gte(transactionsTable.date, startDate));
  if (endDate) conditions.push(lte(transactionsTable.date, endDate));
  if (type) conditions.push(eq(transactionsTable.type, type));
  if (category) conditions.push(eq(transactionsTable.category, category));
  if (paymentMethod) conditions.push(eq(transactionsTable.paymentMethod, paymentMethod));
  if (search) {
    conditions.push(
      or(
        ilike(transactionsTable.referenceNote, `%${search}%`),
        ilike(transactionsTable.category, `%${search}%`)
      )!
    );
  }

  const transactions = await db
    .select()
    .from(transactionsTable)
    .where(and(...conditions))
    .orderBy(transactionsTable.date, transactionsTable.createdAt);

  const result = transactions.map((t) => ({
    ...t,
    amount: parseFloat(t.amount),
    date: t.date,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  res.json(result);
});

router.post("/transactions", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [transaction] = await db
    .insert(transactionsTable)
    .values({ ...parsed.data, userId: req.userId, amount: String(parsed.data.amount) })
    .returning();

  res.status(201).json({
    ...transaction,
    amount: parseFloat(transaction.amount),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  });
});

router.get("/transactions/:id", requireAuth, async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTransactionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [transaction] = await db
    .select()
    .from(transactionsTable)
    .where(and(eq(transactionsTable.id, params.data.id), eq(transactionsTable.userId, req.userId)));

  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json({
    ...transaction,
    amount: parseFloat(transaction.amount),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  });
});

router.patch("/transactions/:id", requireAuth, async (req: any, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateTransactionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, any> = { ...parsed.data };
  if (parsed.data.amount !== undefined) {
    updateData.amount = String(parsed.data.amount);
  }

  const [transaction] = await db
    .update(transactionsTable)
    .set(updateData)
    .where(and(eq(transactionsTable.id, params.data.id), eq(transactionsTable.userId, req.userId)))
    .returning();

  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json({
    ...transaction,
    amount: parseFloat(transaction.amount),
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  });
});

router.delete("/transactions/:id", requireAuth, async (req: any, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteTransactionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [transaction] = await db
    .delete(transactionsTable)
    .where(and(eq(transactionsTable.id, params.data.id), eq(transactionsTable.userId, req.userId)))
    .returning();

  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
