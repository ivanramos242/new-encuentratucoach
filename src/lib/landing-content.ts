export interface LandingHeroContent {
  badge: string;
  title: string;
  description: string;
}

export interface LandingFaqItem {
  q: string;
  a: string;
}

export interface LandingContextLink {
  label: string;
  href: string;
}

export interface LandingExploreCard {
  title: string;
  description: string;
  href: string;
  ctaLabel?: string;
}

export interface LandingSeoContent {
  title: string;
  metaDescription: string;
  keywords: string[];
  hero: LandingHeroContent;
  faq: LandingFaqItem[];
}

type CategoryLike = { slug: string; name: string; shortDescription: string };

export function getCitySeoContent(citySlug: string, cityName: string): LandingSeoContent {
  const cityLower = cityName.toLowerCase();

  if (citySlug === "madrid") {
    return {
      title: "Buscar coach en Madrid",
      metaDescription:
        "Busca coach en Madrid por especialidad, modalidad, precio y señales de confianza. Compara perfiles y contacta directamente.",
      keywords: [
        "buscar coach madrid",
        "coach madrid",
        "coach en madrid",
        "coaching madrid",
        "coach profesional madrid",
        "coach madrid precio",
      ],
      hero: {
        badge: "Ciudad",
        title: "Encuentra coach en Madrid con mejor encaje",
        description:
          "Compara perfiles reales en Madrid por especialidad, modalidad y precio para contactar solo con coaches que encajan contigo.",
      },
      faq: [
        {
          q: "¿Cómo elegir coach en Madrid sin perder tiempo?",
          a: "Define tu objetivo, presupuesto y modalidad. Compara dos o tres perfiles y escribe primero a los que mejor encajen.",
        },
        {
          q: "¿Qué rango de precio es habitual en Madrid?",
          a: "Depende de la especialidad y experiencia. Aquí puedes comparar perfiles con precio base visible por sesión.",
        },
      ],
    };
  }

  if (citySlug === "barcelona") {
    return {
      title: "Buscar coach en Barcelona",
      metaDescription:
        "Busca coach en Barcelona por especialidad, formato de sesión y rango de precio. Compara perfiles antes de contactar.",
      keywords: [
        "buscar coach barcelona",
        "coach barcelona",
        "coach en barcelona",
        "coaching barcelona",
        "coach personal barcelona",
      ],
      hero: {
        badge: "Ciudad",
        title: "Coaches en Barcelona listos para empezar proceso",
        description:
          "Filtra por enfoque, formato y presupuesto para contactar perfiles con mayor probabilidad de encaje.",
      },
      faq: [
        {
          q: "¿Puedo encontrar coach online si vivo en Barcelona?",
          a: "Sí. Puedes comparar perfiles de Barcelona y también coaches que trabajan 100% online.",
        },
        {
          q: "¿Cómo comparar perfiles de forma rápida?",
          a: "Empieza por la especialidad, revisa experiencia y usa el rango de precio para acotar opciones.",
        },
      ],
    };
  }

  return {
    title: `Buscar coach en ${cityName}`,
    metaDescription: `Busca coach en ${cityName} por especialidad, modalidad y presupuesto. Compara perfiles antes de contactar.`,
    keywords: [`buscar coach ${cityLower}`, `coach en ${cityLower}`, `coaching ${cityLower}`],
    hero: {
      badge: "Ciudad",
      title: `Coaches en ${cityName} para decidir con criterio`,
      description:
        "Explora perfiles por especialidad y formato. Compara precio, experiencia y confianza antes de contactar.",
    },
    faq: [
      {
        q: `¿Cómo empezar a buscar coach en ${cityName}?`,
        a: "Empieza por tu objetivo principal y compara perfiles con experiencia en ese tipo de proceso.",
      },
      {
        q: "¿Es mejor online o presencial?",
        a: "Depende de agenda y preferencia. Online amplía opciones; presencial aporta cercanía local.",
      },
    ],
  };
}

export function getCategorySeoContent(category: CategoryLike): LandingSeoContent {
  const lower = category.name.toLowerCase();

  if (category.slug === "personal") {
    return {
      title: "Buscar coaching personal en España",
      metaDescription:
        "Busca coaches de desarrollo personal en España por ciudad, modalidad y precio. Compara perfiles y elige mejor.",
      keywords: ["coaching personal", "buscar coach personal", "coach personal madrid", "coaching personal online"],
      hero: {
        badge: "Especialidad",
        title: "Coaching personal para objetivos concretos y accionables",
        description:
          "Encuentra coaches para claridad, autoestima y foco. Compara perfiles por ciudad, modalidad y precio.",
      },
      faq: [
        {
          q: "¿Cuándo tiene sentido buscar coaching personal?",
          a: "Cuando buscas acompañamiento estructurado para cambiar hábitos, tomar decisiones o ganar foco.",
        },
        {
          q: "¿Qué conviene revisar antes de elegir coach?",
          a: "Metodología, experiencia en casos parecidos, formato de sesión y ajuste de precio.",
        },
      ],
    };
  }

  if (category.slug === "carrera") {
    return {
      title: "Buscar coaching de carrera en España",
      metaDescription:
        "Encuentra coaches de carrera en España. Compara experiencia, modalidad y precio por sesión antes de contactar.",
      keywords: ["coaching de carrera", "buscar coach de carrera", "coach profesional", "coaching carrera online"],
      hero: {
        badge: "Especialidad",
        title: "Coaching de carrera para transición laboral y crecimiento",
        description:
          "Compara coaches para cambio laboral, posicionamiento y decisiones profesionales con impacto.",
      },
      faq: [
        {
          q: "¿Para qué sirve el coaching de carrera?",
          a: "Ayuda a definir tu siguiente paso profesional y a ejecutar un plan con mayor claridad.",
        },
        {
          q: "¿Cómo comparar coaches de carrera?",
          a: "Prioriza experiencia en transición profesional y una metodología aplicable a tu contexto.",
        },
      ],
    };
  }

  return {
    title: `Buscar ${category.name} en España`,
    metaDescription: `Encuentra ${lower} en España por ciudad, modalidad y presupuesto. Compara perfiles antes de contactar.`,
    keywords: [lower, `buscar coach ${lower}`, `${lower} españa`],
    hero: {
      badge: "Especialidad",
      title: `${category.name} en España para elegir mejor`,
      description: `${category.shortDescription} Compara opciones por ciudad, formato y precio antes de contactar.`,
    },
    faq: [
      {
        q: `¿Cómo elegir ${lower}?`,
        a: "Define tu objetivo, compara enfoque de trabajo y filtra por modalidad y rango de precio.",
      },
      {
        q: "¿Cuántos perfiles conviene comparar?",
        a: "Entre dos y tres perfiles suele ser suficiente para detectar el mejor encaje.",
      },
    ],
  };
}

