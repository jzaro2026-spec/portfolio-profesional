export type Language = 'es' | 'en';

export type ExperienceCategory = 'all' | 'leadership' | 'logistics' | 'industrial';

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  category: Exclude<ExperienceCategory, 'all'>;
  functions: string[];
  responsibilities: string;
  contributions: string;
}

export interface CompetencyBlock {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  items: string[];
}

export interface EducationItem {
  id: string;
  title: string;
  institution: string;
  detail: string;
  description: string;
  featured?: boolean;
  tagLabel: string;
}

export interface PortfolioContent {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
    about: string;
    experience: string;
    competencies: string;
    education: string;
    contact: string;
    languageLabel: string;
  };
  hero: {
    headline: string;
    subtitle: string;
    name: string;
    pillarsLine: string;
    ctaPrimary: string;
    ctaSecondaryAvailable: string;
    ctaSecondaryPending: string;
    attachPdfLabel: string;
    removePdfLabel: string;
    pdfPendingNotice: string;
    scrollIndicator: string;
    photoFrameTitle: string;
    photoCaption: string;
    changePhotoBtn: string;
    restoreOriginalPhotoBtn: string;
    captionArchitecture: string;
    summaryStrip: {
      label: string;
      value: string;
      detail: string;
    }[];
  };
  about: {
    sectionIndex: string;
    sectionLabel: string;
    title: string;
    paragraphs: string[];
    imageCaptionLeft: string;
    imageCaptionRight: string;
    positioningTitle: string;
    positioningItems: {
      title: string;
      description: string;
    }[];
  };
  experience: {
    sectionIndex: string;
    sectionLabel: string;
    title: string;
    subtitle: string;
    filters: {
      all: string;
      leadership: string;
      logistics: string;
      industrial: string;
    };
    labels: {
      functions: string;
      responsibilities: string;
      contributions: string;
      expandDetails: string;
      collapseDetails: string;
    };
    items: ExperienceItem[];
  };
  competencies: {
    sectionIndex: string;
    sectionLabel: string;
    title: string;
    subtitle: string;
    filterAll: string;
    blocks: CompetencyBlock[];
    technicalNoteTitle: string;
    technicalNoteText: string;
  };
  education: {
    sectionIndex: string;
    sectionLabel: string;
    title: string;
    subtitle: string;
    featuredHeading: string;
    items: EducationItem[];
    languagesTitle: string;
    languagesList: {
      language: string;
      level: string;
      note: string;
    }[];
  };
  resumeBanner: {
    title: string;
    description: string;
    downloadButton: string;
    uploadButton: string;
    statusReady: string;
    statusPending: string;
  };
  contact: {
    sectionIndex: string;
    sectionLabel: string;
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholderMarker: string;
    emailMarkerExplanation: string;
    configureEmailBtn: string;
    saveEmailBtn: string;
    cancelEmailBtn: string;
    gmailIntegration: {
      panelTitle: string;
      panelDescription: string;
      signInButton: string;
      signingInButton: string;
      signOutButton: string;
      connectedAs: string;
      useConnectedAsRecipient: string;
      sendViaGmailButton: string;
      saveDraftViaGmailButton: string;
      recentMessagesTitle: string;
      refreshMessagesButton: string;
      noMessagesFound: string;
      moveToTrashButton: string;
      confirmSendTitle: string;
      confirmSendDescription: string;
      confirmDraftTitle: string;
      confirmDraftDescription: string;
      confirmTrashTitle: string;
      confirmTrashDescription: string;
      confirmActionBtn: string;
      cancelActionBtn: string;
      sentSuccessMessage: string;
      draftSuccessMessage: string;
      trashSuccessMessage: string;
    };
    form: {
      nameLabel: string;
      namePlaceholder: string;
      companyLabel: string;
      companyPlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      messageLabel: string;
      messagePlaceholder: string;
      submitButton: string;
      resetButton: string;
      copyPayloadButton: string;
      copiedConfirmation: string;
      openMailClientButton: string;
      errors: {
        nameRequired: string;
        companyRequired: string;
        emailRequired: string;
        emailInvalid: string;
        messageRequired: string;
        messageTooShort: string;
        recipientRequiredForGmail: string;
      };
      validationReadyTitle: string;
      validationReadyPendingText: string;
      validationReadyConfiguredText: string;
    };
  };
  footer: {
    rights: string;
    privacyNotice: string;
    backToTop: string;
  };
}

export const PORTFOLIO_IMAGES = {
  personalPortrait: '/assets/aistudio/IMG_20261103_125023_c7bec6bc.jpg',
  heroLogistics: '/assets/images/hero_modern_logistics_1793784414801.jpg',
  warehouseOperations: '/assets/images/industrial_warehouse_operations_1793784415871.jpg',
  technologyWorkspace: '/assets/images/technology_automation_workspace_1793784416316.jpg',
};

