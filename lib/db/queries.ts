import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import { serialNumbers } from "./schema";
import type { SerialNumber, SerialStatus } from "./schema";

export async function findSerialByNumber(serialNumber: string): Promise<SerialNumber | null> {
  const rows = await db
    .select()
    .from(serialNumbers)
    .where(eq(serialNumbers.serialNumber, serialNumber))
    .limit(1);
  return rows[0] ?? null;
}

export async function findSerialById(id: number): Promise<SerialNumber | null> {
  const rows = await db.select().from(serialNumbers).where(eq(serialNumbers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getAllSerials(): Promise<SerialNumber[]> {
  return db.select().from(serialNumbers).orderBy(desc(serialNumbers.id));
}

export async function createSerial(data: {
  serialNumber: string;
  holderName: string;
  status: SerialStatus;
}): Promise<SerialNumber> {
  const rows = await db.insert(serialNumbers).values(data).returning();
  return rows[0];
}

export async function updateSerial(
  id: number,
  data: { holderName?: string; status?: SerialStatus }
): Promise<SerialNumber | null> {
  const rows = await db
    .update(serialNumbers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(serialNumbers.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteSerial(id: number): Promise<void> {
  await db.delete(serialNumbers).where(eq(serialNumbers.id, id));
}
