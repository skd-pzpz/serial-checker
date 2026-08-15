import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteSerial, findSerialById, updateSerial } from "@/lib/db/queries";
import type { SerialStatus } from "@/lib/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// 更新序列号（需认证），可修改状态和持有者
export async function PUT(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
  }

  let body: { holderName?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const update: { holderName?: string; status?: SerialStatus } = {};

  if (body.holderName !== undefined) {
    if (typeof body.holderName !== "string" || !body.holderName.trim()) {
      return NextResponse.json({ error: "持有者姓名不能为空" }, { status: 400 });
    }
    update.holderName = body.holderName.trim();
  }

  if (body.status !== undefined) {
    if (body.status !== "active" && body.status !== "inactive") {
      return NextResponse.json({ error: "无效的状态" }, { status: 400 });
    }
    update.status = body.status;
  }

  try {
    const existing = await findSerialById(id);
    if (!existing) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }
    const record = await updateSerial(id, update);
    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    console.error("更新序列号失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// 删除序列号（需认证）
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: "无效的 ID" }, { status: 400 });
  }

  try {
    const existing = await findSerialById(id);
    if (!existing) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }
    await deleteSerial(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("删除序列号失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
