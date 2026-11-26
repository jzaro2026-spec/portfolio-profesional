import { Language, portfolioData } from '../data/portfolioData';

export type RespectLevel = 1 | 2 | 3;

export interface AssistantReply {
  text: string;
  respectLevel: RespectLevel;
  suggestEndSession: boolean;
  shouldEndSessionNow: boolean;
  matchedTopic: string;
}

export interface ConversationState {
  disrespectCount: number;
  ended: boolean;
}

export function createInitialConversationState(): ConversationState {
  return { disrespectCount: 0, ended: false };
}

export const LEVEL_2_RESPONSE: Record<Language, string> = {
  es: `Entiendo que quieras interactuar con el asistente, pero este espacio está destinado a conocer la trayectoria profesional de José María.

Es una persona seria, comprometida y que se toma muy en serio su trabajo. Te agradecería que mantuviéramos una conversación respetuosa y profesional.

Estaré encantado de responder a cualquier pregunta relacionada con su experiencia, formación y perfil profesional.`,
  en: `I understand you want to interact with the assistant, but this space is intended to present José María's professional career.

He is a serious, committed professional who takes his work very seriously. I would appreciate it if we could keep our conversation respectful and professional.

I will be glad to answer any questions related to his experience, training, and professional profile.`,
};

export const LEVEL_3_RESPONSE: Record<Language, string> = {
  es: `Ya te he indicado que este espacio está destinado a conocer la trayectoria profesional de José María. Su trabajo y su experiencia merecen respeto. Si deseas realizar alguna pregunta profesional, estaré encantado de atenderte. En caso contrario, daremos por finalizada esta conversación.`,
  en: `I have already stated that this space is intended to present José María's professional career. His work and experience deserve respect. If you would like to ask a professional question, I will be glad to assist you. Otherwise, we will bring this conversation to a close.`,
};

export const SESSION_ENDED_NOTICE: Record<Language, string> = {
  es: `La conversación ha finalizado porque no se ha mantenido un trato respetuoso. Puedes iniciar una nueva sesión si deseas consultar información profesional sobre José María Maroto.`,
  en: `This conversation has ended because respectful communication was not maintained. You may start a new session if you wish to ask professional questions about José María Maroto.`,
};

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¡!¿?.,;:()"\[\]«»“”'’\-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects genuine insults, mockery, profanity, or disrespectful provocations,
 * while carefully allowing tough, critical, or demanding interview questions.
 */
export function isDisrespectfulInput(rawInput: string): boolean {
  const text = normalizeText(rawInput);
  if (!text) return false;

  // Standalone insult / profanity tokens (word-boundary matched on normalized text)
  const offensiveTokens = [
    // Spanish insults & profanity
    'idiota',
    'imbecil',
    'estupido',
    'estupida',
    'inutil',
    'payaso',
    'payasa',
    'fracasado',
    'fracasada',
    'patetico',
    'patetica',
    'gilipollas',
    'subnormal',
    'retrasado',
    'retrasada',
    'mamon',
    'cabron',
    'cabrona',
    'capullo',
    'tarado',
    'tarada',
    'pringado',
    'pringada',
    'mierda',
    'basura',
    'escoria',
    'puto',
    'puta',
    'joder',
    'carajo',
    'mamarracho',
    'pelele',
    'mediocre',
    'hazmerreir',
    'papanatas',
    'tonto',
    'tonta',
    'bobo',
    'boba',
    'lerdo',
    'lerda',
    'vago',
    'vaga',
    'holgazan',
    'charlatan',
    'fantasma',
    'mentiroso',
    'mentirosa',
    'ridiculo',
    'ridicula',
    // English insults & profanity
    'idiot',
    'moron',
    'stupid',
    'dumb',
    'dumbass',
    'useless',
    'loser',
    'pathetic',
    'worthless',
    'garbage',
    'trash',
    'shit',
    'bullshit',
    'crap',
    'asshole',
    'bastard',
    'clown',
    'incompetent',
    'fuck',
    'fucking',
    'bitch',
    'retard',
    'retarded',
    'scumbag',
    'laughable',
    'fraud',
    'fake',
    'lazy',
  ];

  const padded = ` ${text} `;
  for (const token of offensiveTokens) {
    if (padded.includes(` ${token} `)) {
      return true;
    }
  }

  // Mocking / demeaning multi-word expressions
  const mockingPhrases = [
    'no vales para nada',
    'no vale para nada',
    'no sirves para nada',
    'no sirve para nada',
    'vaya mierda',
    'menuda mierda',
    'que risa',
    'da risa',
    'me rio de',
    'burlarme',
    'burla',
    'chiste de',
    'asco de',
    'cero a la izquierda',
    'perdedor',
    'das pena',
    'da pena',
    'vaya currículum',
    'vaya curriculum',
    'menudo inutil',
    'eres un cero',
    'es un cero',
    'joke of a',
    'what a joke',
    'you are a joke',
    'waste of time',
    'piece of trash',
    'piece of shit',
    'make fun of',
    'total failure',
    'you suck',
    'he sucks',
  ];

  for (const phrase of mockingPhrases) {
    if (text.includes(normalizeText(phrase))) {
      return true;
    }
  }

  return false;
}

