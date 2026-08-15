"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Search, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SerialQueryResponse } from "@/lib/types";

// 时间用 slice 格式化（YYYY-MM-DD HH:mm:ss），避免时区与 hydration 差异
function formatDate(value: string): string {
  return `${value.slice(0, 10)} ${value.slice(11, 19)}`;
}

export function SerialSearch() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SerialQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async (sn: string) => {
    const trimmed = sn.trim();
    if (!trimmed) {
      setError("请输入序列号");
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/serials?sn=${encodeURIComponent(trimmed)}`);
      const json = (await res.json()) as SerialQueryResponse & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "查询失败，请稍后再试");
        return;
      }
      setResult(json);
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void handleSearch(value);
  }

  const record = result?.exists ? result.data : null;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="请输入序列号"
          className="h-12 flex-1 rounded-lg bg-white px-4 text-base shadow-sm"
          aria-label="序列号"
          disabled={loading}
        />
        <Button type="submit" className="h-12 px-6" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Search />}
          {loading ? "查询中" : "查询"}
        </Button>
      </form>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">正在查询...</span>
        </div>
      )}

      {error && !loading && <p className="text-center text-sm font-medium text-destructive">{error}</p>}

      {result && !loading && !result.exists && (
        <Card className="rounded-lg">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <XCircle className="size-10 text-destructive" />
            <p className="text-lg font-semibold text-destructive">✗ 序列号不存在</p>
          </CardContent>
        </Card>
      )}

      {record && !loading && (
        <Card className="rounded-lg">
          <CardContent className="space-y-4 py-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1 border-transparent bg-emerald-100 px-3 py-1 text-emerald-700">
                <CheckCircle2 className="size-4" />
                ✓ 真实有效
              </Badge>
              <Badge variant={record.status === "active" ? "success" : "muted"}>
                {record.status === "active" ? "生效" : "失效"}
              </Badge>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="shrink-0 text-muted-foreground">激活时间</dt>
                <dd className="font-medium">{formatDate(record.activatedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="shrink-0 text-muted-foreground">持有者</dt>
                <dd className="font-medium">{record.holderName}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <p className="pt-2 text-center text-xs text-muted-foreground">
        <Link href="/login" className="transition-colors hover:text-slate-900">
          管理员登录
        </Link>
      </p>
    </div>
  );
}
