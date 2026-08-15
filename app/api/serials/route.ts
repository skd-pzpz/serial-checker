import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { findSerialByNumber } from "@/lib/db/queries";
import { rateLimit } from "@/lib/rate-limit";

// 公开接口：根据序列号查询
export async function GET(request: NextRequest) {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";

  const limit = rateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.retryAfterMs ?? 0) / 1000)),
        },
      }
    );
  }

  const sn = request.nextUrl.searchParams.get("sn")?.trim();
  if (!sn) {
    return NextResponse.json({ error: "缺少 sn 参数" }, { status: 400 });
  }

  try {
    const record = await findSerialByNumber(sn);
    if (!record) {
      return NextResponse.json({ exists: false, message: "序列号不存在" }, { status: 200 });
    }
    return NextResponse.json({ exists: true, data: record }, { status: 200 });
  } catch (error) {
    console.error("查询序列号失败:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
