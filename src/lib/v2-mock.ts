import { coaches, coachCategories, cities } from "@/lib/mock-data";
import type {
  FunnelSummary,
  JobRecord,
  MessageAttachment,
  MessageThread,
  NotificationPreferenceRecord,
  NotificationRecord,
  QaAnswer,
  QaQuestion,
  QaTopic,
} from "@/types/v2";

const now = new Date();
const isoMinutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60_000).toISOString();

export const qaTopics: QaTopic[] = [
  {
    slug: "elegir-coach",
    name: "Elegir coach",
    description: "Dudas sobre como elegir un coach adecuado para tu objetivo.",
    curated: true,
  },
  {
    slug: "precios",
    name: "Precios de coaching",
    description: "Preguntas sobre precios, formatos y sesiones.",
    curated: true,
  },
  {
    slug: "modalidad-online",
    name: "Coaching online",
    description: "Preguntas sobre sesiones online, herramientas y seguimiento.",
    curated: true,
  },
  {
    slug: "certificacion",
    name: "Certificacion",
    description: "Dudas sobre certificaciones y experiencia de coaches.",
    curated: true,
  },
];

function makeAnswer(input: Partial<QaAnswer> & Pick<QaAnswer, "id" | "questionId" | "body" | "coachProfileId">): QaAnswer {
  const coach = coaches.find((c) => c.id === input.coachProfileId) ?? coaches[0];
  return {
    id: input.id,
    questionId: input.questionId,
    coachProfileId: coach.id,
    coachName: coach.name,
    coachSlug: coach.slug,
    coachIsActive: true,
    body: input.body,
    status: input.status ?? "published",
    voteScore: input.voteScore ?? 0,
    votesCount: input.votesCount ?? 0,
    accepted: input.accepted ?? false,
    createdAt: input.createdAt ?? isoMinutesAgo(120),
  };
}

export const qaQuestions: QaQuestion[] = [
  {
    id: "q-1",
    slug: "como-elegir-coach-de-carrera-si-estoy-bloqueado",
    title: "Como elegir un coach de carrera si estoy bloqueado con varias opciones",
    body: "Quiero cambiar de trabajo pero no tengo claro si necesito coaching de carrera o un coach de liderazgo. Trabajo en tecnologia y me bloquea tomar decisiones. Como elegir bien?",
    authorUserId: "user-client-1",
    authorDisplayName: "Carlos M.",
    isAnonymous: false,
    status: "published",
    topicSlug: "elegir-coach",
    topicName: "Elegir coach",
    categorySlug: "carrera",
    citySlug: "madrid",
    tags: ["carrera", "liderazgo", "decision"],
    answers: [
      makeAnswer({
        id: "qa-ans-1",
        questionId: "q-1",
        coachProfileId: coaches[2]?.id ?? coaches[0].id,
        body: "Empieza definiendo el objetivo en una frase. Si el foco es cambio profesional, un coach de carrera suele encajar mejor. Si ya gestionas equipo y el bloqueo afecta a liderazgo, entonces liderazgo.",
        votesCount: 6,
        voteScore: 5,
        accepted: true,
        createdAt: isoMinutesAgo(300),
      }),
      makeAnswer({
        id: "qa-ans-2",
        questionId: "q-1",
        coachProfileId: coaches[0]?.id ?? coaches[0].id,
        body: "Puedes hacer una llamada breve con dos perfiles y comparar su metodo. Mira claridad en proceso, no solo experiencia.",
        votesCount: 3,
        voteScore: 2,
        createdAt: isoMinutesAgo(280),
      }),
    ],
    acceptedAnswerId: "qa-ans-1",
    views: 184,
    votesTotal: 7,
    createdAt: isoMinutesAgo(360),
    updatedAt: isoMinutesAgo(260),
  },
  {
    id: "q-2",
    slug: "precio-normal-coaching-personal-online-espana",
    title: "Cual es un precio normal para coaching personal online en Espana",
    body: "Estoy viendo precios muy distintos para coaching personal online. Que rango es razonable para empezar sin pagar de mas?",
    authorUserId: "user-client-2",
    authorDisplayName: "Anonimo",
    isAnonymous: true,
    status: "published",
    topicSlug: "precios",
    topicName: "Precios de coaching",
    categorySlug: "personal",
    citySlug: "barcelona",
    tags: ["precio", "personal", "online"],
    answers: [
      makeAnswer({
        id: "qa-ans-3",
        questionId: "q-2",
        coachProfileId: coaches[1]?.id ?? coaches[0].id,
        body: "Para coaching personal online es habitual ver desde 60 EUR a 120 EUR por sesion, segun experiencia y formato. Valora tambien si incluye seguimiento.",
        votesCount: 8,
        voteScore: 8,
        createdAt: isoMinutesAgo(95),
      }),
    ],
    views: 241,
    votesTotal: 8,
    createdAt: isoMinutesAgo(130),
    updatedAt: isoMinutesAgo(90),
  },
  {
    id: "q-3",
    slug: "coaching-online-funciona-igual-que-presencial",
    title: "El coaching online funciona igual que el presencial",
    body: "Tengo dudas sobre si una sesion online puede ser igual de util que una presencial para trabajar habitos y claridad.",
    authorUserId: "user-client-3",
    authorDisplayName: "Laura S.",
    isAnonymous: false,
    status: "published",
    topicSlug: "modalidad-online",
    topicName: "Coaching online",
    categorySlug: "personal",
    citySlug: "sevilla",
    tags: ["online", "presencial", "habitos"],
    answers: [],
    views: 67,
    votesTotal: 0,
    createdAt: isoMinutesAgo(45),
    updatedAt: isoMinutesAgo(45),
  },
  {
    id: "q-4",
    slug: "que-certificacion-de-coach-es-mas-relevante",
    title: "Que certificacion de coach es mas relevante al comparar perfiles",
    body: "Estoy comparando coaches y veo siglas distintas. Que certificaciones conviene mirar y que peso les doy frente a reseñas o experiencia?",
    authorUserId: "user-client-4",
    authorDisplayName: "Anonimo",
    isAnonymous: true,
    status: "published",
    topicSlug: "certificacion",
    topicName: "Certificacion",
    tags: ["certificacion", "icf", "comparar"],
    answers: [
      makeAnswer({
        id: "qa-ans-4",
        questionId: "q-4",
        coachProfileId: coaches[0]?.id ?? coaches[0].id,
        body: "Mira certificacion, especialidad y resultados/experiencia. La certificacion suma confianza, pero el encaje con tu objetivo y el metodo importa mucho.",
        votesCount: 5,
        voteScore: 4,
        createdAt: isoMinutesAgo(220),
      }),
    ],
    views: 121,
    votesTotal: 4,
    createdAt: isoMinutesAgo(260),
    updatedAt: isoMinutesAgo(210),
  },
];

