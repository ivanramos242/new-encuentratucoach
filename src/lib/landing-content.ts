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
      title: "Coach en Madrid",
      metaDescription:
        "Encuentra coaches en Madrid y compara perfiles por especialidad, modalidad, certificacion y precio.",
      keywords: [
        "coach madrid",
        "coach en madrid",
        "coaching madrid",
        "coach profesional madrid",
        "coach madrid precio",
      ],
      hero: {
        badge: "Ciudad",
        title: "Encuentra tu coach en Madrid",
        description:
          "Compara perfiles reales por especialidad, modalidad y presupuesto para decidir con mas claridad y menos ruido.",
      },
      faq: [
        {
          q: "Como elegir coach en Madrid sin perder tiempo?",
          a: "Define objetivo, presupuesto y modalidad. Compara 2 o 3 perfiles y contacta con un mensaje concreto.",
        },
        {
          q: "Que rango de precio es habitual en Madrid?",
          a: "Depende de especialidad y experiencia. Aqui puedes comparar perfiles por precio base por sesion.",
        },
      ],
    };
  }

  if (citySlug === "barcelona") {
    return {
      title: "Coach en Barcelona",
      metaDescription:
        "Encuentra coaches en Barcelona y compara opciones por especialidad, modalidad y rango de precio.",
      keywords: [
        "coach barcelona",
        "coach en barcelona",
        "coaching barcelona",
        "coach personal barcelona",
      ],
      hero: {
        badge: "Ciudad",
        title: "Coaches en Barcelona para distintos objetivos",
        description:
          "Filtra por enfoque, formato de sesion y presupuesto para encontrar un mejor encaje desde el primer contacto.",
      },
      faq: [
        {
          q: "Puedo encontrar coach online si vivo en Barcelona?",
          a: "Si. Puedes comparar perfiles de Barcelona y tambien coaches que trabajan 100% online.",
        },
        {
          q: "Como comparar perfiles de forma rapida?",
          a: "Empieza por la especialidad, revisa experiencia y usa el rango de precio para acotar opciones.",
        },
      ],
    };
  }

  return {
    title: `Coaching en ${cityName}`,
    metaDescription: `Encuentra coach en ${cityName} por especialidad, modalidad y presupuesto.`,
    keywords: [`coach en ${cityLower}`, `coaching ${cityLower}`, `buscar coach ${cityLower}`],
    hero: {
      badge: "Ciudad",
      title: `Coaches en ${cityName}`,
      description:
        "Explora perfiles por especialidad y formato de sesion. Compara antes de contactar para elegir con mas criterio.",
    },
    faq: [
      {
        q: `Como empezar a buscar coach en ${cityName}?`,
        a: "Empieza por tu objetivo principal y compara perfiles con experiencia en ese tipo de proceso.",
      },
      {
        q: "Es mejor online o presencial?",
        a: "Depende de agenda y preferencia. Online amplia opciones; presencial aporta cercania local.",
      },
    ],
  };
}

