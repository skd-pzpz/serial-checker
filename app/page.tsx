import { SerialSearch } from "@/components/serial-search";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">序列号查询系统</h1>
          <p className="mt-3 text-sm text-muted-foreground">输入序列号，快速验证产品真伪与状态</p>
        </div>
        <SerialSearch />
      </div>
    </main>
  );
}
