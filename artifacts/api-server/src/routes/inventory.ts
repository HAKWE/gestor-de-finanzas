import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { eq, and } from "drizzle-orm";
import { db, inventoryTable } from "@workspace/db";
import {
  CreateInventoryItemBody,
  UpdateInventoryItemBody,
  UpdateInventoryItemParams,
  DeleteInventoryItemParams,
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

function formatItem(item: any) {
  return {
    ...item,
    quantity: parseFloat(item.quantity),
    createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : item.updatedAt,
  };
}

router.get("/inventory", requireAuth, async (req: any, res): Promise<void> => {
  const items = await db
    .select()
    .from(inventoryTable)
    .where(eq(inventoryTable.userId, req.userId))
    .orderBy(inventoryTable.name);

  res.json(items.map(formatItem));
});

router.post("/inventory", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .insert(inventoryTable)
    .values({
      ...parsed.data,
      userId: req.userId,
      quantity: String(parsed.data.quantity),
    })
    .returning();

  res.status(201).json(formatItem(item));
});

router.patch("/inventory/:id", requireAuth, async (req: any, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateInventoryItemParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, any> = { ...parsed.data };
  if (parsed.data.quantity !== undefined) {
    updateData.quantity = String(parsed.data.quantity);
  }

  const [item] = await db
    .update(inventoryTable)
    .set(updateData)
    .where(and(eq(inventoryTable.id, params.data.id), eq(inventoryTable.userId, req.userId)))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.json(formatItem(item));
});

router.delete("/inventory/:id", requireAuth, async (req: any, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteInventoryItemParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db
    .delete(inventoryTable)
    .where(and(eq(inventoryTable.id, params.data.id), eq(inventoryTable.userId, req.userId)))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
