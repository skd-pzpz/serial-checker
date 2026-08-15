import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSerial, findSerialByNumber, getAllSerials } from "@/lib/db/queries";
import type { SerialStatus } from "@/lib/db/schema";

// 获取全部序列号列表（需认证）
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const records = await getAllSerials();
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error("获取序列号列表失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// 添加序列号（需认证），重名返回 409
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  let body: { serialNumber?: unknown; holderName?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  if (typeof body.serialNumber !== "string" || !body.serialNumber.trim()) {
    return NextResponse.json({ error: "序列号不能为空" }, { status: 400 });
  }
  if (typeof body.holderName !== "string" || !body.holderName.trim()) {
    return NextResponse.json({ error: "持有者姓名不能为空" }, { status: 400 });
  }

  const serialNumber = body.serialNumber.trim();
  const holderName = body.holderName.trim();
  const status: SerialStatus = body.status === "inactive" ? "inactive" : "active";

  try {
    const exists = await findSerialByNumber(serialNumber);
    if (exists) {
      return NextResponse.json({ error: "该序列号已存在" }, { status: 409 });
    }

    const record = await createSerial({ serialNumber, holderName, status });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("创建序列号失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