export const messageThreads: MessageThread[] = [
  {
    id: "thread-1",
    clientUserId: "user-client-1",
    clientName: "Carlos Martinez",
    coachUserId: "user-coach-1",
    coachProfileId: coaches[0]?.id ?? "coach-1",
    coachName: coaches[0]?.name ?? "Coach",
    coachSlug: coaches[0]?.slug ?? "coach",
    coachMembershipActive: true,
    status: "open",
    unreadForCoach: 1,
    unreadForClient: 0,
    lastMessageAt: isoMinutesAgo(6),
    createdAt: isoMinutesAgo(180),
    messages: [
      {
        id: "msg-1",
        threadId: "thread-1",
        senderType: "client",
        senderUserId: "user-client-1",
        senderLabel: "Carlos Martinez",
        body: "Hola Cristina. Estoy valorando un cambio de trabajo y me gustaria saber como trabajas objetivos de carrera.",
        createdAt: isoMinutesAgo(180),
        readByOtherSide: true,
      },
      {
        id: "msg-2",
        threadId: "thread-1",
        senderType: "coach",
        senderUserId: "user-coach-1",
        senderLabel: coaches[0]?.name ?? "Coach",
        body: "Hola Carlos. Podemos empezar con una sesion de diagnostico para definir objetivo, contexto y siguientes pasos.",
        createdAt: isoMinutesAgo(160),
        readByOtherSide: true,
      },
      {
        id: "msg-3",
        threadId: "thread-1",
        senderType: "client",
        senderUserId: "user-client-1",
        senderLabel: "Carlos Martinez",
        body: "Perfecto. Te envio un resumen de mi situacion en PDF.",
        createdAt: isoMinutesAgo(6),
        readByOtherSide: false,
        attachment: {
          id: "att-1",
          type: "pdf",
          status: "validated",
          fileName: "resumen-objetivo.pdf",
          mimeType: "application/pdf",
          sizeBytes: 241233,
          storageKey: "chat-attachments/thread-1/msg-3/resumen-objetivo.pdf",
          downloadUrl: "/api/messages/attachments/mock/att-1",
        },
      },
    ],
  },
  {
    id: "thread-2",
    clientUserId: "user-client-2",
    clientName: "Marta Rios",
    coachUserId: "user-coach-2",
    coachProfileId: coaches[1]?.id ?? "coach-2",
    coachName: coaches[1]?.name ?? "Coach",
    coachSlug: coaches[1]?.slug ?? "coach-2",
    coachMembershipActive: false,
    status: "open",
    unreadForCoach: 0,
    unreadForClient: 2,
    lastMessageAt: isoMinutesAgo(25),
    createdAt: isoMinutesAgo(600),
    messages: [
      {
        id: "msg-4",
        threadId: "thread-2",
        senderType: "coach",
        senderUserId: "user-coach-2",
        senderLabel: coaches[1]?.name ?? "Coach",
        body: "Puedo ayudarte con habitos y seguimiento semanal. Si te encaja, empezamos con una sesion inicial.",
        createdAt: isoMinutesAgo(40),
        readByOtherSide: false,
      },
    ],
  },
];

