import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata } from "@/lib/seo";
import { getQaQuestionBySlug, getQaQuestionsList } from "@/lib/v2-mock";

type ParamsInput = Promise<{ questionSlug: string }>;

export async function generateMetadata({ params }: { params: ParamsInput }): Promise<Metadata> {
  const { questionSlug } = await params;
  const question = getQaQuestionBySlug(questionSlug);
  if (!question) return buildMetadata({ title: "Pregunta no encontrada", description: "Pregunta no encontrada", noindex: true });
  return buildMetadata({
    title: question.title,
    description: question.body.slice(0, 160),
    path: `/pregunta-a-un-coach/${question.slug}`,
  });
}

export default async function QaQuestionDetailPage({ params }: { params: ParamsInput }) {
  const { questionSlug } = await params;
  const question = getQaQuestionBySlug(questionSlug);
  if (!question) notFound();

  const answers = question.answers.filter((answer) => answer.status === "published");
  const related = getQaQuestionsList({ topicSlug: question.topicSlug }).filter((q) => q.id !== question.id).slice(0, 4);
  const authorLabel = question.isAnonymous ? "Anonimo" : question.authorDisplayName;

  const qaJsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: question.title,
      text: question.body,
      answerCount: answers.length,
      upvoteCount: question.votesTotal,
      dateCreated: question.createdAt,
      author: {
        "@type": "Person",
        name: authorLabel,
      },
      acceptedAnswer: question.acceptedAnswerId
        ? answers
            .filter((answer) => answer.id === question.acceptedAnswerId)
            .map((answer) => ({
              "@type": "Answer",
              text: answer.body,
              dateCreated: answer.createdAt,
              upvoteCount: answer.voteScore,
              author: {
                "@type": "Person",
                name: answer.coachName,
              },
            }))[0]
        : undefined,
      suggestedAnswer: answers.map((answer) => ({
        "@type": "Answer",
        text: answer.body,
        dateCreated: answer.createdAt,
        upvoteCount: answer.voteScore,
        author: {
          "@type": "Person",
          name: answer.coachName,
        },
      })),
    },
  };

  return (
    <>
      <JsonLd data={qaJsonLd} />
      <PageShell className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <Link href="/pregunta-a-un-coach" className="hover:text-zinc-700">
                Pregunta a un coach
              </Link>
              <span>•</span>
              <Link href={`/pregunta-a-un-coach/tema/${question.topicSlug}`} className="hover:text-zinc-700">
                {question.topicName}
              </Link>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">{question.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-600">
              <span>{authorLabel}</span>
              <span>•</span>
              <span>{new Date(question.createdAt).toLocaleDateString("es-ES")}</span>
              <span>•</span>
              <span>{question.views} vistas</span>
              <span>•</span>
              <span>{answers.length} respuestas</span>
            </div>
            <p className="mt-4 whitespace-pre-line leading-7 text-zinc-700">{question.body}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {question.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/pregunta-a-un-coach/tag/${tag}`}
                  className="rounded-full border border-black/10 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700"
                >
                  #{tag}
                </Link>
              ))}
            </div>

            <div className="mt-8 border-t border-black/5 pt-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-black tracking-tight text-zinc-950">Respuestas de coaches</h2>
                <button className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-zinc-900">
                  Responder (coach activo)
                </button>
              </div>

              {answers.length ? (
                <div className="mt-4 grid gap-3">
                  {answers.map((answer) => (
                    <article key={answer.id} className="rounded-2xl border border-black/10 bg-zinc-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <Link href={`/coaches/${answer.coachSlug}`} className="font-semibold text-zinc-900 hover:text-cyan-700">
                            {answer.coachName}
                          </Link>
                          <p className="text-xs text-zinc-500">{new Date(answer.createdAt).toLocaleString("es-ES")}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="rounded-full bg-white px-2.5 py-1 text-zinc-700">{answer.voteScore} votos</span>
                          {answer.accepted ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">Aceptada</span>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-700">{answer.body}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800">
                          Votar util
                        </button>
                        <button className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800">
                          Reportar
                        </button>
                        {!question.isAnonymous ? (
                          <button className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800">
                            Marcar aceptada
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-zinc-50 p-4 text-sm text-zinc-700">
                  Todavia no hay respuestas. Los coaches activos podran responder en V2.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Acciones</h2>
              <div className="mt-4 grid gap-2">
                <Link href="/pregunta-a-un-coach" className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900">
                  Ver mas preguntas
                </Link>
                <Link href={`/pregunta-a-un-coach/tema/${question.topicSlug}`} className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-900">
                  Ver tema {question.topicName}
                </Link>
                <button className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-left text-sm font-semibold text-zinc-900">
                  Seguir pregunta (notificaciones)
                </button>
                <button className="rounded-xl border border-black/10 bg-zinc-50 px-3 py-2 text-left text-sm font-semibold text-zinc-900">
                  Reportar contenido
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-zinc-950">Preguntas relacionadas</h2>
              <div className="mt-4 grid gap-3">
                {related.map((item) => (
                  <Link key={item.id} href={`/pregunta-a-un-coach/${item.slug}`} className="rounded-xl border border-black/10 bg-zinc-50 p-3 hover:bg-white">
                    <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                    <p className="mt-1 text-xs text-zinc-600">{item.answers.length} respuestas</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </PageShell>
    </>
  );
}