function hasAny(text: string, keywords: string[]): boolean {
  const padded = ` ${text} `;
  return keywords.some((kw) => {
    const normalized = normalizeText(kw);
    if (!normalized) return false;
    if (normalized.length <= 3 && !normalized.includes(' ')) {
      return padded.includes(` ${normalized} `);
    }
    return text.includes(normalized);
  });
}

function buildProfessionalAnswer(rawInput: string, lang: Language): {
  text: string;
  topic: string;
} {
  const text = normalizeText(rawInput);
  const data = portfolioData[lang];

  // 1. Greeting
  if (
    hasAny(text, [
      'hola',
      'buenos dias',
      'buenas tardes',
      'buenas noches',
      'saludos',
      'hello',
      'hi',
      'hey',
      'good morning',
      'good afternoon',
    ]) &&
    text.split(' ').length <= 5
  ) {
    return {
      topic: 'greeting',
      text:
        lang === 'es'
          ? 'Hola. Soy el asistente informativo del portfolio de José María Maroto. Estoy aquí para responder con total precisión sobre su trayectoria en logística, gestión de almacenes, coordinación de equipos, competencias, formación e Inteligencia Artificial. ¿Qué aspecto de su perfil te gustaría conocer?'
          : 'Hello. I am the informational assistant for José María Maroto’s portfolio. I am here to provide accurate details on his career in logistics, warehouse management, team coordination, competencies, education, and Artificial Intelligence training. What aspect of his profile would you like to explore?',
    };
  }

  // 2. Private / sensitive data guard (DNI, phone, address, age, birth date)
  if (
    hasAny(text, [
      'dni',
      'nif',
      'pasaporte',
      'fecha de nacimiento',
      'edad',
      'cuantos anos',
      'telefono',
      'movil',
      'whatsapp',
      'direccion',
      'domicilio',
      'donde vive',
      'calle',
      'phone',
      'address',
      'birth',
      'age',
      'how old',
      'id number',
    ])
  ) {
    return {
      topic: 'privacy',
      text:
        lang === 'es'
          ? 'Por motivos de privacidad y seguridad en un portfolio público, no se publican datos personales sensibles como DNI, fecha de nacimiento, teléfono personal ni dirección particular. Para establecer contacto profesional puedes utilizar el formulario de la sección Contacto.'
          : 'For privacy and security reasons on a public portfolio, sensitive personal data such as national ID, date of birth, personal phone number, or home address are not published. To get in touch professionally, please use the form in the Contact section.',
    };
  }

  // 3. Tough / demanding interview question: Salary, conditions, or immediate availability
  if (
    hasAny(text, [
      'salario',
      'sueldo',
      'remuneracion',
      'cobrar',
      'expectativas salariales',
      'disponibilidad',
      'incorporacion',
      'inmediata',
      'cuando puedes empezar',
      'salary',
      'pay',
      'compensation',
      'wage',
      'availability',
      'immediately',
      'notice period',
      'start date',
    ])
  ) {
    return {
      topic: 'salary_availability',
      text:
        lang === 'es'
          ? 'En este portfolio no se publican pretensiones salariales cerradas ni una fecha de disponibilidad inmediata predefinida. José María está abierto a valorar nuevas oportunidades profesionales y prefiere tratar las condiciones, el encaje del puesto y los plazos de incorporación directamente durante una entrevista con la empresa.'
          : 'This portfolio does not list fixed salary expectations or claim immediate availability. José María is open to exploring new professional opportunities and prefers to discuss compensation, role fit, and start timelines directly with the company during an interview.',
    };
  }

  // 4. Tough / demanding interview question: Short tenures / job changes / gaps
  if (
    hasAny(text, [
      'por que cambiaste',
      'cambios de trabajo',
      'cambios de empleo',
      'poco tiempo',
      'pocos meses',
      'duro poco',
      'duraste poco',
      'inestabilidad',
      'laguna',
      'hueco',
      '2008',
      '2009',
      '2010',
      'why did you leave',
      'short stint',
      'short time',
      'job hopping',
      'many jobs',
      'career gap',
      'few months',
    ])
  ) {
    return {
      topic: 'tough_tenure_changes',
      text:
        lang === 'es'
          ? 'Es una pregunta muy habitual en selección. Si observas su trayectoria completa, sus etapas principales muestran estabilidad prolongada: más de 3 años y medio en Ramos Sierra (2005–2008), más de 4 años en CTC Externalización — Sanofi (2012–2016), casi 3 años como Jefe de almacén en Grupo Uno CTC (2016–2019) y continuidad en FAC Seguridad desde agosto de 2019 hasta la actualidad. Las etapas breves de 2010 (Distribuciones Centro Sur y DIA) y Fnac (2011–2012) le aportaron polivalencia en picking por voz, trato comercial y coordinación de equipo antes de consolidarse en puestos estables de mayor responsabilidad.'
          : 'That is a very fair recruitment question. Looking at his full track record, his core positions show long-term stability: over 3.5 years at Ramos Sierra (2005–2008), over 4 years at CTC Externalización — Sanofi (2012–2016), nearly 3 years as Warehouse Manager at Grupo Uno CTC (2016–2019), and continuous service at FAC Seguridad from August 2019 to the present. The shorter roles in 2010 (Distribuciones Centro Sur and DIA) and at Fnac (2011–2012) broadened his versatility across voice picking, commercial client service, and team coordination before settling into long-term supervisory positions.',
    };
  }

  // 5. Tough / demanding interview question: Weaknesses, mistakes, or criticism
  if (
    hasAny(text, [
      'error',
      'errores',
      'fallo',
      'fallos',
      'defecto',
      'defectos',
      'debilidad',
      'debilidades',
      'punto debil',
      'puntos debiles',
      'critica',
      'area de mejora',
      'areas de mejora',
      'mistake',
      'mistakes',
      'weakness',
      'weaknesses',
      'flaw',
      'shortcoming',
      'improve',
    ])
  ) {
    return {
      topic: 'tough_weaknesses',
      text:
        lang === 'es'
          ? 'En el currículum no se inventan anécdotas sobre fallos pasados, pero sí queda clara su actitud ante la mejora: en el plano técnico, su nivel de inglés es básico según figura en su CV, y precisamente su decisión de cursar 120 horas de Inteligencia Artificial en la Cámara de Comercio de Toledo demuestra que identifica áreas de actualización y se forma activamente para seguir evolucionando profesionalmente. En el día a día operativo, su enfoque se basa en el control de calidad, el seguimiento de procedimientos y la resolución directa de incidencias.'
          : 'The résumé does not fabricate anecdotes about past errors, yet it clearly reflects his approach to growth: on the technical side, his English is at a basic level as stated in his CV, and his decision to complete a 120-hour Artificial Intelligence course at the Toledo Chamber of Commerce shows a proactive commitment to continuous learning. In daily operations, he relies on quality control, procedural discipline, and direct incident resolution.',
    };
  }

  // 6. English level question (must stay strictly honest: basic level)
  if (
    hasAny(text, [
      'ingles',
      'idioma',
      'idiomas',
      'bilingue',
      'habla ingles',
      'english',
      'language',
      'languages',
      'bilingual',
      'fluent',
    ])
  ) {
    return {
      topic: 'languages',
      text:
        lang === 'es'
          ? 'Su idioma nativo es el español, con plena capacidad para la coordinación de equipos y el trato con clientes y proveedores. En cuanto al inglés, su nivel indicado en el currículum es básico (comprensión elemental de términos habituales de trabajo), por lo que no se presenta como bilingüe ni avanzado.'
          : 'His native language is Spanish, with full proficiency for team coordination as well as client and supplier communication. Regarding English, his CV states a basic level (foundational understanding of common workplace terms), so it is accurately presented as basic rather than bilingual or advanced.',
    };
  }

  // 7. Specific company queries
  if (
    hasAny(text, [
      'fac',
      'fac seguridad',
      'segundo encargado',
      'actual',
      'actualidad',
      'puesto actual',
      'current role',
      'currently',
      'ulises',
      'rps',
    ])
  ) {
    const fac = data.experience.items[0];
    return {
      topic: 'fac_seguridad',
      text:
        lang === 'es'
          ? `En ${fac.company} (${fac.period}) ocupa el puesto de ${fac.role}. Sus responsabilidades principales abarcan el apoyo en la coordinación operativa del almacén, preparación y revisión de pedidos, reposición de máquinas, carga de mercancías y palés mediante carretilla, inventarios, control de stock, manejo de los sistemas Ulises y RPS, y apoyo a la formación de personal.`
          : `At ${fac.company} (${fac.period}), he works as ${fac.role}. His duties include supporting daily warehouse operational coordination, order preparation and verification, machine replenishment, loading goods and pallets with forklifts, inventory counts, stock control, operating the Ulises and RPS management systems, and supporting staff training.`,
    };
  }

  if (
    hasAny(text, [
      'grupo uno',
      'jefe de almacen',
      'puente grua',
      'grua',
      'overhead crane',
      'warehouse manager',
      'group one',
    ]) ||
    (hasAny(text, ['ctc']) &&
      !hasAny(text, ['sanofi', 'externalizacion', 'externalization']))
  ) {
    const g1 = data.experience.items[1];
    return {
      topic: 'grupo_uno_ctc',
      text:
        lang === 'es'
          ? `En ${g1.company} (${g1.period}) desempeñó el puesto de ${g1.role}. Coordinó y controló al personal del almacén, velando por el control de calidad, la seguridad, la organización operativa, la optimización de procesos, el control de inventarios y la resolución de incidencias. Además, manejó puente grúa y carretilla frontal y mantuvo trato directo con clientes y proveedores.`
          : `At ${g1.company} (${g1.period}), he served as ${g1.role}. He supervised and coordinated warehouse staff, oversaw quality control, operational safety, process organization, inventory management, and incident resolution, operated overhead cranes and counterbalance forklifts, and handled direct communication with clients and suppliers.`,
    };
  }

  if (
    hasAny(text, [
      'sanofi',
      'farmaceutic',
      'carretillero',
      'ctc externalizacion',
      'ctc externalization',
      'externalizacion',
      'externalization',
    ])
  ) {
    const sanofi = data.experience.items[2];
    return {
      topic: 'sanofi_forklift',
      text:
        lang === 'es'
          ? `En ${sanofi.company} (${sanofi.period}) trabajó como ${sanofi.role}, realizando preparación de pedidos, recepción y ubicación de materiales, inventarios, carga de camiones, resolución de incidencias, organización y limpieza, además de participar activamente en la formación de personal.`
          : `At ${sanofi.company} (${sanofi.period}), he worked as a ${sanofi.role}, carrying out order preparation, material receiving and put-away, inventory counts, truck loading, incident resolution, workplace cleanliness and organization, and staff training.`,
    };
  }

  if (hasAny(text, ['fnac', 'picking', 'dia', 'voz', 'voice', 'ramos sierra', 'sirometal', 'cnc', 'control numerico', 'ruipan', 'centro sur', 'comercial'])) {
    return {
      topic: 'earlier_experience',
      text:
        lang === 'es'
          ? 'Además de sus etapas más recientes en FAC Seguridad, Grupo Uno CTC y Sanofi, su recorrido incluye: Carretillero / responsable de equipo en Fnac (julio 2011 – febrero 2012), Mozo de almacén con picking por voz en DIA (septiembre – diciembre 2010), Comercial en Distribuciones Centro Sur (abril – julio 2010), Mozo de almacén en Ramos Sierra (mayo 2005 – diciembre 2008), Operario de centro de control numérico en Sirometal (septiembre 1998 – septiembre 1999) y Conductor de reparto en Ruipan (junio – septiembre 1998).'
          : 'Alongside his more recent roles at FAC Seguridad, Grupo Uno CTC, and Sanofi, his background includes: Forklift Operator / Team Lead at Fnac (July 2011 – February 2012), Warehouse Associate with voice picking at DIA (September – December 2010), Sales Representative at Distribuciones Centro Sur (April – July 2010), Warehouse Associate at Ramos Sierra (May 2005 – December 2008), CNC Machine Operator at Sirometal (September 1998 – September 1999), and Delivery Driver at Ruipan (June – September 1998).',
    };
  }

  // 8. Artificial Intelligence course & Santander Open Academy certificate
  if (
    hasAny(text, [
      'inteligencia artificial',
      'ia',
      'camara de comercio',
      'toledo',
      '120 horas',
      '120h',
      'santander',
      'open academy',
      'liderar en la era',
      '5 modulos',
      '5 modules',
      'programador',
      'ingeniero',
      'experto',
      'tecnologia',
      'artificial intelligence',
      'ai',
      'programmer',
      'engineer',
      'expert',
      'technology',
    ])
  ) {
    return {
      topic: 'ai_training',
      text:
        lang === 'es'
          ? 'José María cuenta con un Curso de Inteligencia Artificial de 120 horas realizado en la Cámara de Comercio de Toledo y con el certificado «Liderar en la era de la IA: cómo están cambiando el trabajo y las organizaciones» de Santander Open Academy (finalizado el 20 de noviembre de 2026, estructurado en 5 módulos). No se presenta como ingeniero, programador ni especialista avanzado en IA; su perfil es el de un profesional experimentado en operaciones, logística y coordinación que se forma activamente en nuevas herramientas tecnológicas para seguir evolucionando.'
          : 'José María completed a 120-hour Artificial Intelligence course at the Toledo Chamber of Commerce and holds the Santander Open Academy certificate “Leading in the Age of AI: How Work and Organizations Are Changing” (completed on November 20, 2026, structured in 5 modules). He does not present himself as an AI engineer, programmer, or advanced specialist; rather, his positioning is that of an experienced operations, logistics, and coordination professional actively learning modern technological tools.',
    };
  }

  if (
    hasAny(text, [
      'formacion de personal',
      'formacion de trabajadores',
      'formacion de empleados',
      'formar trabajadores',
      'formar a trabajadores',
      'forma a los trabajadores',
      'capacitar',
      'capacita',
      'staff training',
      'training staff',
      'train new employees',
      'train new staff',
      'employee training',
      'onboarding staff',
      'onboard new employees',
    ])
  ) {
    return {
      topic: 'staff_training',
      text:
        lang === 'es'
          ? 'Ha colaborado en la formación práctica de personal en CTC Externalización — Sanofi y apoya la formación de trabajadores en FAC Seguridad. Esta experiencia se complementa con la coordinación de equipos, la distribución de tareas y la organización diaria del almacén.'
          : 'He has supported practical staff training at CTC Externalización — Sanofi and supports worker training at FAC Seguridad. This experience complements his work coordinating teams, allocating tasks, and organizing daily warehouse operations.',
    };
  }

  // 9. Education & Certifications
  if (
    hasAny(text, [
      'formacion',
      'estudios',
      'titulo',
      'titulacion',
      'fp',
      'administracion',
      'auxiliar administrativo',
      'carnet',
      'certificado',
      'certificacion',
      'education',
      'training',
      'degree',
      'certificate',
      'license',
      'studies',
      'academic background',
      'vocational training',
    ])
  ) {
    return {
      topic: 'education',
      text:
        lang === 'es'
          ? 'Su formación acreditada consta de cuatro pilares: 1) Formación Profesional de Grado Medio en Administración / Auxiliar Administrativo; 2) Carnet de carretillero para el manejo seguro de carretillas elevadoras; 3) Curso de Inteligencia Artificial de 120 horas en la Cámara de Comercio de Toledo; y 4) Certificado «Liderar en la era de la IA: cómo están cambiando el trabajo y las organizaciones» de Santander Open Academy (finalizado el 20 de noviembre de 2026, 5 módulos).'
          : 'His documented education and credentials include: 1) Intermediate Vocational Training in Administration / Administrative Assistant (FP Grado Medio en Administración / Auxiliar Administrativo); 2) Forklift Operator Certificate (Carnet de carretillero); 3) 120-hour Artificial Intelligence course at the Toledo Chamber of Commerce; and 4) Santander Open Academy certificate “Leading in the Age of AI: How Work and Organizations Are Changing” (completed November 20, 2026, 5 modules).',
    };
  }

  // 10. Tools, software & machinery (SAP, Ulises, RPS, etc.)
  if (
    hasAny(text, [
      'sap',
      'herramienta',
      'herramientas',
      'software',
      'programa',
      'programas',
      'sistema',
      'sistemas',
      'maquinaria',
      'maquina',
      'carretilla',
      'tools',
      'equipment',
      'machinery',
      'forklift',
      'erp',
      'wms',
      'ulises',
      'rps',
      'crane',
      'cnc',
    ])
  ) {
    return {
      topic: 'tools_machinery',
      text:
        lang === 'es'
          ? 'En el ámbito de herramientas de gestión y maquinaria ha trabajado de forma práctica con los sistemas SAP, Ulises y RPS, sistemas de picking por voz, carretillas elevadoras (incluida carretilla frontal), puente grúa y centros de control numérico (CNC). El uso de herramientas informáticas corresponde a su aplicación operativa en almacén.'
          : 'Across management systems and industrial equipment, he has hands-on experience with SAP, Ulises, and RPS, voice-picking systems, forklifts (including counterbalance frontal forklifts), overhead cranes, and CNC machining centers, applied directly in daily warehouse and industrial operations.',
    };
  }

  if (
    hasAny(text, [
      'gestion de almacen',
      'gestion de almacenes',
      'gestion de inventario',
      'gestion de inventarios',
      'control de stock',
      'gestionar almacenes',
      'almacen',
      'almacenes',
      'almacenamiento',
      'logistica',
      'logistics',
      'warehouse',
      'warehousing',
      'warehouse management',
      'warehouse operations',
      'inventory management',
      'stock control',
      'supply chain',
    ])
  ) {
    return {
      topic: 'warehouse_management',
      text:
        lang === 'es'
          ? 'José María cuenta con experiencia práctica en logística y gestión de almacenes: preparación y revisión de pedidos, recepción y ubicación de materiales, reposición de máquinas, inventarios, control de stock y carga de mercancías. También ha participado en la organización y limpieza del almacén, el control de calidad y seguridad, la resolución de incidencias y la coordinación operativa en FAC Seguridad, Grupo Uno CTC y CTC Externalización — Sanofi.'
          : 'José María has practical experience in logistics and warehouse operations, including order preparation and checking, receiving and putting away materials, machine replenishment, inventory counts, stock control, and loading goods. His experience also includes workplace organization and cleanliness, quality and safety checks, incident resolution, and operational coordination at FAC Seguridad, Grupo Uno CTC, and CTC Externalización — Sanofi.',
    };
  }

  // 11. Leadership, team coordination & training staff
  if (
    hasAny(text, [
      'liderazgo',
      'liderar',
      'equipo',
      'equipos',
      'coordinar',
      'coordinacion',
      'personal',
      'jefe',
      'responsable',
      'formar',
      'leadership',
      'team',
      'manage',
      'management',
      'supervise',
      'coordinator',
      'lead',
      'onboarding',
      'calidad',
      'quality',
      'organizacion',
      'organization',
      'organisation',
      'procedimientos',
      'procedures',
    ])
  ) {
    return {
      topic: 'leadership_coordination',
      text:
        lang === 'es'
          ? 'Cuenta con experiencia directa en coordinación de equipos, distribución de tareas, organización de secciones de trabajo, control de calidad, seguridad operativa, resolución de incidencias y formación práctica de personal nuevo, especialmente como Segundo encargado de almacén en FAC Seguridad, Jefe de almacén en Grupo Uno CTC, Responsable de equipo en Fnac y formador de apoyo en CTC Externalización — Sanofi.'
          : 'He has direct experience in team coordination, task distribution, organizing work sections, quality control, operational safety, incident resolution, and practical onboarding/training of new staff—especially as Assistant Warehouse Manager (Segundo encargado de almacén) at FAC Seguridad, Warehouse Manager at Grupo Uno CTC, Team Lead at Fnac, and staff trainer at CTC Externalización — Sanofi.',
    };
  }

  // 12. General Experience Overview
  if (
    hasAny(text, [
      'experiencia',
      'trayectoria',
      'cv',
      'curriculum',
      'trabajo',
      'trabajos',
      'empresas',
      'puestos',
      'resumen',
      'perfil',
      'quien es',
      'sobre el',
      'experience',
      'career',
      'background',
      'resume',
      'summary',
      'profile',
      'who is',
      'companies',
      'roles',
      'logistica',
      'logistics',
      'almacen',
      'almacenes',
      'warehouse',
      'warehousing',
      'supply chain',
      'inventario',
      'inventory',
    ])
  ) {
    return {
      topic: 'general_experience',
      text:
        lang === 'es'
          ? 'José María Maroto cuenta con una trayectoria continuada desde 1998 hasta la actualidad en logística, gestión de almacenes, coordinación de equipos e industria. Ha ejercido como Segundo encargado de almacén en FAC Seguridad (2019–actualidad), Jefe de almacén en Grupo Uno CTC (2016–2019), Carretillero y apoyo en formación en CTC Externalización — Sanofi (2012–2016), además de etapas previas en Fnac, DIA, Distribuciones Centro Sur, Ramos Sierra, Sirometal (CNC) y Ruipan.'
          : 'José María Maroto has a documented career spanning from 1998 to the present across logistics, warehouse management, team coordination, and industrial operations. Key roles include Assistant Warehouse Manager (Segundo encargado de almacén) at FAC Seguridad (2019–present), Warehouse Manager at Grupo Uno CTC (2016–2019), Forklift Operator and staff trainer at CTC Externalización — Sanofi (2012–2016), plus earlier experience at Fnac, DIA, Distribuciones Centro Sur, Ramos Sierra, Sirometal (CNC), and Ruipan.',
    };
  }

  // 13. Competencies / value proposition
  if (
    hasAny(text, [
      'competencia',
      'competencias',
      'aporta',
      'habilidad',
      'habilidades',
      'capacidades',
      'fortalezas',
      'skills',
      'competencies',
      'strengths',
      'bring',
      'value',
    ])
  ) {
    return {
      topic: 'competencies',
      text:
        lang === 'es'
          ? 'Sus principales aportaciones se agrupan en cuatro bloques: 1) Gestión logística (almacenes, pedidos, inventarios, stock, recepción, carga/descarga); 2) Coordinación y liderazgo (equipos, tareas, formación de personal e incidencias); 3) Calidad y organización (seguridad operativa, orden, limpieza y procedimientos); y 4) Herramientas y maquinaria (SAP, Ulises, RPS, carretillas elevadoras, puente grúa y CNC).'
          : 'His core value centers on four areas: 1) Logistics Management (warehousing, order preparation, inventory and stock control, receiving, loading/unloading); 2) Coordination & Leadership (teams, task allocation, staff training, incident resolution); 3) Quality & Organization (operational safety, workplace order, procedures); and 4) Tools & Equipment (SAP, Ulises, RPS, forklifts, overhead cranes, and CNC).',
    };
  }

  // 14. Contact / CV download / Gmail
  if (
    hasAny(text, [
      'contacto',
      'contactar',
      'correo',
      'email',
      'gmail',
      'pdf',
      'descargar',
      'contact',
      'download',
      'message',
      'mensaje',
    ])
  ) {
    return {
      topic: 'contact_pdf',
      text:
        lang === 'es'
          ? 'Puedes escribir directamente a josemarotolazaro@hotmail.com, utilizar el formulario de la sección Contacto (con validación completa e integración opcional con Gmail) y descargar el currículum original en PDF proporcionado por José María.'
          : 'You can write directly to josemarotolazaro@hotmail.com, use the Contact section form (with full validation and optional Gmail API integration), and download the original PDF résumé provided by José María.',
    };
  }

  // 15. Honest fallback for unknown or out-of-scope questions (Never hallucinate!)
  return {
    topic: 'honest_fallback',
    text:
      lang === 'es'
        ? 'No dispongo de ese dato específico en la documentación profesional de José María Maroto y no invento información que no esté acreditada. Puedo informarte con detalle sobre su experiencia laboral (FAC Seguridad, Grupo Uno CTC, Sanofi, Fnac, DIA, Ramos Sierra, Sirometal, etc.), sus competencias logísticas y de liderazgo, el manejo de SAP/Ulises/RPS, su formación (FP en Administración, Carnet de carretillero, Curso de IA de 120 h y certificado de Santander Open Academy) o su nivel básico de inglés.'
        : 'That specific detail is not included in José María Maroto’s documented profile, and I do not invent unverified information. I can accurately answer questions about his work experience (FAC Seguridad, Grupo Uno CTC, Sanofi, Fnac, DIA, Ramos Sierra, Sirometal, etc.), logistics and leadership competencies, SAP/Ulises/RPS tools, education (Vocational Degree in Administration, Forklift Certificate, 120-hour AI course, and Santander Open Academy certificate), or his basic English level.',
  };
}