export const notificationRecords: NotificationRecord[] = [
  {
    id: "notif-1",
    userId: "user-coach-1",
    type: "message_new",
    title: "Nuevo mensaje en tu inbox",
    body: "Carlos Martinez te ha enviado un mensaje en la conversacion con Cristina Torres dos Santos.",
    isRead: false,
    createdAt: isoMinutesAgo(6),
    data: { threadId: "thread-1" },
  },
  {
    id: "notif-2",
    userId: "user-client-1",
    type: "qa_answer_accepted",
    title: "Respuesta aceptada en una pregunta del Q&A",
    body: "Una respuesta ha sido marcada como aceptada en una pregunta que seguias.",
    isRead: true,
    createdAt: isoMinutesAgo(180),
    data: { questionId: "q-1" },
  },
  {
    id: "notif-3",
    userId: "user-admin-1",
    type: "qa_content_reported",
    title: "Nuevo reporte de contenido Q&A",
    body: "Se ha reportado una respuesta en Pregunta a un coach.",
    isRead: false,
    createdAt: isoMinutesAgo(15),
    data: { reportId: "qa-report-1" },
  },
];

const defaultNotifTypes = [
  "message_new",
  "message_reply",
  "qa_question_answered",
  "qa_answer_accepted",
  "review_new_pending",
  "review_coach_action_required",
  "subscription_state_changed",
  "system_announcement",
] as const;

export const notificationPreferences: NotificationPreferenceRecord[] = defaultNotifTypes.flatMap((type, index) => [
  {
    id: `pref-${index}-inapp`,
    userId: "user-coach-1",
    type,
    channel: "in_app",
    enabled: true,
    digestMode: "instant",
  },
  {
    id: `pref-${index}-email`,
    userId: "user-coach-1",
    type,
    channel: "email",
    enabled: type === "system_announcement" ? false : true,
    digestMode: "instant",
  },
]);

export const jobQueueRecords: JobRecord[] = [
  {
    id: "job-1",
    type: "send_email_notification",
    status: "queued",
    priority: "normal",
    scheduledAt: isoMinutesAgo(0),
    attempts: 0,
    maxAttempts: 5,
    payload: { notificationId: "notif-1", channel: "email" },
  },
  {
    id: "job-2",
    type: "recalc_funnel_aggregates",
    status: "queued",
    priority: "low",
    scheduledAt: isoMinutesAgo(0),
    attempts: 1,
    maxAttempts: 5,
    payload: { date: new Date().toISOString().slice(0, 10) },
  },
  {
    id: "job-3",
    type: "retry_email_notification",
    status: "failed",
    priority: "high",
    scheduledAt: isoMinutesAgo(10),
    attempts: 3,
    maxAttempts: 5,
    payload: { notificationId: "notif-99" },
    lastError: "SMTP timeout",
  },
];