export function getCategoryCitySeoContent(
  categorySlug: string,
  citySlug: string,
  categoryName: string,
  cityName: string,
): LandingSeoContent {
  if (categorySlug === "liderazgo" && citySlug === "madrid") {
    return {
      title: "Buscar coaching de liderazgo en Madrid",
      metaDescription:
        "Busca coaches de liderazgo en Madrid por experiencia, modalidad y precio. Compara perfiles antes de contactar.",
      keywords: [
        "coach liderazgo madrid",
        "buscar coach liderazgo madrid",
        "coach directivo madrid",
      ],
      hero: {
        badge: "Especialidad + ciudad",
        title: "Coaching de liderazgo en Madrid para decidir con confianza",
        description:
          "Encuentra coaches para comunicación, gestión de equipos y toma de decisiones en contexto profesional.",
      },
      faq: [
        {
          q: "¿En qué casos ayuda el coaching de liderazgo?",
          a: "Suele enfocarse en comunicación, delegación, conflictos y toma de decisiones con equipos.",
        },
        {
          q: "¿Qué revisar antes de elegir coach?",
          a: "Experiencia en liderazgo real, enfoque metodológico y compatibilidad de formato.",
        },
      ],
    };
  }

  const categoryLower = categoryName.toLowerCase();
  const cityLower = cityName.toLowerCase();

  return {
    title: `Buscar ${categoryName} en ${cityName}`,
    metaDescription: `Encuentra ${categoryLower} en ${cityName}. Compara perfiles por modalidad, experiencia y precio.`,
    keywords: [`${categoryLower} ${cityLower}`, `buscar ${categoryLower} ${cityLower}`, `${categoryLower} en ${cityLower}`],
    hero: {
      badge: "Especialidad + ciudad",
      title: `${categoryName} en ${cityName} para elegir con menos riesgo`,
      description:
        "Compara perfiles de esta especialidad en tu ciudad y contacta con una shortlist clara.",
    },
    faq: [
      {
        q: `¿Cómo elegir ${categoryLower} en ${cityName}?`,
        a: "Revisa experiencia específica, modalidad de sesión y presupuesto antes de contactar.",
      },
      {
        q: "¿Online o presencial para este tipo de proceso?",
        a: "Ambos funcionan. Elige por disponibilidad, estilo de trabajo y nivel de comodidad.",
      },
    ],
  };
}

export function getOnlineSeoContent(): LandingSeoContent {
  return {
    title: "Buscar coaching online en España",
    metaDescription:
      "Encuentra coaches online en España por especialidad, experiencia, confianza y precio. Compara perfiles antes de elegir.",
    keywords: ["coaching online", "buscar coach online", "coaching online españa"],
    hero: {
      badge: "Modalidad",
      title: "Coaching online para empezar antes y sin desplazamientos",
      description:
        "Compara coaches online por especialidad, enfoque y precio para elegir con más claridad.",
    },
    faq: [
      {
        q: "¿Qué ventajas tiene el coaching online?",
        a: "Más flexibilidad horaria, mayor oferta de perfiles y continuidad sin desplazamientos.",
      },
      {
        q: "¿Funciona igual que presencial?",
        a: "Sí, cuando hay objetivos claros, seguimiento y una dinámica de sesiones consistente.",
      },
    ],
  };
}

export function getCertifiedSeoContent(): LandingSeoContent {
  return {
    title: "Buscar coaches certificados en España",
    metaDescription:
      "Encuentra coaches certificados en España. Compara especialidad, ciudad y precio con más señales de confianza.",
    keywords: ["coach certificado", "buscar coach certificado", "coaching certificado españa"],
    hero: {
      badge: "Confianza",
      title: "Coaches certificados para elegir con mayor seguridad",
      description:
        "Perfiles con certificación verificada para comparar opciones y contactar con más confianza.",
    },
    faq: [
      {
        q: "¿Qué significa que un coach esté certificado aquí?",
        a: "Que ha presentado documentación y fue validada en el proceso de revisión de la plataforma.",
      },
      {
        q: "¿La certificación es lo único que debo revisar?",
        a: "No. También conviene evaluar enfoque, experiencia, modalidad y reseñas.",
      },
    ],
  };
}
