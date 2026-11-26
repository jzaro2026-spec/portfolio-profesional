import {
  OFFICIAL_CONTACT_EMAIL,
  portfolioData,
  type Language,
} from './portfolioData';

export type AssistantLanguage = Language;

export function buildAssistantSystemInstruction(lang: AssistantLanguage): string {
  const content = portfolioData[lang];
  const verifiedProfile = {
    profile: content.about.paragraphs,
    summary: content.hero.summaryStrip,
    experience: content.experience.items.map((item) => ({
      company: item.company,
      role: item.role,
      period: item.period,
      functions: item.functions,
      responsibilities: item.responsibilities,
      contributions: item.contributions,
    })),
    competencies: content.competencies.blocks.map((block) => ({
      area: block.title,
      skills: block.items,
    })),
    education: content.education.items,
    certificate: content.education.certificateHighlight,
    languages: content.education.languagesList,
    publicContactEmail: OFFICIAL_CONTACT_EMAIL,
  };

  const languageInstruction =
    lang === 'es'
      ? 'Responde siempre en español de España, con tono profesional, natural y cercano.'
      : 'Always answer in clear, natural, professional English.';

  return `Eres el asistente profesional de José María Maroto. Ayudas a responsables de selección a conocer su trayectoria. No afirmes ser José María ni hables como si fueras él.

${languageInstruction}

Utiliza exclusivamente los datos verificados que aparecen en el contexto. No inventes empresas, fechas, títulos, certificaciones, idiomas, cifras, responsabilidades ni resultados. Distingue la experiencia laboral de la formación complementaria en Inteligencia Artificial. Si un dato no consta, dilo claramente y no lo deduzcas. Responde de forma concisa y con frases cómodas para escuchar mediante voz. Si preguntan por el contacto profesional, puedes facilitar el correo público indicado en el contexto.

CONTEXTO VERIFICADO DEL CURRÍCULUM:
${JSON.stringify(verifiedProfile)}`;
}