export const portfolioData: Record<Language, PortfolioContent> = {
  es: {
    meta: {
      title: 'José María Maroto | Portfolio Profesional',
      description:
        'Portfolio profesional de José María Maroto, profesional con experiencia en logística, gestión de almacenes, coordinación de equipos y formación en Inteligencia Artificial.',
    },
    nav: {
      home: 'Inicio',
      about: 'Sobre mí',
      experience: 'Experiencia',
      competencies: 'Competencias',
      education: 'Formación',
      contact: 'Contacto',
      languageLabel: 'Selector de idioma',
    },
    hero: {
      headline: '«Experiencia que mueve. Innovación que transforma.»',
      subtitle:
        'Profesional con amplia trayectoria en logística, gestión de almacenes y coordinación de equipos. Comprometido con la mejora continua y la evolución profesional mediante nuevas tecnologías e Inteligencia Artificial.',
      name: 'José María Maroto',
      pillarsLine:
        'Logística · Gestión de equipos · Organización operativa · Inteligencia Artificial',
      ctaPrimary: 'Conocer mi trayectoria',
      ctaSecondaryAvailable: 'Descargar currículum PDF',
      ctaSecondaryPending: 'Descargar currículum (PDF pendiente)',
      attachPdfLabel: 'Vincular PDF original del CV',
      removePdfLabel: 'Desvincular PDF',
      pdfPendingNotice:
        'Marcador activo: adjunta el archivo PDF original de tu currículum para habilitar su descarga directa.',
      scrollIndicator: 'Explorar trayectoria profesional',
      photoFrameTitle: 'Fotografía personal',
      photoCaption: 'José María Maroto · Logística y gestión operativa',
      changePhotoBtn: 'Actualizar fotografía',
      restoreOriginalPhotoBtn: 'Restaurar foto original',
      captionArchitecture:
        'Entornos de distribución moderna, organización operativa y control de inventarios.',
      summaryStrip: [
        {
          label: 'Trayectoria documentada',
          value: '1998 – Actualidad',
          detail: 'Recorrido continuado en operativa logística, almacén e industria',
        },
        {
          label: 'Responsabilidad operativa',
          value: '9 Etapas Profesionales',
          detail: 'Desde distribución y entorno CNC hasta jefatura de almacén y responsable de silo',
        },
        {
          label: 'Sistemas de gestión',
          value: 'SAP · Ulises · RPS',
          detail: 'Control de stock, inventarios, trazabilidad y preparación de pedidos',
        },
        {
          label: 'Evolución tecnológica',
          value: '120 Horas en IA',
          detail: 'Formación reciente en la Cámara de Comercio de Toledo',
        },
      ],
    },
    about: {
      sectionIndex: '01',
      sectionLabel: 'Sobre mí',
      title: '«Experiencia, compromiso y evolución profesional.»',
      paragraphs: [
        'Soy José María Maroto, un profesional con una amplia trayectoria en logística, gestión de almacenes y coordinación de equipos.',
        'A lo largo de mi carrera he desarrollado experiencia en organización operativa, control de inventarios, preparación de pedidos, resolución de incidencias y formación de personal.',
        'Mi trayectoria también incluye experiencia en entornos industriales y centros de control numérico.',
        'Me considero una persona responsable, comprometida con el trabajo bien hecho y con capacidad para adaptarme a diferentes entornos profesionales.',
        'Actualmente continúo ampliando mis conocimientos mediante formación en Inteligencia Artificial, incorporando nuevas herramientas y perspectivas a mi desarrollo profesional.',
        'Mi objetivo es seguir aportando experiencia, capacidad de organización y ganas de aprender a nuevos retos profesionales.',
      ],
      imageCaptionLeft:
        'Rigor en la organización física de almacenes, control de ubicaciones y seguridad operativa.',
      imageCaptionRight:
        'Integración de sistemas de gestión (Ulises, RPS, SAP) y formación actual en Inteligencia Artificial.',
      positioningTitle: 'Pilares de trabajo',
      positioningItems: [
        {
          title: 'Fiabilidad y organización',
          description:
            'Planificación metódica del trabajo diario, control de stock e inventarios y cumplimiento estricto de los procedimientos operativos.',
        },
        {
          title: 'Coordinación y apoyo a personas',
          description:
            'Experiencia liderando turnos y secciones de almacén, acogida y formación práctica de nuevos trabajadores y resolución directa de incidencias.',
        },
        {
          title: 'Adaptabilidad y aprendizaje continuo',
          description:
            'Capacidad demostrada para desenvolverse en distintos sectores industriales y logísticos, sumando formación actual en herramientas de Inteligencia Artificial.',
        },
      ],
    },
    experience: {
      sectionIndex: '02',
      sectionLabel: 'Experiencia profesional',
      title: 'Trayectoria consolidada en operaciones, almacén y coordinación.',
      subtitle:
        'Un recorrido profesional construido desde la base operativa hasta puestos de responsabilidad de silo y jefatura de almacén.',
      filters: {
        all: 'Toda la trayectoria (10)',
        leadership: 'Responsabilidad y coordinación',
        logistics: 'Operativa logística',
        industrial: 'Industria, comercial y reparto',
      },
      labels: {
        functions: 'Funciones desempeñadas',
        responsibilities: 'Responsabilidad principal',
        contributions: 'Aportación y aprendizaje relevante',
        expandDetails: 'Ver detalle operativo',
        collapseDetails: 'Ocultar detalle',
      },
      items: [
        {
          id: 'fac-seguridad',
          company: 'FAC Seguridad',
          role: 'Responsable de silo',
          period: 'Agosto de 2019 – Actualidad',
          category: 'leadership',
          functions: [
            'Preparación y revisión de pedidos.',
            'Reposición de máquinas.',
            'Carga de mercancías y palés mediante carretilla.',
            'Inventarios.',
            'Control de stock.',
            'Manejo de sistemas Ulises y RPS.',
            'Apoyo a la formación de personal.',
          ],
          responsibilities:
            'Supervisión integral del funcionamiento del silo, garantizando la exactitud del stock, el flujo continuo de reposición y la correcta verificación de cada pedido antes de su expedición.',
          contributions:
            'Consolidación del trabajo con los sistemas de gestión Ulises y RPS para el control de inventario, además de facilitar la integración práctica de nuevas incorporaciones en la operativa diaria.',
        },
        {
          id: 'grupo-uno-ctc',
          company: 'Grupo Uno CTC',
          role: 'Jefe de almacén',
          period: 'Noviembre de 2016 – Julio de 2019',
          category: 'leadership',
          functions: [
            'Control y coordinación de personal.',
            'Control de calidad.',
            'Seguridad y organización operativa.',
            'Optimización de procesos.',
            'Control de inventarios.',
            'Resolución de incidencias.',
            'Apoyo a las operaciones.',
            'Manejo de puente grúa y carretilla frontal.',
            'Trato con clientes y proveedores.',
          ],
          responsibilities:
            'Dirección operativa del almacén, distribución de cargas de trabajo del equipo, supervisión del cumplimiento de normas de seguridad y calidad, e interlocución directa con clientes y proveedores.',
          contributions:
            'Mejora en la coordinación entre secciones operativas, resolución ágil de desviaciones de inventario o transporte y polivalencia técnica en el manejo de puente grúa y carretilla frontal.',
        },
        {
          id: 'ctc-sanofi',
          company: 'CTC Externalización — Sanofi',
          role: 'Carretillero',
          period: 'Junio de 2012 – Noviembre de 2016',
          category: 'logistics',
          functions: [
            'Preparación de pedidos.',
            'Recepción y ubicación de materiales.',
            'Inventarios.',
            'Formación de personal.',
            'Carga de camiones.',
            'Resolución de incidencias.',
            'Organización y limpieza.',
          ],
          responsibilities:
            'Ejecución rigurosa de movimientos de mercancía, recepción, ubicación e inventarios dentro de un entorno logístico del sector farmacéutico con altos estándares de orden y trazabilidad.',
          contributions:
            'Participación activa en la formación de personal de nueva incorporación, mantenimiento del orden y limpieza en las zonas asignadas y respuesta eficaz ante incidencias en carga y recepción.',
        },
        {
          id: 'fnac',
          company: 'Fnac',
          role: 'Carretillero / responsable de equipo',
          period: 'Julio de 2011 – Febrero de 2012',
          category: 'leadership',
          functions: [
            'Ubicación y recepción de mercancías.',
            'Reposición de picking.',
            'Inventarios.',
            'Coordinación de equipo.',
            'Resolución de incidencias.',
          ],
          responsibilities:
            'Coordinación diaria del equipo de trabajo en las tareas de recepción, ubicación y abastecimiento continuo de líneas de picking para mantener la fluidez operativa.',
          contributions:
            'Equilibrio entre la ejecución operativa con carretilla y la organización de compañeros para resolver cuellos de botella e incidencias en campañas de alta rotación.',
        },
        {
          id: 'dia',
          company: 'DIA',
          role: 'Mozo de almacén',
          period: 'Septiembre de 2010 – Diciembre de 2010',
          category: 'logistics',
          functions: ['Preparación de pedidos.', 'Picking por voz.'],
          responsibilities:
            'Preparación ágil y ordenada de pedidos de gran consumo mediante sistemas guiados de picking por voz.',
          contributions:
            'Adaptación rápida a flujos de trabajo intensivos y herramientas tecnológicas de preparación por voz en plataformas de distribución alimentaria.',
        },
        {
          id: 'distribuciones-centro-sur',
          company: 'Distribuciones Centro Sur',
          role: 'Comercial',
          period: 'Abril de 2010 – Julio de 2010',
          category: 'industrial',
          functions: ['Gestión de cartera de clientes.'],
          responsibilities:
            'Seguimiento, atención y mantenimiento de la cartera de clientes asignada.',
          contributions:
            'Desarrollo de habilidades de comunicación directa, escucha activa y comprensión de las necesidades del cliente desde una perspectiva comercial.',
        },
        {
          id: 'ramos-sierra',
          company: 'Ramos Sierra',
          role: 'Mozo de almacén',
          period: 'Mayo de 2005 – Diciembre de 2008',
          category: 'logistics',
          functions: [
            'Preparación de pedidos.',
            'Carga de camiones.',
            'Preparación de rutas.',
          ],
          responsibilities:
            'Acondicionamiento de pedidos, organización de la carga en vehículos industriales y estructuración previa de las rutas de reparto.',
          contributions:
            'Afianzamiento de la base logística en organización de muelles, optimización del espacio de carga y sincronización entre almacén y distribución.',
        },
        {
          id: 'desinsa',
          company: 'Desinsa',
          role: 'Preparador / programador de CNC',
          period: 'Septiembre de 1999 – Mayo de 2005',
          category: 'industrial',
          functions: [
            'Preparación de maquinaria CNC.',
            'Programación y ajuste de centros de control numérico.',
            'Formación de personal.',
          ],
          responsibilities:
            'Preparación y programación de centros de control numérico para la ejecución precisa de piezas y operaciones industriales, junto con el apoyo a la incorporación y formación práctica de nuevos trabajadores.',
          contributions:
            'Consolidación de conocimientos técnicos en CNC, mejora de la autonomía operativa del equipo y transmisión de procedimientos de trabajo, seguridad y calidad a personal de nueva incorporación.',
        },
        {
          id: 'sirometal',
          company: 'Sirometal',
          role: 'Operario de centro de control numérico',
          period: 'Septiembre de 1998 – Septiembre de 1999',
          category: 'industrial',
          functions: [
            'Trabajo en entorno industrial.',
            'Operaciones relacionadas con centros de control numérico.',
          ],
          responsibilities:
            'Manejo y seguimiento de operaciones productivas en maquinaria de control numérico (CNC) dentro de planta industrial.',
          contributions:
            'Adquisición de disciplina técnica industrial, atención al detalle en procesos mecanizados y cumplimiento de pautas de seguridad en fábrica.',
        },
        {
          id: 'ruipan',
          company: 'Ruipan',
          role: 'Conductor de reparto',
          period: 'Junio de 1998 – Septiembre de 1998',
          category: 'industrial',
          functions: ['Reparto y distribución de mercancías.'],
          responsibilities:
            'Transporte, entrega puntual y distribución capilar de mercancías en las rutas asignadas.',
          contributions:
            'Conocimiento práctico de la última etapa de la cadena logística y trato directo en el punto de entrega.',
        },
      ],
    },
    competencies: {
      sectionIndex: '03',
      sectionLabel: 'Competencias profesionales',
      title: '«Lo que aporto a una organización.»',
      subtitle:
        'Capacidades operativas, organizativas y técnicas desarrolladas de forma práctica a lo largo de mi trayectoria laboral.',
      filterAll: 'Ver todas las áreas',
      blocks: [
        {
          id: 'gestion-logistica',
          index: '01',
          title: 'Gestión logística',
          subtitle: 'Operativa integral de almacén y flujo de mercancías',
          items: [
            'Gestión de almacenes.',
            'Preparación de pedidos.',
            'Control de inventarios.',
            'Control de stock.',
            'Recepción y ubicación de mercancías.',
            'Carga y descarga.',
            'Organización de operaciones.',
          ],
        },
        {
          id: 'coordinacion-liderazgo',
          index: '02',
          title: 'Coordinación y liderazgo',
          subtitle: 'Organización de personas, turnos y aprendizaje en el puesto',
          items: [
            'Coordinación de equipos.',
            'Distribución de tareas.',
            'Formación de personal.',
            'Apoyo a nuevos trabajadores.',
            'Organización de secciones de trabajo.',
            'Resolución de incidencias.',
          ],
        },
        {
          id: 'calidad-organizacion',
          index: '03',
          title: 'Calidad y organización',
          subtitle: 'Estándares de seguridad, orden y mejora de procesos',
          items: [
            'Control de calidad.',
            'Seguridad operativa.',
            'Orden y limpieza.',
            'Optimización de tareas.',
            'Seguimiento de procedimientos.',
          ],
        },
        {
          id: 'herramientas-maquinaria',
          index: '04',
          title: 'Herramientas y maquinaria',
          subtitle: 'Sistemas de gestión de almacén y equipamiento industrial',
          items: [
            'SAP.',
            'Ulises.',
            'RPS.',
            'Carretillas elevadoras.',
            'Puente grúa.',
            'Centros de control numérico.',
          ],
        },
      ],
      technicalNoteTitle: 'Rigor y transparencia sobre herramientas',
      technicalNoteText:
        'El manejo de sistemas informáticos (SAP, Ulises y RPS) y de equipamiento industrial responde al uso práctico desempeñado en mis puestos de trabajo.',
    },
    education: {
      sectionIndex: '04',
      sectionLabel: 'Formación',
      title: 'Formación académica, técnica y actualización en Inteligencia Artificial.',
      subtitle:
        'Una base administrativa y técnica complementada con formación reciente para comprender y aplicar nuevas herramientas tecnológicas en el entorno laboral.',
      featuredHeading: 'Formación reciente · Evolución profesional',
      items: [
        {
          id: 'curso-ia',
          title: 'Curso de Inteligencia Artificial (120 horas)',
          institution: 'Cámara de Comercio de Toledo',
          detail: '120 horas lectivas · Formación complementaria reciente',
          description:
            'Formación orientada a conocer las herramientas actuales de Inteligencia Artificial y su aplicación práctica para mejorar la organización, la productividad y la adaptación a los nuevos entornos digitales de trabajo.',
          featured: true,
          tagLabel: 'Actualización tecnológica · 120 h',
        },
        {
          id: 'fp-administracion',
          title: 'Formación Profesional de Grado Medio en Administración / Auxiliar Administrativo',
          institution: 'Formación Profesional Reglada',
          detail: 'Grado Medio · Gestión administrativa y documental',
          description:
            'Base formativa en organización administrativa, control documental, registro de operaciones y gestión estructurada de la información en entornos de empresa.',
          featured: false,
          tagLabel: 'Formación reglada',
        },
        {
          id: 'carnet-carretillero',
          title: 'Carnet de carretillero',
          institution: 'Habilitación Profesional Operativa',
          detail: 'Manejo seguro de carretillas elevadoras',
          description:
            'Acreditación para la conducción, carga, descarga, apilado y movimiento seguro de mercancías y palés en almacenes e instalaciones industriales.',
          featured: false,
          tagLabel: 'Acreditación técnica',
        },
      ],
      languagesTitle: 'Idiomas',
      languagesList: [
        {
          language: 'Español',
          level: 'Idioma nativo',
          note: 'Comunicación profesional completa, coordinación de equipos e interlocución con clientes y proveedores.',
        },
        {
          language: 'Inglés',
          level: 'Nivel básico (según CV)',
          note: 'Comprensión elemental de términos básicos de trabajo y vocabulario habitual en operativa.',
        },
      ],
    },
    resumeBanner: {
      title: 'Documento curricular en formato PDF',
      description:
        'Puedes descargar el currículum en PDF si el archivo original ha sido vinculado, o cargarlo directamente desde tu dispositivo para habilitar la descarga.',
      downloadButton: 'Descargar currículum PDF',
      uploadButton: 'Vincular PDF original',
      statusReady: 'Archivo PDF original verificado y listo para descarga.',
      statusPending:
        'Estado actual: [PDF original pendiente de adjuntar]. No se generan enlaces ni documentos ficticios.',
    },
    contact: {
      sectionIndex: '05',
      sectionLabel: 'Contacto y Gmail',
      title: '«¿Hablamos de nuevas oportunidades?»',
      subtitle:
        'Si buscas un profesional con experiencia, capacidad de organización y ganas de seguir creciendo, estaré encantado de conocer nuevas oportunidades.',
      emailLabel: 'Correo electrónico profesional',
      emailPlaceholderMarker: '[CORREO PROFESIONAL PENDIENTE]',
      emailMarkerExplanation:
        'Marcador temporal activo para evitar datos ficticios. Puedes vincular tu cuenta de Gmail con Google o asignar manualmente el correo profesional definitivo.',
      configureEmailBtn: 'Asignar correo profesional manualmente',
      saveEmailBtn: 'Guardar correo',
      cancelEmailBtn: 'Cancelar',
      gmailIntegration: {
        panelTitle: 'Integración directa con Gmail',
        panelDescription:
          'Conecta tu cuenta de Google para enviar mensajes directamente mediante la API oficial de Gmail, guardar borradores o consultar tus correos recientes con tu permiso.',
        signInButton: 'Iniciar sesión con Google',
        signingInButton: 'Conectando con Google...',
        signOutButton: 'Cerrar sesión de Gmail',
        connectedAs: 'Cuenta de Gmail conectada',
        useConnectedAsRecipient: 'Usar este correo como destinatario profesional',
        sendViaGmailButton: 'Enviar correo con Gmail API',
        saveDraftViaGmailButton: 'Guardar borrador en Gmail',
        recentMessagesTitle: 'Mensajes recientes en tu cuenta de Gmail',
        refreshMessagesButton: 'Actualizar bandeja',
        noMessagesFound: 'No se encontraron mensajes recientes en esta cuenta.',
        moveToTrashButton: 'Mover a la papelera',
        confirmSendTitle: 'Confirmar envío de correo mediante Gmail',
        confirmSendDescription:
          '¿Confirmas que deseas enviar este correo electrónico en tu nombre a través de tu cuenta de Gmail conectada?',
        confirmDraftTitle: 'Confirmar creación de borrador en Gmail',
        confirmDraftDescription:
          '¿Confirmas que deseas guardar este mensaje como borrador dentro de tu cuenta de Gmail?',
        confirmTrashTitle: 'Confirmar envío a la papelera de Gmail',
        confirmTrashDescription:
          '¿Estás seguro de que deseas mover este correo electrónico a la papelera de tu cuenta de Gmail?',
        confirmActionBtn: 'Confirmar y ejecutar',
        cancelActionBtn: 'Cancelar',
        sentSuccessMessage:
          'El correo electrónico se ha enviado correctamente a través de la API de Gmail.',
        draftSuccessMessage:
          'El borrador se ha guardado correctamente en tu cuenta de Gmail.',
        trashSuccessMessage:
          'El mensaje ha sido movido a la papelera de Gmail.',
      },
      form: {
        nameLabel: 'Nombre',
        namePlaceholder: 'Tu nombre y apellidos',
        companyLabel: 'Empresa',
        companyPlaceholder: 'Nombre de la empresa u organización',
        emailLabel: 'Correo electrónico',
        emailPlaceholder: 'nombre@empresa.com',
        messageLabel: 'Mensaje',
        messagePlaceholder:
          'Describe brevemente el puesto, proyecto u oportunidad profesional...',
        submitButton: 'Validar y preparar mensaje',
        resetButton: 'Limpiar formulario',
        copyPayloadButton: 'Copiar mensaje al portapapeles',
        copiedConfirmation: 'Mensaje copiado al portapapeles',
        openMailClientButton: 'Abrir en cliente de correo',
        errors: {
          nameRequired: 'Por favor, introduce tu nombre.',
          companyRequired: 'Por favor, indica la empresa u organización.',
          emailRequired: 'Por favor, introduce un correo electrónico de contacto.',
          emailInvalid:
            'Introduce un formato de correo electrónico válido (ej. nombre@empresa.com).',
          messageRequired: 'Por favor, escribe un mensaje.',
          messageTooShort: 'El mensaje debe contener al menos 15 caracteres.',
          recipientRequiredForGmail:
            'Asigna primero el correo profesional destinatario (o usa tu correo de Gmail conectado) para enviar mediante la API de Gmail.',
        },
        validationReadyTitle: 'Datos validados correctamente',
        validationReadyPendingText:
          'Los campos del formulario son válidos. Dado que el destinatario se encuentra como [CORREO PROFESIONAL PENDIENTE], puedes iniciar sesión con Google para enviar o guardar un borrador en Gmail, configurar el correo profesional o copiar el mensaje al portapapeles.',
        validationReadyConfiguredText:
          'Los campos han sido validados correctamente. Puedes enviar el mensaje directamente mediante la API de Gmail (si has iniciado sesión con Google), guardarlo en borradores o abrir tu cliente de correo.',
      },
    },
    footer: {
      rights: 'José María Maroto · Portfolio Profesional',
      privacyNotice:
        'Web pública profesional · Sin publicación de datos privados sensibles (DNI, teléfono personal ni dirección particular).',
      backToTop: 'Volver arriba',
    },
  },
  en: {
    meta: {
      title: 'José María Maroto | Professional Portfolio',
      description:
        'Professional portfolio of José María Maroto, experienced professional in logistics, warehouse management, team coordination, and Artificial Intelligence training.',
    },
    nav: {
      home: 'Home',
      about: 'About Me',
      experience: 'Experience',
      competencies: 'Competencies',
      education: 'Education',
      contact: 'Contact',
      languageLabel: 'Language selector',
    },
    hero: {
      headline: '“Experience that moves. Innovation that transforms.”',
      subtitle:
        'Professional with an extensive track record in logistics, warehouse management, and team coordination. Committed to continuous improvement and professional growth through new technologies and Artificial Intelligence.',
      name: 'José María Maroto',
      pillarsLine:
        'Logistics · Team Management · Operational Organization · Artificial Intelligence',
      ctaPrimary: 'Explore my career',
      ctaSecondaryAvailable: 'Download résumé PDF',
      ctaSecondaryPending: 'Download résumé (PDF pending)',
      attachPdfLabel: 'Attach original CV PDF',
      removePdfLabel: 'Remove PDF',
      pdfPendingNotice:
        'Active placeholder: attach your original PDF résumé file to enable direct downloading.',
      scrollIndicator: 'Explore professional background',
      photoFrameTitle: 'Personal Photograph',
      photoCaption: 'José María Maroto · Logistics & Operational Management',
      changePhotoBtn: 'Update photo',
      restoreOriginalPhotoBtn: 'Restore original photo',
      captionArchitecture:
        'Modern distribution environments, operational organization, and inventory control.',
      summaryStrip: [
        {
          label: 'Documented Career',
          value: '1998 – Present',
          detail: 'Continuous progression across logistics operations, warehousing, and industry',
        },
        {
          label: 'Operational Scope',
          value: '9 Career Stages',
          detail: 'From distribution and CNC operations to Warehouse Manager and Silo Supervisor',
        },
        {
          label: 'Management Systems',
          value: 'SAP · Ulises · RPS',
          detail: 'Stock control, inventory management, traceability, and order fulfillment',
        },
        {
          label: 'Technological Growth',
          value: '120 Hours in AI',
          detail: 'Recent training completed at the Toledo Chamber of Commerce',
        },
      ],
    },
    about: {
      sectionIndex: '01',
      sectionLabel: 'About Me',
      title: '“Experience, commitment, and professional evolution.”',
      paragraphs: [
        'I am José María Maroto, a professional with an extensive background in logistics, warehouse management, and team coordination.',
        'Throughout my career, I have built hands-on experience in operational organization, inventory control, order preparation, incident resolution, and staff training.',
        'My background also includes working in industrial settings and numerical control (CNC) machining centers.',
        'I consider myself a reliable professional, committed to doing quality work and capable of adapting smoothly to different work environments.',
        'Currently, I continue expanding my knowledge through training in Artificial Intelligence, incorporating new tools and perspectives into my professional development.',
        'My goal is to continue contributing experience, organizational skills, and a strong willingness to learn to new professional challenges.',
      ],
      imageCaptionLeft:
        'Precision in physical warehouse organization, location control, and operational safety.',
      imageCaptionRight:
        'Integration of warehouse management systems (Ulises, RPS, SAP) and recent training in Artificial Intelligence.',
      positioningTitle: 'Core Working Principles',
      positioningItems: [
        {
          title: 'Reliability & Organization',
          description:
            'Methodical planning of daily operations, accurate stock and inventory oversight, and strict adherence to operational procedures.',
        },
        {
          title: 'Team Coordination & Onboarding',
          description:
            'Hands-on experience coordinating warehouse shifts and sections, onboarding and training new staff members, and resolving operational incidents.',
        },
        {
          title: 'Adaptability & Continuous Learning',
          description:
            'Proven ability to perform across diverse industrial and logistics sectors, complemented by current training in Artificial Intelligence tools.',
        },
      ],
    },
    experience: {
      sectionIndex: '02',
      sectionLabel: 'Professional Experience',
      title: 'Consolidated track record in operations, warehousing, and coordination.',
      subtitle:
        'A professional trajectory built from foundational warehouse and industrial operations up to Warehouse Manager and Silo Supervisor roles.',
      filters: {
        all: 'All Experience (10)',
        leadership: 'Management & Coordination',
        logistics: 'Logistics Operations',
        industrial: 'Industry, Sales & Delivery',
      },
      labels: {
        functions: 'Key Duties',
        responsibilities: 'Core Responsibility',
        contributions: 'Relevant Contributions & Learnings',
        expandDetails: 'View operational details',
        collapseDetails: 'Hide details',
      },
      items: [
        {
          id: 'fac-seguridad',
          company: 'FAC Seguridad',
          role: 'Silo Supervisor (Responsable de silo)',
          period: 'August 2019 – Present',
          category: 'leadership',
          functions: [
            'Order preparation and verification.',
            'Machine replenishment.',
            'Loading goods and pallets using forklifts.',
            'Inventory counts.',
            'Stock control.',
            'Operation of Ulises and RPS management systems.',
            'Support in staff training.',
          ],
          responsibilities:
            'Day-to-day oversight of silo operations, ensuring stock accuracy, uninterrupted machine replenishment, and thorough verification of orders prior to dispatch.',
          contributions:
            'Consistent management of stock records through Ulises and RPS systems while supporting the practical onboarding and training of team members.',
        },
        {
          id: 'grupo-uno-ctc',
          company: 'Grupo Uno CTC',
          role: 'Warehouse Manager (Jefe de almacén)',
          period: 'November 2016 – July 2019',
          category: 'leadership',
          functions: [
            'Staff supervision and coordination.',
            'Quality control.',
            'Operational safety and organization.',
            'Process optimization.',
            'Inventory control.',
            'Incident resolution.',
            'Operations support.',
            'Operation of overhead crane and counterbalance forklift.',
            'Direct communication with clients and suppliers.',
          ],
          responsibilities:
            'Full operational supervision of the warehouse, workload allocation across staff, enforcement of safety and quality standards, and direct liaison with clients and suppliers.',
          contributions:
            'Strengthened workflow coordination across warehouse sections, resolved inventory and shipping incidents effectively, and provided technical versatility operating overhead cranes and frontal forklifts.',
        },
        {
          id: 'ctc-sanofi',
          company: 'CTC Externalización — Sanofi',
          role: 'Forklift Operator (Carretillero)',
          period: 'June 2012 – November 2016',
          category: 'logistics',
          functions: [
            'Order preparation.',
            'Receiving and put-away of materials.',
            'Inventory counts.',
            'Staff training.',
            'Truck loading.',
            'Incident resolution.',
            'Workspace organization and cleanliness.',
          ],
          responsibilities:
            'Accurate execution of material handling, receiving, storage allocation, and inventory tracking within a pharmaceutical logistics facility requiring strict order and traceability.',
          contributions:
            'Actively trained incoming staff members, maintained high standards of workplace cleanliness and organization, and resolved loading and receiving issues promptly.',
        },
        {
          id: 'fnac',
          company: 'Fnac',
          role: 'Forklift Operator / Team Lead (Carretillero / Responsable de equipo)',
          period: 'July 2011 – February 2012',
          category: 'leadership',
          functions: [
            'Goods receiving and storage allocation.',
            'Picking replenishment.',
            'Inventory counts.',
            'Team coordination.',
            'Incident resolution.',
          ],
          responsibilities:
            'Daily coordination of the warehouse team across goods receiving, storage allocation, and continuous picking replenishment.',
          contributions:
            'Balanced hands-on forklift operations with team organization to resolve operational bottlenecks and incidents during high-volume periods.',
        },
        {
          id: 'dia',
          company: 'DIA',
          role: 'Warehouse Associate (Mozo de almacén)',
          period: 'September 2010 – December 2010',
          category: 'logistics',
          functions: ['Order preparation.', 'Voice picking operations.'],
          responsibilities:
            'Fast, accurate order fulfillment in a high-turnover retail distribution center using voice-directed picking systems.',
          contributions:
            'Quick adaptation to intensive logistics workflows and voice-picking warehouse technologies.',
        },
        {
          id: 'distribuciones-centro-sur',
          company: 'Distribuciones Centro Sur',
          role: 'Sales Representative (Comercial)',
          period: 'April 2010 – July 2010',
          category: 'industrial',
          functions: ['Client portfolio management.'],
          responsibilities:
            'Follow-up, commercial support, and management of the assigned client portfolio.',
          contributions:
            'Developed direct client communication skills and a clear understanding of customer needs across the distribution chain.',
        },
        {
          id: 'ramos-sierra',
          company: 'Ramos Sierra',
          role: 'Warehouse Associate (Mozo de almacén)',
          period: 'May 2005 – December 2008',
          category: 'logistics',
          functions: [
            'Order preparation.',
            'Truck loading.',
            'Delivery route preparation.',
          ],
          responsibilities:
            'Order assembly, structured loading of commercial vehicles, and advance preparation of delivery routes.',
          contributions:
            'Built a solid operational foundation in loading dock organization, load space optimization, and coordination between warehouse and transport.',
        },
        {
          id: 'desinsa',
          company: 'Desinsa',
          role: 'CNC Setup / Programmer (Preparador / programador de CNC)',
          period: 'September 1999 – May 2005',
          category: 'industrial',
          functions: [
            'CNC machine setup and preparation.',
            'Programming and adjustment of numerical control machining centers.',
            'Staff training and onboarding support.',
          ],
          responsibilities:
            'Prepared and programmed numerical control machining centers for accurate industrial production, while supporting the onboarding and practical training of new team members.',
          contributions:
            'Strengthened technical CNC expertise, improved the team’s operational autonomy, and transferred work, safety, and quality procedures to newly incorporated staff.',
        },
        {
          id: 'sirometal',
          company: 'Sirometal',
          role: 'CNC Machine Operator (Operario de centro de control numérico)',
          period: 'September 1998 – September 1999',
          category: 'industrial',
          functions: [
            'Work in an industrial manufacturing environment.',
            'Operations involving numerical control (CNC) machining centers.',
          ],
          responsibilities:
            'Execution and monitoring of machining operations on numerical control (CNC) equipment within an industrial plant.',
          contributions:
            'Gained industrial technical discipline, attention to detail in automated machining processes, and adherence to plant safety protocols.',
        },
        {
          id: 'ruipan',
          company: 'Ruipan',
          role: 'Delivery Driver (Conductor de reparto)',
          period: 'June 1998 – September 1998',
          category: 'industrial',
          functions: ['Goods delivery and distribution.'],
          responsibilities:
            'Timely transport and local distribution of goods along assigned delivery routes.',
          contributions:
            'Practical understanding of last-mile distribution and direct customer delivery service.',
        },
      ],
    },
    competencies: {
      sectionIndex: '03',
      sectionLabel: 'Professional Competencies',
      title: '“What I bring to an organization.”',
      subtitle:
        'Operational, organizational, and technical capabilities developed through hands-on experience across my career.',
      filterAll: 'View all areas',
      blocks: [
        {
          id: 'gestion-logistica',
          index: '01',
          title: 'Logistics Management',
          subtitle: 'End-to-end warehouse operations and material flow',
          items: [
            'Warehouse management.',
            'Order preparation.',
            'Inventory control.',
            'Stock control.',
            'Goods receiving and storage allocation.',
            'Loading and unloading.',
            'Operations organization.',
          ],
        },
        {
          id: 'coordinacion-liderazgo',
          index: '02',
          title: 'Coordination & Leadership',
          subtitle: 'Team organization, task allocation, and on-the-job training',
          items: [
            'Team coordination.',
            'Task distribution.',
            'Staff training.',
            'Support and onboarding for new workers.',
            'Organization of work sections.',
            'Incident resolution.',
          ],
        },
        {
          id: 'calidad-organizacion',
          index: '03',
          title: 'Quality & Organization',
          subtitle: 'Operational safety, workplace order, and procedural rigor',
          items: [
            'Quality control.',
            'Operational safety.',
            'Workplace order and cleanliness.',
            'Task optimization.',
            'Adherence to operational procedures.',
          ],
        },
        {
          id: 'herramientas-maquinaria',
          index: '04',
          title: 'Tools & Equipment',
          subtitle: 'Warehouse management systems and industrial machinery',
          items: [
            'SAP.',
            'Ulises.',
            'RPS.',
            'Forklift trucks (Carretillas elevadoras).',
            'Overhead crane (Puente grúa).',
            'Numerical control (CNC) machining centers.',
          ],
        },
      ],
      technicalNoteTitle: 'Transparency on Systems & Equipment',
      technicalNoteText:
        'Experience with software systems (SAP, Ulises, and RPS) and industrial machinery reflects practical day-to-day operational use in my professional roles.',
    },
    education: {
      sectionIndex: '04',
      sectionLabel: 'Education & Training',
      title: 'Vocational education, technical licensing, and Artificial Intelligence training.',
      subtitle:
        'An administrative and technical foundation complemented by recent training to understand and apply modern technological tools in the workplace.',
      featuredHeading: 'Recent Training · Professional Evolution',
      items: [
        {
          id: 'curso-ia',
          title: 'Artificial Intelligence Course (120 hours)',
          institution: 'Toledo Chamber of Commerce (Cámara de Comercio de Toledo)',
          detail: '120 training hours · Recent complementary education',
          description:
            'Training focused on understanding modern Artificial Intelligence tools and their practical application to support organization, workflow efficiency, and adaptation to evolving digital work environments.',
          featured: true,
          tagLabel: 'Technological Update · 120 hrs',
        },
        {
          id: 'fp-administracion',
          title:
            'Intermediate Vocational Training in Administration / Administrative Assistant (FP Grado Medio en Administración / Auxiliar Administrativo)',
          institution: 'Official Vocational Education',
          detail: 'Intermediate Vocational Degree · Administrative & document management',
          description:
            'Formal training in administrative organization, document control, operational record-keeping, and structured information management in business environments.',
          featured: false,
          tagLabel: 'Vocational Degree',
        },
        {
          id: 'carnet-carretillero',
          title: 'Forklift Operator Certificate (Carnet de carretillero)',
          institution: 'Professional Operational Certification',
          detail: 'Certified safe operation of forklift trucks',
          description:
            'Official certification for operating forklifts in loading, unloading, stacking, and safe material handling across warehouses and industrial facilities.',
          featured: false,
          tagLabel: 'Technical Certification',
        },
      ],
      languagesTitle: 'Languages',
      languagesList: [
        {
          language: 'Spanish',
          level: 'Native speaker',
          note: 'Full professional communication, team coordination, and client/supplier relations.',
        },
        {
          language: 'English',
          level: 'Basic level (as stated in CV)',
          note: 'Foundational understanding of basic workplace terms and standard operational vocabulary.',
        },
      ],
    },
    resumeBanner: {
      title: 'Printable Résumé in PDF Format',
      description:
        'You can download the PDF résumé once the original file has been attached, or link your original PDF file directly from your device to enable downloading.',
      downloadButton: 'Download résumé PDF',
      uploadButton: 'Attach original PDF',
      statusReady: 'Original PDF file verified and ready for download.',
      statusPending:
        'Current status: [Original PDF pending attachment]. No fictional links or fake documents are generated.',
    },
    contact: {
      sectionIndex: '05',
      sectionLabel: 'Contact & Gmail',
      title: '“Shall we talk about new opportunities?”',
      subtitle:
        'If you are looking for an experienced professional with strong organizational skills and a commitment to keep growing, I would be delighted to hear about new opportunities.',
      emailLabel: 'Professional Email Address',
      emailPlaceholderMarker: '[CORREO PROFESIONAL PENDIENTE]',
      emailMarkerExplanation:
        'Temporary placeholder active to avoid fictional contact data. You can connect your Gmail account with Google or manually assign your final professional email address.',
      configureEmailBtn: 'Assign professional email manually',
      saveEmailBtn: 'Save email',
      cancelEmailBtn: 'Cancel',
      gmailIntegration: {
        panelTitle: 'Direct Gmail Integration',
        panelDescription:
          'Sign in with Google to send messages directly through the official Gmail API, save drafts, or review your recent emails with your permission.',
        signInButton: 'Sign in with Google',
        signingInButton: 'Connecting to Google...',
        signOutButton: 'Sign out of Gmail',
        connectedAs: 'Connected Gmail account',
        useConnectedAsRecipient: 'Set this address as recipient email',
        sendViaGmailButton: 'Send email via Gmail API',
        saveDraftViaGmailButton: 'Save draft in Gmail',
        recentMessagesTitle: 'Recent messages in your Gmail account',
        refreshMessagesButton: 'Refresh inbox',
        noMessagesFound: 'No recent messages found in this account.',
        moveToTrashButton: 'Move to trash',
        confirmSendTitle: 'Confirm sending email via Gmail',
        confirmSendDescription:
          'Do you confirm that you want to send this email on your behalf using your connected Gmail account?',
        confirmDraftTitle: 'Confirm saving draft in Gmail',
        confirmDraftDescription:
          'Do you confirm that you want to save this message as a draft in your Gmail account?',
        confirmTrashTitle: 'Confirm moving message to Gmail Trash',
        confirmTrashDescription:
          'Are you sure you want to move this email message to the Trash in your Gmail account?',
        confirmActionBtn: 'Confirm & proceed',
        cancelActionBtn: 'Cancel',
        sentSuccessMessage:
          'Your email has been sent via the official Gmail API.',
        draftSuccessMessage:
          'Your draft has been saved to your Gmail account.',
        trashSuccessMessage:
          'The message was moved to your Gmail Trash.',
      },
      form: {
        nameLabel: 'Name',
        namePlaceholder: 'Your full name',
        companyLabel: 'Company',
        companyPlaceholder: 'Company or organization name',
        emailLabel: 'Email address',
        emailPlaceholder: 'name@company.com',
        messageLabel: 'Message',
        messagePlaceholder:
          'Briefly describe the role, project, or professional opportunity...',
        submitButton: 'Validate & prepare message',
        resetButton: 'Clear form',
        copyPayloadButton: 'Copy message to clipboard',
        copiedConfirmation: 'Message copied to clipboard',
        openMailClientButton: 'Open in email client',
        errors: {
          nameRequired: 'Please enter your name.',
          companyRequired: 'Please enter your company or organization.',
          emailRequired: 'Please enter a contact email address.',
          emailInvalid: 'Please enter a valid email address (e.g., name@company.com).',
          messageRequired: 'Please write a message.',
          messageTooShort: 'The message must be at least 15 characters long.',
          recipientRequiredForGmail:
            'Please assign a recipient professional email address first (or use your connected Gmail address) to send via the Gmail API.',
        },
        validationReadyTitle: 'Form data validated',
        validationReadyPendingText:
          'All form fields are valid. Because the recipient address is currently set to [CORREO PROFESIONAL PENDIENTE], you can sign in with Google to send or save a draft in Gmail, configure the recipient email address, or copy the message to your clipboard.',
        validationReadyConfiguredText:
          'All form fields have been validated. You can send the message directly via the Gmail API (when signed in with Google), save it as a Gmail draft, or open your email client.',
      },
    },
    footer: {
      rights: 'José María Maroto · Professional Portfolio',
      privacyNotice:
        'Public professional portfolio · Free of sensitive private data (no national ID, personal phone number, or home address published).',
      backToTop: 'Back to top',
    },
  },
};