export function getCategorySeoContent(category: CategoryLike): LandingSeoContent {
  const lower = category.name.toLowerCase();

  if (category.slug === "personal") {
    return {
      title: "Coaching personal en Espana",
      metaDescription:
        "Compara coaches de desarrollo personal en Espana por ciudad, modalidad y precio.",
      keywords: ["coaching personal", "coach personal", "coach personal madrid", "coaching personal online"],
      hero: {
        badge: "Especialidad",
        title: "Coaching personal para objetivos de vida y habitos",
        description:
          "Encuentra coaches para claridad, autoestima y foco. Compara perfiles por ciudad, modalidad y presupuesto.",
      },
      faq: [
        {
          q: "Cuando tiene sentido contratar coaching personal?",
          a: "Cuando buscas acompanamiento estructurado para cambiar habitos, tomar decisiones o ganar foco.",
        },
        {
          q: "Que conviene revisar antes de elegir coach?",
          a: "Metodologia, experiencia en casos parecidos, formato de sesion y ajuste de precio.",
        },
      ],
    };
  }

  if (category.slug === "carrera") {
    return {
      title: "Coaching de carrera en Espana",
      metaDescription:
        "Encuentra coaches de carrera en Espana y compara perfiles por experiencia, modalidad y precio.",
      keywords: ["coaching de carrera", "coach de carrera", "coach profesional", "coaching carrera online"],
      hero: {
        badge: "Especialidad",
        title: "Coaching de carrera para transicion y crecimiento profesional",
        description:
          "Compara coaches para cambio laboral, posicionamiento y toma de decisiones profesionales.",
      },
      faq: [
        {
          q: "Para que sirve el coaching de carrera?",
          a: "Ayuda a definir tu siguiente paso profesional y a ejecutar un plan con mayor claridad.",
        },
        {
          q: "Como comparar coaches de carrera?",
          a: "Prioriza experiencia en transicion profesional y una metodologia aplicable a tu contexto.",
        },
      ],
    };
  }

  return {
    title: `${category.name} en Espana`,
    metaDescription: `Encuentra ${lower} en Espana por ciudad, modalidad y presupuesto.`,
    keywords: [lower, `coach ${lower}`, `${lower} espana`],
    hero: {
      badge: "Especialidad",
      title: `${category.name} en Espana`,
      description: `${category.shortDescription} Compara opciones por ciudad, formato y precio para elegir con confianza.`,
    },
    faq: [
      {
        q: `Como elegir ${lower}?`,
        a: "Define objetivo, compara enfoque de trabajo y filtra por modalidad y rango de precio.",
      },
      {
        q: "Cuantos perfiles conviene comparar?",
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
      title: "Coaching de liderazgo en Madrid",
      metaDescription:
        "Compara coaches de liderazgo en Madrid por experiencia, modalidad y precio.",
      keywords: ["coach liderazgo madrid", "coaching liderazgo madrid", "coach directivo madrid"],
      hero: {
        badge: "Especialidad + ciudad",
        title: "Coaching de liderazgo en Madrid",
        description:
          "Encuentra coaches para comunicacion, gestion de equipos y toma de decisiones en contexto profesional.",
      },
      faq: [
        {
          q: "En que casos ayuda el coaching de liderazgo?",
          a: "Suele enfocarse en comunicacion, delegacion, conflictos y decisiones de equipo.",
        },
        {
          q: "Que revisar antes de elegir coach?",
          a: "Experiencia en liderazgo real, enfoque metodologico y compatibilidad de formato.",
        },
      ],
    };
  }

  const categoryLower = categoryName.toLowerCase();
  const cityLower = cityName.toLowerCase();

  return {
    title: `${categoryName} en ${cityName}`,
    metaDescription: `Encuentra ${categoryLower} en ${cityName}. Compara perfiles por modalidad y precio.`,
    keywords: [`${categoryLower} ${cityLower}`, `coach ${categoryLower} ${cityLower}`, `${categoryLower} en ${cityLower}`],
    hero: {
      badge: "Especialidad + ciudad",
      title: `${categoryName} en ${cityName}`,
      description:
        "Compara perfiles de esta especialidad en tu ciudad para encontrar un encaje mas claro y accionable.",
    },
    faq: [
      {
        q: `Como elegir ${categoryLower} en ${cityName}?`,
        a: "Revisa experiencia especifica, modalidad de sesion y presupuesto antes de contactar.",
      },
      {
        q: "Online o presencial para este tipo de proceso?",
        a: "Ambos funcionan. Elige por disponibilidad, estilo de trabajo y nivel de comodidad.",
      },
    ],
  };
}

export function getOnlineSeoContent(): LandingSeoContent {
  return {
    title: "Coaching online en Espana",
    metaDescription:
      "Encuentra coaches online en Espana por especialidad, experiencia y precio.",
    keywords: ["coaching online", "coach online", "coaching online espana"],
    hero: {
      badge: "Modalidad",
      title: "Coaching online para trabajar objetivos con mas flexibilidad",
      description:
        "Compara coaches que trabajan online y elige segun especialidad, enfoque y presupuesto.",
    },
    faq: [
      {
        q: "Que ventajas tiene el coaching online?",
        a: "Mas flexibilidad horaria, mayor oferta de perfiles y continuidad sin desplazamientos.",
      },
      {
        q: "Funciona igual que presencial?",
        a: "Si, cuando hay objetivos claros, seguimiento y una dinamica de sesiones consistente.",
      },
    ],
  };
}

export function getCertifiedSeoContent(): LandingSeoContent {
  return {
    title: "Coaches certificados en Espana",
    metaDescription:
      "Encuentra coaches certificados en Espana y compara perfiles por especialidad y ciudad.",
    keywords: ["coach certificado", "coaches certificados", "coaching certificado espana"],
    hero: {
      badge: "Confianza",
      title: "Coaches certificados para comparar opciones con mas seguridad",
      description:
        "Perfiles con certificacion verificada en la plataforma para facilitar una decision mas informada.",
    },
    faq: [
      {
        q: "Que significa que un coach este certificado aqui?",
        a: "Que ha presentado documentacion y fue validada en el proceso de revision de la plataforma.",
      },
      {
        q: "La certificacion es lo unico que debo revisar?",
        a: "No. Tambien conviene evaluar enfoque, experiencia, modalidad y resenas.",
      },
    ],
  };
}
