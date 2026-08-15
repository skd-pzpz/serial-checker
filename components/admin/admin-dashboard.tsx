"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  CheckCircle2,
  Hash,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SerialRecord, SerialStatus } from "@/lib/types";

// 时间用 slice 格式化（YYYY-MM-DD HH:mm:ss），避免时区与 hydration 差异
function formatDate(value: string): string {
  return `${value.slice(0, 10)} ${value.slice(11, 19)}`;
}

export function AdminDashboard() {
  const router = useRouter();

  const [records, setRecords] = useState<SerialRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 添加表单
  const [serialNumber, setSerialNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [status, setStatus] = useState<SerialStatus>("active");
  const [adding, setAdding] = useState(false);

  // 删除确认
  const [deleteTarget, setDeleteTarget] = useState<SerialRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 状态切换中
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/serials");
      const json = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(json)) {
        toast.error(json?.error ?? "加载失败");
        return;
      }
      setRecords(json);
    } catch {
      toast.error("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const stats = {
    total: records.length,
    active: records.filter((r) => r.status === "active").length,
    inactive: records.filter((r) => r.status === "inactive").length,
  };

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!serialNumber.trim() || !holderName.trim()) {
      toast.error("请填写序列号和持有者姓名");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/admin/serials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNumber: serialNumber.trim(),
          holderName: holderName.trim(),
          status,
        }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        toast.error(json?.error ?? "添加失败");
        return;
      }

      toast.success("序列号添加成功");
      setSerialNumber("");
      setHolderName("");
      setStatus("active");
      void fetchList();
    } catch {
      toast.error("网络错误，请稍后再试");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleStatus(record: SerialRecord) {
    const next = record.status === "active" ? "inactive" : "active";
    setTogglingId(record.id);
    try {
      const res = await fetch(`/api/admin/serials/${record.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(json?.error ?? "更新失败");
        return;
      }
      toast.success(`已${next === "active" ? "生效" : "失效"}`);
      void fetchList();
    } catch {
      toast.error("网络错误，请稍后再试");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/serials/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error(json?.error ?? "删除失败");
        return;
      }
      toast.success("删除成功");
      setDeleteTarget(null);
      void fetchList();
    } catch {
      toast.error("网络错误，请稍后再试");
    } finally {
      setDeleting(false);
    }
  }

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }

  const statCards = [
    { key: "total", label: "总序列号数", value: stats.total, icon: Hash, iconClass: "text-primary" },
    { key: "active", label: "生效中数量", value: stats.active, icon: CheckCircle2, iconClass: "text-emerald-600" },
    { key: "inactive", label: "已失效数量", value: stats.inactive, icon: XCircle, iconClass: "text-slate-400" },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <h1 className="text-lg font-semibold">管理后台</h1>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut />
            登出
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* 统计卡片 */}
        <div className="grid gap-4 sm:grid-cols-3">
          {statCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.key} className="rounded-xl">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                  <Icon className={`size-5 ${item.iconClass}`} />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-3xl font-bold tabular-nums">{item.value}</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 添加表单 */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">添加序列号</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-[1fr_1fr_180px_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="serial-number">序列号</Label>
                <Input
                  id="serial-number"
                  placeholder="请输入序列号"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  disabled={adding}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holder-name">持有者姓名</Label>
                <Input
                  id="holder-name"
                  placeholder="请输入持有者姓名"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  disabled={adding}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as SerialStatus)} disabled={adding}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">生效</SelectItem>
                    <SelectItem value="inactive">失效</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={adding} className="h-9">
                {adding ? <Loader2 className="animate-spin" /> : <Plus />}
                {adding ? "提交中..." : "添加"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 列表表格 */}
        <Card className="rounded-xl">
          <CardContent className="p-0 sm:p-0">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-base font-semibold">序列号列表</h2>
              <Button variant="ghost" size="sm" onClick={() => void fetchList()} disabled={loading}>
                <RefreshCw className={loading ? "animate-spin" : ""} />
                刷新
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">ID</TableHead>
                  <TableHead>序列号</TableHead>
                  <TableHead>持有者</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>激活时间</TableHead>
                  <TableHead className="w-40 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.id}</TableCell>
                      <TableCell className="font-mono">{record.serialNumber}</TableCell>
                      <TableCell>{record.holderName}</TableCell>
                      <TableCell>
                        <Badge variant={record.status === "active" ? "success" : "muted"}>
                          {record.status === "active" ? "生效" : "失效"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(record.activatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={togglingId === record.id}
                            onClick={() => void handleToggleStatus(record)}
                          >
                            {togglingId === record.id ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              <RefreshCw />
                            )}
                            {record.status === "active" ? "设为失效" : "设为生效"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="删除"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(record)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除序列号{" "}
              <span className="font-mono font-medium text-foreground">
                {deleteTarget?.serialNumber}
              </span>{" "}
              吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