export function processAssistantMessage(
  rawInput: string,
  lang: Language,
  state: ConversationState
): { reply: AssistantReply; nextState: ConversationState } {
  if (state.ended) {
    return {
      reply: {
        text: SESSION_ENDED_NOTICE[lang],
        respectLevel: 3,
        suggestEndSession: false,
        shouldEndSessionNow: true,
        matchedTopic: 'session_ended',
      },
      nextState: state,
    };
  }

  if (isDisrespectfulInput(rawInput)) {
    const nextDisrespectCount = state.disrespectCount + 1;

    if (nextDisrespectCount === 1) {
      return {
        reply: {
          text: LEVEL_2_RESPONSE[lang],
          respectLevel: 2,
          suggestEndSession: false,
          shouldEndSessionNow: false,
          matchedTopic: 'respect_level_2',
        },
        nextState: {
          disrespectCount: nextDisrespectCount,
          ended: false,
        },
      };
    }

    if (nextDisrespectCount === 2) {
      return {
        reply: {
          text: LEVEL_3_RESPONSE[lang],
          respectLevel: 3,
          suggestEndSession: true,
          shouldEndSessionNow: false,
          matchedTopic: 'respect_level_3',
        },
        nextState: {
          disrespectCount: nextDisrespectCount,
          ended: false,
        },
      };
    }

    // 3rd+ consecutive disrespect after Level 3 warning: close session cleanly
    return {
      reply: {
        text: SESSION_ENDED_NOTICE[lang],
        respectLevel: 3,
        suggestEndSession: false,
        shouldEndSessionNow: true,
        matchedTopic: 'respect_session_closed',
      },
      nextState: {
        disrespectCount: nextDisrespectCount,
        ended: true,
      },
    };
  }

  // Level 1: Normal professional conversation (including tough/critical interview questions)
  const answer = buildProfessionalAnswer(rawInput, lang);
  return {
    reply: {
      text: answer.text,
      respectLevel: 1,
      suggestEndSession: false,
      shouldEndSessionNow: false,
      matchedTopic: answer.topic,
    },
    nextState: createInitialConversationState(),
  };
}
