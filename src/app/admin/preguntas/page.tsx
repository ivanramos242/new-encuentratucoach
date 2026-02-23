import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { PageShell } from "@/components/layout/page-shell";
import { getQaReports, listQaQuestions } from "@/lib/v2-service";

export default function AdminQuestionsPage() {
  const questions = listQaQuestions().slice(0, 20);
  const reportsOpen = getQaReports().filter((report) => report.status === "open").length;

  return (
    <>
      <PageHero
        badge="Admin · V2"
        title="Moderacion de preguntas (Q&A)"
        description="Panel admin para revisar preguntas, respuestas, contenido reportado y estados de visibilidad del modulo Pregunta a un coach."
      />
      <PageShell className="pt-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">{questions.length} preguntas (vista actual)</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">{reportsOpen} reportes abiertos</span>
          </div>
          <Link href="/admin/preguntas/reportes" className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-zinc-900">
            Ver reportes
          </Link>
        </div>
        <div className="grid gap-3">
          {questions.map((question) => (
            <article key={question.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{question.topicName}</p>
                  <h2 className="text-lg font-black tracking-tight text-zinc-950">{question.title}</h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">{question.answers.length} respuestas</span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">{question.status}</span>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-700">{question.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-lg border border-black/10 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800">Ocultar</button>
                <button className="rounded-lg border border-black/10 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800">Bloquear</button>
                <button className="rounded-lg border border-black/10 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-800">Restaurar</button>
              </div>
            </article>
          ))}
        </div>
      </PageShell>
    </>
  );
}