export const funnelSummaryByCoach: FunnelSummary[] = coaches.slice(0, 3).map((coach, index) => ({
  coachProfileId: coach.id,
  periodLabel: "Ultimos 30 dias",
  counts: {
    profile_view: 200 + index * 80,
    profile_cta_click: 46 + index * 12,
    chat_thread_started: 18 + index * 4,
    chat_first_coach_reply: 14 + index * 3,
    chat_client_followup: 9 + index * 2,
    qa_question_view: 40 + index * 10,
    qa_question_created: 4 + index,
    qa_answer_created: 7 + index * 2,
    qa_answer_accepted: 3 + index,
    review_created: 5 + index,
    review_approved: 4 + index,
  },
  conversionRates: {
    profileToChatStart: 0.09 + index * 0.01,
    chatStartToFirstReply: 0.78 + index * 0.03,
    qaQuestionToAnswer: 0.62 + index * 0.05,
  },
}));

export const platformFunnelSummary: FunnelSummary = {
  periodLabel: "Ultimos 30 dias",
  counts: {
    profile_view: 1820,
    profile_cta_click: 382,
    chat_thread_started: 141,
    chat_first_coach_reply: 112,
    chat_client_followup: 86,
    qa_question_view: 920,
    qa_question_created: 61,
    qa_answer_created: 132,
    qa_answer_accepted: 39,
    review_created: 44,
    review_approved: 37,
  },
  conversionRates: {
    profileToChatStart: 0.077,
    chatStartToFirstReply: 0.794,
    qaQuestionToAnswer: 0.73,
  },
};

export function getQaQuestionBySlug(slug: string) {
  return qaQuestions.find((q) => q.slug === slug && q.status === "published");
}

export function getQaQuestionsList(filters?: {
  topicSlug?: string;
  categorySlug?: string;
  citySlug?: string;
  q?: string;
  tagSlug?: string;
}) {
  let items = qaQuestions.filter((q) => q.status === "published");

  if (filters?.topicSlug) items = items.filter((q) => q.topicSlug === filters.topicSlug);
  if (filters?.categorySlug) items = items.filter((q) => q.categorySlug === filters.categorySlug);
  if (filters?.citySlug) items = items.filter((q) => q.citySlug === filters.citySlug);
  if (filters?.tagSlug) items = items.filter((q) => q.tags.includes(filters.tagSlug!));
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }

  return items.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

export function getQaTopicBySlug(slug: string) {
  return qaTopics.find((topic) => topic.slug === slug);
}

export function getQaCuratedCategories() {
  return coachCategories.map((category) => ({
    slug: category.slug,
    name: category.name,
    description: category.shortDescription,
    questionsCount: qaQuestions.filter((q) => q.categorySlug === category.slug).length,
  }));
}

export function getQaCuratedCities() {
  return cities.map((city) => ({
    slug: city.slug,
    name: city.name,
    questionsCount: qaQuestions.filter((q) => q.citySlug === city.slug).length,
  }));
}

export function getMessageThreadsForActor(role: "coach" | "client") {
  return [...messageThreads]
    .filter((thread) => (role === "coach" ? !!thread.coachUserId : !!thread.clientUserId))
    .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
}

export function getMessageThreadById(threadId: string) {
  return messageThreads.find((thread) => thread.id === threadId);
}

export function getNotificationsForUser(userId: string) {
  return notificationRecords
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getNotificationPreferencesForUser(userId: string) {
  return notificationPreferences.filter((pref) => pref.userId === userId);
}

export function getJobsSnapshot() {
  return [...jobQueueRecords].sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
}

export function getFunnelSummaryForCoach(coachProfileId: string) {
  return funnelSummaryByCoach.find((item) => item.coachProfileId === coachProfileId) ?? funnelSummaryByCoach[0];
}

export function findCoachBySlug(slug: string) {
  return coaches.find((coach) => coach.slug === slug);
}

export function buildMockAttachmentPresignResponse(input: {
  fileName: string;
  mimeType: string;
  threadId?: string;
}): { uploadUrl: string; storageKey: string } {
  const threadId = input.threadId ?? "pending-thread";
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storageKey = `chat-attachments/${threadId}/temp/${Date.now()}-${safeName}`;
  return {
    uploadUrl: `/api/messages/attachments/mock-upload?key=${encodeURIComponent(storageKey)}`,
    storageKey,
  };
}

export function sampleMessageAttachment(): MessageAttachment {
  return {
    id: "att-mock",
    type: "image",
    status: "validated",
    fileName: "captura.png",
    mimeType: "image/png",
    sizeBytes: 123456,
    storageKey: "chat-attachments/thread-mock/temp/captura.png",
    downloadUrl: "/api/messages/attachments/mock/att-mock",
  };
}
