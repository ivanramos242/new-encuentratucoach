import { QaQuestionCard } from "@/components/qa/question-card";
import type { QaQuestion } from "@/types/v2";

export function QaQuestionListing({
  questions,
  emptyTitle = "No hay preguntas publicadas",
  emptyDescription = "Prueba otro filtro o crea una nueva pregunta.",
}: {
  questions: QaQuestion[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!questions.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/15 bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-black tracking-tight text-zinc-950">{emptyTitle}</h3>
        <p className="mt-2 text-zinc-700">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {questions.map((question) => (
        <QaQuestionCard key={question.id} question={question} />
      ))}
    </div>
  );
}
