import Link from "next/link";
import type { QaQuestion } from "@/types/v2";

export function QaQuestionCard({ question, showTopic = true }: { question: QaQuestion; showTopic?: boolean }) {
  const answersCount = question.answers.filter((answer) => answer.status === "published").length;
  const accepted = Boolean(question.acceptedAnswerId);
  const authorLabel = question.isAnonymous ? "Anonimo" : question.authorDisplayName;

  return (
    <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {showTopic ? (
          <Link href={`/pregunta-a-un-coach/tema/${question.topicSlug}`} className="hover:text-zinc-700">
            {question.topicName}
          </Link>
        ) : null}
        {question.categorySlug ? (
          <Link href={`/pregunta-a-un-coach/categoria/${question.categorySlug}`} className="hover:text-zinc-700">
            {question.categorySlug}
          </Link>
        ) : null}
        {question.citySlug ? (
          <Link href={`/pregunta-a-un-coach/ciudad/${question.citySlug}`} className="hover:text-zinc-700">
            {question.citySlug}
          </Link>
        ) : null}
      </div>

      <h3 className="mt-3 text-lg font-black tracking-tight text-zinc-950">
        <Link href={`/pregunta-a-un-coach/${question.slug}`} className="hover:text-cyan-700">
          {question.title}
        </Link>
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-700">{question.body}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {question.tags.map((tag) => (
          <Link
            key={tag}
            href={`/pregunta-a-un-coach/tag/${tag}`}
            className="rounded-full border border-black/10 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-white"
          >
            #{tag}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4 text-sm">
        <div className="text-zinc-600">
          <span className="font-semibold text-zinc-800">{authorLabel}</span>
          <span className="mx-2 text-zinc-300">•</span>
          <span>{new Date(question.createdAt).toLocaleDateString("es-ES")}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">{question.views} vistas</span>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">{answersCount} respuestas</span>
          {accepted ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">Aceptada</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
