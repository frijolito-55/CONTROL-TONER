import { useState, type FormEvent } from "react";
import { apiFetch } from "../api";

interface LoginProps {
  onSuccess: (username: string) => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const iniciarSesion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.detail || "No se pudo iniciar sesión.");
      onSuccess(data.username);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo conectar con el servidor.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
        <div className="bg-slate-900 px-8 py-7 text-white">
          <div className="mb-5 inline-flex rounded bg-red-600 px-3 py-1.5 text-lg font-bold tracking-wider">
            KYOCERA
          </div>
          <h1 className="text-xl font-bold">Control Central de Tóner</h1>
          <p className="mt-1 text-sm text-slate-300">
            Inicia sesión para continuar
          </p>
        </div>

        <form onSubmit={iniciarSesion} className="space-y-4 p-8">
          {error && (
            <p
              role="alert"
              className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
          <label className="block text-sm font-semibold text-slate-700">
            Usuario
            <input
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={enviando}
              className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2.5 font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={enviando}
              className="mt-1.5 w-full rounded border border-slate-300 px-3 py-2.5 font-normal focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </label>
          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded bg-blue-700 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-wait disabled:bg-slate-400"
          >
            {enviando ? "Validando..." : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}
