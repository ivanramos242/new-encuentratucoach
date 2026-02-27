"use client";

import { useRouter } from "next/navigation";
import { setClientMockAuthenticated } from "@/lib/favorites-client";

export function MockClientLoginCard({ returnTo }: { returnTo?: string }) {
  const router = useRouter();

  function onLogin() {
    setClientMockAuthenticated(true);
    router.push(returnTo && returnTo.startsWith("/") ? returnTo : "/mi-cuenta/cliente");
  }

  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black tracking-tight text-zinc-950">Acceso rapido (demo)</h2>
      <p className="mt-2 text-sm text-zinc-700">
        En esta version V1 puedes simular acceso como cliente para probar favoritos y panel de cliente.
      </p>
      <button
        type="button"
        onClick={onLogin}
        className="mt-4 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
      >
        Entrar como cliente demo
      </button>
    </div>
  );
}
