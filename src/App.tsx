/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  LogOut,
  Mail,
  Menu,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  Wrench,
  X,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User } from 'firebase/auth';
import {
  Language,
  ExperienceCategory,
  portfolioData,
  PORTFOLIO_IMAGES,
} from './data/portfolioData';
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  logout,
  fetchGmailProfile,
  sendGmailMessage,
  createGmailDraft,
  fetchRecentGmailMessages,
  trashGmailMessage,
  GmailProfile,
  GmailMessageSummary,
} from './services/gmailAuth';

const STORAGE_KEYS = {
  LANG: 'jmm_portfolio_lang_v1',
  PHOTO: 'jmm_portfolio_custom_photo_v1',
  PDF_DATA: 'jmm_portfolio_original_pdf_data_v1',
  PDF_NAME: 'jmm_portfolio_original_pdf_name_v1',
  PROFESSIONAL_EMAIL: 'jmm_portfolio_prof_email_v1',
};

interface FormValues {
  name: string;
  company: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  company?: string;
  email?: string;
  message?: string;
}

type PendingGmailConfirmation =
  | {
      type: 'send';
      to: string;
      subject: string;
      bodyText: string;
      replyTo: string;
    }
  | {
      type: 'draft';
      to: string;
      subject: string;
      bodyText: string;
      replyTo: string;
    }
  | {
      type: 'trash';
      messageId: string;
      subject: string;
      from: string;
    };

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LANG);
      return saved === 'en' ? 'en' : 'es';
    } catch {
      return 'es';
    }
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('inicio');
  const [expCategory, setExpCategory] = useState<ExperienceCategory>('all');
  const [expandedExpIds, setExpandedExpIds] = useState<Record<string, boolean>>({
    'fac-seguridad': true,
    'grupo-uno-ctc': true,
    'ctc-sanofi': true,
  });
  const [activeCompetencyId, setActiveCompetencyId] = useState<string | null>(
    null
  );

  // Personal photo state: defaults to José María Maroto's attached original photograph
  const [personalPhotoUrl, setPersonalPhotoUrl] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.PHOTO) ||
        PORTFOLIO_IMAGES.personalPortrait
      );
    } catch {
      return PORTFOLIO_IMAGES.personalPortrait;
    }
  });
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  // Original CV PDF state (strictly enabled only when a real PDF is provided)
  const [cvPdfDataUrl, setCvPdfDataUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.PDF_DATA);
    } catch {
      return null;
    }
  });
  const [cvPdfFileName, setCvPdfFileName] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.PDF_NAME) ||
        'CV_Jose_Maria_Maroto.pdf'
      );
    } catch {
      return 'CV_Jose_Maria_Maroto.pdf';
    }
  });
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);

  // Professional email configuration (defaults to [CORREO PROFESIONAL PENDIENTE])
  const [configuredEmail, setConfiguredEmail] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.PROFESSIONAL_EMAIL) || '';
    } catch {
      return '';
    }
  });
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [emailConfigError, setEmailConfigError] = useState<string | null>(null);

  // Image fallback resilience states
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  // Contact form state
  const [formValues, setFormValues] = useState<FormValues>({
    name: '',
    company: '',
    email: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formValidated, setFormValidated] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Google Workspace / Gmail OAuth state (token cached strictly in memory)
  const [needsAuth, setNeedsAuth] = useState(true);
  const [gmailUser, setGmailUser] = useState<User | null>(null);
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [gmailProfile, setGmailProfile] = useState<GmailProfile | null>(null);
  const [recentMessages, setRecentMessages] = useState<GmailMessageSummary[]>(
    []
  );
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);
  const [gmailSuccessBanner, setGmailSuccessBanner] = useState<string | null>(
    null
  );
  const [isExecutingGmailAction, setIsExecutingGmailAction] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingGmailConfirmation | null>(null);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const t = portfolioData[lang];

  // Initialize Firebase Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGmailUser(user);
        setGmailToken(token);
        setNeedsAuth(false);
      },
      () => {
        setGmailUser(null);
        setGmailToken(null);
        setGmailProfile(null);
        setRecentMessages([]);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync document language, title, and meta description when switching ES | EN
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.meta.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', t.meta.description);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.LANG, lang);
    } catch {
      // Ignore storage errors
    }
  }, [lang, t.meta.title, t.meta.description]);

  // Track active navigation section on scroll
  useEffect(() => {
    const sectionIds = [
      'inicio',
      'sobre-mi',
      'experiencia',
      'competencias',
      'formacion',
      'contacto',
    ];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadGmailAccountData = async (accessToken: string) => {
    setIsLoadingGmail(true);
    setGmailError(null);
    try {
      const [profile, messages] = await Promise.all([
        fetchGmailProfile(accessToken),
        fetchRecentGmailMessages(accessToken, 5),
      ]);
      setGmailProfile(profile);
      setRecentMessages(messages);
    } catch (err: any) {
      console.error('Error loading Gmail data:', err);
      setGmailError(
        lang === 'es'
          ? 'No se pudieron cargar los datos de Gmail. Verifica los permisos concedidos.'
          : 'Could not load Gmail data. Please verify the granted permissions.'
      );
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setGmailError(null);
    setGmailSuccessBanner(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGmailUser(result.user);
        setGmailToken(result.accessToken);
        setNeedsAuth(false);
        await loadGmailAccountData(result.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      setGmailError(
        lang === 'es'
          ? 'Se canceló o falló el inicio de sesión con Google.'
          : 'Google Sign-In was cancelled or failed.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setGmailUser(null);
    setGmailToken(null);
    setGmailProfile(null);
    setRecentMessages([]);
    setNeedsAuth(true);
    setGmailSuccessBanner(null);
    setGmailError(null);
  };

  const handleRefreshGmailMessages = async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    await loadGmailAccountData(token);
  };

  const handleLanguageSwitch = (newLang: Language) => {
    setLang(newLang);
    if (Object.keys(formErrors).length > 0) {
      setFormErrors({});
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle updating personal photograph
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoUploadError(
        lang === 'es'
          ? 'Selecciona un archivo de imagen válido (JPG, PNG, WEBP).'
          : 'Please select a valid image file (JPG, PNG, WEBP).'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result) {
        setPersonalPhotoUrl(result);
        setImgFailed((prev) => ({ ...prev, portrait: false }));
        try {
          localStorage.setItem(STORAGE_KEYS.PHOTO, result);
        } catch {
          // Keep in session state if quota exceeded
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRestoreOriginalPhoto = () => {
    setPersonalPhotoUrl(PORTFOLIO_IMAGES.personalPortrait);
    setImgFailed((prev) => ({ ...prev, portrait: false }));
    setPhotoUploadError(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.PHOTO);
    } catch {
      // Ignore
    }
  };

  // Handle attaching original CV PDF
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPdfUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setPdfUploadError(
        lang === 'es'
          ? 'Selecciona un archivo PDF real (.pdf).'
          : 'Please select a valid PDF file (.pdf).'
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result) {
        setCvPdfDataUrl(result);
        setCvPdfFileName(file.name);
        try {
          localStorage.setItem(STORAGE_KEYS.PDF_DATA, result);
          localStorage.setItem(STORAGE_KEYS.PDF_NAME, file.name);
        } catch {
          // Keep in memory if file exceeds quota
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePdf = () => {
    setCvPdfDataUrl(null);
    setPdfUploadError(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.PDF_DATA);
      localStorage.removeItem(STORAGE_KEYS.PDF_NAME);
    } catch {
      // Ignore
    }
  };

  const handleDownloadPdf = () => {
    if (!cvPdfDataUrl) return;
    const link = document.createElement('a');
    link.href = cvPdfDataUrl;
    link.download = cvPdfFileName || 'CV_Jose_Maria_Maroto.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExperienceExpand = (id: string) => {
    setExpandedExpIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredExperiences = t.experience.items.filter((item) =>
    expCategory === 'all' ? true : item.category === expCategory
  );

  // Save or clear professional email
  const handleSaveProfessionalEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailDraft.trim();
    if (!trimmed) {
      setConfiguredEmail('');
      try {
        localStorage.removeItem(STORAGE_KEYS.PROFESSIONAL_EMAIL);
      } catch {
        // Ignore
      }
      setIsEditingEmail(false);
      setEmailConfigError(null);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailConfigError(t.contact.form.errors.emailInvalid);
      return;
    }
    setConfiguredEmail(trimmed);
    try {
      localStorage.setItem(STORAGE_KEYS.PROFESSIONAL_EMAIL, trimmed);
    } catch {
      // Ignore
    }
    setIsEditingEmail(false);
    setEmailConfigError(null);
  };

  // Validate contact form fields
  const validateForm = (values: FormValues): FormErrors => {
    const errors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!values.name.trim()) {
      errors.name = t.contact.form.errors.nameRequired;
    }
    if (!values.company.trim()) {
      errors.company = t.contact.form.errors.companyRequired;
    }
    if (!values.email.trim()) {
      errors.email = t.contact.form.errors.emailRequired;
    } else if (!emailRegex.test(values.email.trim())) {
      errors.email = t.contact.form.errors.emailInvalid;
    }
    if (!values.message.trim()) {
      errors.message = t.contact.form.errors.messageRequired;
    } else if (values.message.trim().length < 15) {
      errors.message = t.contact.form.errors.messageTooShort;
    }

    return errors;
  };

  const handleFormChange = (field: keyof FormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (formValidated) {
      setFormValidated(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGmailError(null);
    setGmailSuccessBanner(null);
    const validationErrors = validateForm(formValues);
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setFormValidated(true);
    } else {
      setFormValidated(false);
    }
  };

  const handleResetForm = () => {
    setFormValues({ name: '', company: '', email: '', message: '' });
    setFormErrors({});
    setFormValidated(false);
    setCopiedPayload(false);
    setGmailSuccessBanner(null);
    setGmailError(null);
  };

  const getActiveRecipientEmail = () => {
    return (
      configuredEmail ||
      gmailProfile?.emailAddress ||
      gmailUser?.email ||
      ''
    );
  };

  const formatPreparedMessage = () => {
    const dest = getActiveRecipientEmail() || t.contact.emailPlaceholderMarker;
    if (lang === 'es') {
      return `Para: ${dest}\nNombre: ${formValues.name.trim()}\nEmpresa: ${formValues.company.trim()}\nCorreo de contacto: ${formValues.email.trim()}\n\nMensaje:\n${formValues.message.trim()}`;
    }
    return `To: ${dest}\nName: ${formValues.name.trim()}\nCompany: ${formValues.company.trim()}\nContact Email: ${formValues.email.trim()}\n\nMessage:\n${formValues.message.trim()}`;
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(formatPreparedMessage());
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 3000);
    } catch {
      // Ignore clipboard error
    }
  };

  // Request user confirmation before sending email or saving draft via Gmail API
  const handleRequestGmailAction = (actionType: 'send' | 'draft') => {
    setGmailError(null);
    setGmailSuccessBanner(null);
    const validationErrors = validateForm(formValues);
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const recipient = getActiveRecipientEmail();
    if (!recipient) {
      setGmailError(t.contact.form.errors.recipientRequiredForGmail);
      return;
    }

    const subject =
      lang === 'es'
        ? `Contacto Portfolio José María Maroto: ${formValues.company.trim()} (${formValues.name.trim()})`
        : `Portfolio Inquiry — José María Maroto: ${formValues.company.trim()} (${formValues.name.trim()})`;

    const bodyText = formatPreparedMessage();

    setPendingConfirmation({
      type: actionType,
      to: recipient,
      subject,
      bodyText,
      replyTo: formValues.email.trim(),
    });
  };

  const handleRequestTrashMessage = (msg: GmailMessageSummary) => {
    setGmailError(null);
    setGmailSuccessBanner(null);
    setPendingConfirmation({
      type: 'trash',
      messageId: msg.id,
      subject: msg.subject,
      from: msg.from,
    });
  };

  // Execute confirmed Gmail API operation
  const handleConfirmGmailAction = async () => {
    if (!pendingConfirmation) return;
    const token = await getAccessToken();
    if (!token) {
      setPendingConfirmation(null);
      setNeedsAuth(true);
      return;
    }

    setIsExecutingGmailAction(true);
    setGmailError(null);
    setGmailSuccessBanner(null);

    try {
      if (pendingConfirmation.type === 'send') {
        await sendGmailMessage(token, {
          to: pendingConfirmation.to,
          subject: pendingConfirmation.subject,
          bodyText: pendingConfirmation.bodyText,
          replyTo: pendingConfirmation.replyTo,
        });
        setGmailSuccessBanner(t.contact.gmailIntegration.sentSuccessMessage);
        await loadGmailAccountData(token);
      } else if (pendingConfirmation.type === 'draft') {
        await createGmailDraft(token, {
          to: pendingConfirmation.to,
          subject: pendingConfirmation.subject,
          bodyText: pendingConfirmation.bodyText,
          replyTo: pendingConfirmation.replyTo,
        });
        setGmailSuccessBanner(t.contact.gmailIntegration.draftSuccessMessage);
        await loadGmailAccountData(token);
      } else if (pendingConfirmation.type === 'trash') {
        await trashGmailMessage(token, pendingConfirmation.messageId);
        setRecentMessages((prev) =>
          prev.filter((m) => m.id !== pendingConfirmation.messageId)
        );
        setGmailSuccessBanner(t.contact.gmailIntegration.trashSuccessMessage);
      }
      setPendingConfirmation(null);
    } catch (err: any) {
      console.error('Gmail operation failed:', err);
      setGmailError(
        err?.message ||
          (lang === 'es'
            ? 'Error al ejecutar la operación en Gmail.'
            : 'Error executing Gmail operation.')
      );
      setPendingConfirmation(null);
    } finally {
      setIsExecutingGmailAction(false);
    }
  };

  const navItems = [
    { id: 'inicio', label: t.nav.home },
    { id: 'sobre-mi', label: t.nav.about },
    { id: 'experiencia', label: t.nav.experience },
    { id: 'competencias', label: t.nav.competencies },
    { id: 'formacion', label: t.nav.education },
    { id: 'contacto', label: t.nav.contact },
  ];

  const isCustomPhotoLoaded =
    personalPhotoUrl !== PORTFOLIO_IMAGES.personalPortrait;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col">
      {/* Hidden File Inputs for Personal Photo & Real CV PDF */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handlePhotoUpload}
        className="sr-only"
        aria-label={t.hero.changePhotoBtn}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handlePdfUpload}
        className="sr-only"
        aria-label={t.hero.attachPdfLabel}
      />

      {/* MANDATORY CONFIRMATION MODAL FOR GMAIL MUTATING OPERATIONS */}
      <AnimatePresence>
        {pendingConfirmation && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="gmail-confirm-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 sm:p-7 shadow-xl"
            >
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-200">
                <h3
                  id="gmail-confirm-modal-title"
                  className="text-lg font-bold text-zinc-950"
                >
                  {pendingConfirmation.type === 'send'
                    ? t.contact.gmailIntegration.confirmSendTitle
                    : pendingConfirmation.type === 'draft'
                    ? t.contact.gmailIntegration.confirmDraftTitle
                    : t.contact.gmailIntegration.confirmTrashTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setPendingConfirmation(null)}
                  disabled={isExecutingGmailAction}
                  className="text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                  aria-label={t.contact.gmailIntegration.cancelActionBtn}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="mt-4 text-sm text-zinc-600 leading-relaxed">
                {pendingConfirmation.type === 'send'
                  ? t.contact.gmailIntegration.confirmSendDescription
                  : pendingConfirmation.type === 'draft'
                  ? t.contact.gmailIntegration.confirmDraftDescription
                  : t.contact.gmailIntegration.confirmTrashDescription}
              </p>

              {/* Details of the item affected */}
              <div className="mt-4 p-4 rounded-lg border border-zinc-200 bg-[#FAFAFA] text-xs space-y-2 font-mono-tabular text-zinc-700">
                {pendingConfirmation.type === 'trash' ? (
                  <>
                    <p>
                      <span className="font-semibold text-zinc-900">
                        Asunto / Subject:
                      </span>{' '}
                      {pendingConfirmation.subject}
                    </p>
                    <p>
                      <span className="font-semibold text-zinc-900">
                        De / From:
                      </span>{' '}
                      {pendingConfirmation.from}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <span className="font-semibold text-zinc-900">
                        Para / To:
                      </span>{' '}
                      {pendingConfirmation.to}
                    </p>
                    <p>
                      <span className="font-semibold text-zinc-900">
                        Asunto / Subject:
                      </span>{' '}
                      {pendingConfirmation.subject}
                    </p>
                    <div className="pt-2 border-t border-zinc-200/80 max-h-36 overflow-y-auto whitespace-pre-wrap font-sans text-zinc-600">
                      {pendingConfirmation.bodyText}
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingConfirmation(null)}
                  disabled={isExecutingGmailAction}
                  className="px-4 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {t.contact.gmailIntegration.cancelActionBtn}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGmailAction}
                  disabled={isExecutingGmailAction}
                  className="px-5 py-2.5 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isExecutingGmailAction
                    ? '...'
                    : t.contact.gmailIntegration.confirmActionBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOP BAR CONTRACT: 3 Clean Zones (Brand Wordmark — Single-Line Nav Links — Language Action) */}
      <header className="sticky top-0 z-40 bg-[#FAFAFA]/90 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('inicio');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-zinc-950 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900"
          >
            José María Maroto
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="Principal"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-zinc-600"
          >
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.id);
                  }}
                  className={`relative py-1 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900 ${
                    isActive
                      ? 'text-zinc-950 font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-950"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: Language Selector ES | EN & Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              role="group"
              aria-label={t.nav.languageLabel}
              className="inline-flex items-center bg-zinc-200/70 p-0.5 rounded-lg border border-zinc-300/60"
            >
              <button
                type="button"
                onClick={() => handleLanguageSwitch('es')}
                aria-pressed={lang === 'es'}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  lang === 'es'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                ES
              </button>
              <span
                aria-hidden="true"
                className="text-zinc-400 text-xs select-none px-0.5"
              >
                |
              </span>
              <button
                type="button"
                onClick={() => handleLanguageSwitch('en')}
                aria-pressed={lang === 'en'}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
              aria-label="Mobile"
              className="lg:hidden border-b border-zinc-200 bg-white px-6 py-4"
            >
              <ul className="flex flex-col space-y-2">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(item.id);
                      }}
                      className={`block py-2 text-sm font-medium transition-colors ${
                        activeSection === item.id
                          ? 'text-zinc-950 font-semibold'
                          : 'text-zinc-600 hover:text-zinc-950'
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        {/* =====================================================================
            PORTADA PRINCIPAL (HERO SECTION)
           ===================================================================== */}
        <section
          id="inicio"
          className="relative overflow-hidden border-b border-zinc-200/80 bg-white"
        >
          {/* Subtle Architectural Background Image with Measured Light Scrim */}
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
            {!imgFailed.hero ? (
              <img
                src={PORTFOLIO_IMAGES.heroLogistics}
                alt={t.hero.captionArchitecture}
                referrerPolicy="no-referrer"
                onError={() =>
                  setImgFailed((prev) => ({ ...prev, hero: true }))
                }
                className="w-full h-full object-cover object-center opacity-[0.14] scale-102"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-100 via-zinc-50 to-white" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/88 to-white" />
          </div>

          <div className="relative max-w-[1280px] mx-auto px-6 sm:px-8 pt-12 pb-14 lg:pt-20 lg:pb-20">
            {/* 2-Column Editorial Hero Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Left Column (8 cols): Protagonist Headline, Subtitle, Secondary Identity & CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-8 flex flex-col justify-between"
              >
                <div>
                  {/* Secondary Identity & Unboxed Pillars Line (Zero-Pill Discipline) */}
                  <div className="mb-6 pb-5 border-b border-zinc-200/90">
                    <p className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900">
                      {t.hero.name}
                    </p>
                    <p className="mt-1.5 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {t.hero.pillarsLine}
                    </p>
                  </div>

                  {/* Absolute Protagonist Main Headline */}
                  <h1
                    className="text-zinc-950 font-bold tracking-tight leading-[1.08] mb-6"
                    style={{ fontSize: 'clamp(2.25rem, 4.3vw, 4rem)' }}
                  >
                    {t.hero.headline}
                  </h1>

                  {/* Lead Subtitle */}
                  <p className="text-base sm:text-lg lg:text-xl text-zinc-700 leading-relaxed max-w-[66ch] font-normal">
                    {t.hero.subtitle}
                  </p>
                </div>

                {/* Action Buttons & Real PDF Control */}
                <div className="mt-10 pt-6 border-t border-zinc-200/80">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Primary CTA: Conocer mi trayectoria */}
                    <button
                      type="button"
                      onClick={() => scrollToSection('experiencia')}
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-zinc-950 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
                    >
                      <span>{t.hero.ctaPrimary}</span>
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Secondary CTA: Descargar currículum (Active ONLY if real PDF is provided) */}
                    {cvPdfDataUrl ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadPdf}
                          className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-lg border border-zinc-900 bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>{t.hero.ctaSecondaryAvailable}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePdf}
                          title={t.hero.removePdfLabel}
                          className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          disabled
                          aria-disabled="true"
                          className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-zinc-200 bg-zinc-100 text-zinc-400 text-sm font-medium whitespace-nowrap shrink-0 cursor-not-allowed"
                        >
                          <FileText className="w-4 h-4" />
                          <span>{t.hero.ctaSecondaryPending}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => pdfInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:text-zinc-950 hover:border-zinc-400 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{t.hero.attachPdfLabel}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {pdfUploadError && (
                    <p role="alert" className="mt-2 text-xs text-red-700">
                      {pdfUploadError}
                    </p>
                  )}

                  {/* Scroll Indicator */}
                  <div className="mt-8 flex items-center gap-3">
                    <a
                      href="#sobre-mi"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection('sobre-mi');
                      }}
                      className="group inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      <span>{t.hero.scrollIndicator}</span>
                      <ArrowDown className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-y-0.5" />
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Right Column (4 cols): Discreet Personal Portrait (Original Attached Photo) + Logistics Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="lg:col-span-4 flex flex-col justify-between gap-6"
              >
                {/* Discreet Personal Portrait Card */}
                <div className="rounded-xl border border-zinc-200 bg-[#FAFAFA] p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-zinc-200/80">
                    <span className="text-xs font-medium text-zinc-500">
                      {t.hero.photoFrameTitle}
                    </span>
                    <span className="font-mono-tabular text-xs text-zinc-400">
                      J. M. Maroto
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="aspect-[4/4.4] w-full max-w-[230px] mx-auto overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-2xs">
                      {!imgFailed.portrait ? (
                        <img
                          src={personalPhotoUrl}
                          alt={t.hero.name}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setImgFailed((prev) => ({
                              ...prev,
                              portrait: true,
                            }))
                          }
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-700 font-serif-editorial text-2xl font-semibold">
                          JMM
                        </div>
                      )}
                    </div>

                    <p className="text-center text-xs text-zinc-600 font-medium">
                      {t.hero.photoCaption}
                    </p>

                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{t.hero.changePhotoBtn}</span>
                      </button>
                      {isCustomPhotoLoaded && (
                        <button
                          type="button"
                          onClick={handleRestoreOriginalPhoto}
                          className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {t.hero.restoreOriginalPhotoBtn}
                        </button>
                      )}
                    </div>

                    {photoUploadError && (
                      <p
                        role="alert"
                        className="text-center text-xs text-red-700"
                      >
                        {photoUploadError}
                      </p>
                    )}
                  </div>
                </div>

                {/* High-Resolution Modern Logistics Visual Card */}
                <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                  <div className="aspect-[16/9] w-full overflow-hidden bg-zinc-100">
                    {!imgFailed.heroCard ? (
                      <img
                        src={PORTFOLIO_IMAGES.heroLogistics}
                        alt={t.hero.captionArchitecture}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImgFailed((prev) => ({
                            ...prev,
                            heroCard: true,
                          }))
                        }
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-500 p-4 text-xs text-center">
                        {t.hero.captionArchitecture}
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white">
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {t.hero.captionArchitecture}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Full-Width 4-Column Factual Summary Row Below Hero Split */}
            <div className="mt-12 pt-8 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.hero.summaryStrip.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-zinc-200/80 bg-[#FAFAFA]"
                >
                  <p className="text-xs text-zinc-500 font-medium">
                    {item.label}
                  </p>
                  <p className="mt-1.5 text-lg font-bold text-zinc-950 font-mono-tabular tracking-tight">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================================
            01. SECCIÓN «SOBRE MÍ»
           ===================================================================== */}
        <section
          id="sobre-mi"
          className="py-20 lg:py-28 border-b border-zinc-200/80 bg-[#FAFAFA]"
        >
          <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="font-mono-tabular text-xs font-semibold text-zinc-400">
                {t.about.sectionIndex}.
              </span>
              <span className="text-xs font-semibold tracking-wide text-zinc-600">
                {t.about.sectionLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              {/* Left Column (7 cols): Exact Editorial Narrative */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45 }}
                className="lg:col-span-7"
              >
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950 leading-tight mb-8">
                  {t.about.title}
                </h2>

                <div className="space-y-5 text-base sm:text-[17px] text-zinc-700 leading-[1.75] max-w-[68ch]">
                  {t.about.paragraphs.map((paragraph, index) => (
                    <p
                      key={index}
                      className={
                        index === 0
                          ? 'text-zinc-950 font-medium text-lg sm:text-xl leading-relaxed'
                          : ''
                      }
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>

              {/* Right Column (5 cols): Industrial & Technology Visual Composition */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: 0.08 }}
                className="lg:col-span-5 space-y-6"
              >
                <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                    {!imgFailed.warehouse ? (
                      <img
                        src={PORTFOLIO_IMAGES.warehouseOperations}
                        alt={t.about.imageCaptionLeft}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImgFailed((prev) => ({
                            ...prev,
                            warehouse: true,
                          }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-500 p-6 text-xs text-center">
                        {t.about.imageCaptionLeft}
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-zinc-100">
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {t.about.imageCaptionLeft}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                  <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                    {!imgFailed.techWorkspace ? (
                      <img
                        src={PORTFOLIO_IMAGES.technologyWorkspace}
                        alt={t.about.imageCaptionRight}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setImgFailed((prev) => ({
                            ...prev,
                            techWorkspace: true,
                          }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-500 p-6 text-xs text-center">
                        {t.about.imageCaptionRight}
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-zinc-100">
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {t.about.imageCaptionRight}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 3 Core Working Pillars */}
            <div className="mt-16 pt-12 border-t border-zinc-200">
              <h3 className="text-sm font-semibold text-zinc-500 mb-6">
                {t.about.positioningTitle}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {t.about.positioningItems.map((pillar, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-xl border border-zinc-200 bg-white"
                  >
                    <span className="font-mono-tabular text-xs font-medium text-zinc-400">
                      0{idx + 1}
                    </span>
                    <h4 className="mt-2 text-base font-bold text-zinc-950">
                      {pillar.title}
                    </h4>
                    <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            02. SECCIÓN «EXPERIENCIA PROFESIONAL»
           ===================================================================== */}
        <section
          id="experiencia"
          className="py-20 lg:py-28 border-b border-zinc-200/80 bg-white"
        >
          <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
              <div>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="font-mono-tabular text-xs font-semibold text-zinc-400">
                    {t.experience.sectionIndex}.
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-zinc-600">
                    {t.experience.sectionLabel}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950 max-w-2xl">
                  {t.experience.title}
                </h2>
                <p className="mt-3 text-base text-zinc-600 max-w-2xl leading-relaxed">
                  {t.experience.subtitle}
                </p>
              </div>

              {/* Interactive Filter Controls */}
              <div
                role="group"
                aria-label={t.experience.sectionLabel}
                className="flex flex-wrap items-center gap-1.5 p-1.5 bg-zinc-100 rounded-xl border border-zinc-200/80 self-start"
              >
                {(
                  [
                    { key: 'all', label: t.experience.filters.all },
                    {
                      key: 'leadership',
                      label: t.experience.filters.leadership,
                    },
                    { key: 'logistics', label: t.experience.filters.logistics },
                    {
                      key: 'industrial',
                      label: t.experience.filters.industrial,
                    },
                  ] as { key: ExperienceCategory; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setExpCategory(tab.key)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      expCategory === tab.key
                        ? 'bg-zinc-950 text-white shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editorial Timeline & Experience Cards */}
            <div className="space-y-6">
              {filteredExperiences.map((exp, index) => {
                const isExpanded = !!expandedExpIds[exp.id];
                return (
                  <motion.article
                    key={exp.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min(index * 0.04, 0.2),
                    }}
                    className="rounded-xl border border-zinc-200 bg-[#FAFAFA] hover:border-zinc-300 transition-colors duration-150 overflow-hidden"
                  >
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 pb-5 border-b border-zinc-200/80">
                        <div>
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <h3 className="text-xl sm:text-2xl font-bold text-zinc-950 tracking-tight">
                              {exp.company}
                            </h3>
                            <span
                              aria-hidden="true"
                              className="text-zinc-300"
                            >
                              ·
                            </span>
                            <span className="text-base sm:text-lg font-medium text-zinc-700">
                              {exp.role}
                            </span>
                          </div>
                        </div>
                        <p className="font-mono-tabular text-xs sm:text-sm font-medium text-zinc-600 shrink-0">
                          {exp.period}
                        </p>
                      </div>

                      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="p-5 rounded-lg bg-white border border-zinc-200/80">
                          <p className="text-xs font-semibold text-zinc-500 mb-2">
                            {t.experience.labels.responsibilities}
                          </p>
                          <p className="text-sm sm:text-[15px] text-zinc-800 leading-relaxed">
                            {exp.responsibilities}
                          </p>
                        </div>

                        <div className="p-5 rounded-lg bg-white border border-zinc-200/80">
                          <p className="text-xs font-semibold text-zinc-500 mb-2">
                            {t.experience.labels.contributions}
                          </p>
                          <p className="text-sm sm:text-[15px] text-zinc-800 leading-relaxed">
                            {exp.contributions}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-zinc-200/60">
                        <button
                          type="button"
                          onClick={() => toggleExperienceExpand(exp.id)}
                          aria-expanded={isExpanded}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <span>
                            {isExpanded
                              ? t.experience.labels.collapseDetails
                              : t.experience.labels.expandDetails}{' '}
                            ({exp.functions.length})
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-4">
                                <p className="text-xs font-medium text-zinc-500 mb-3">
                                  {t.experience.labels.functions}:
                                </p>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {exp.functions.map((fn, fnIdx) => (
                                    <li
                                      key={fnIdx}
                                      className="flex items-start gap-2.5 text-sm text-zinc-700 bg-white px-3.5 py-2.5 rounded-lg border border-zinc-200/70"
                                    >
                                      <span
                                        aria-hidden="true"
                                        className="font-mono-tabular text-xs text-zinc-400 mt-0.5 select-none"
                                      >
                                        {String(fnIdx + 1).padStart(2, '0')}
                                      </span>
                                      <span>{fn}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            03. SECCIÓN «COMPETENCIAS PROFESIONALES»
           ===================================================================== */}
        <section
          id="competencias"
          className="py-20 lg:py-28 border-b border-zinc-200/80 bg-[#FAFAFA]"
        >
          <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="font-mono-tabular text-xs font-semibold text-zinc-400">
                    {t.competencies.sectionIndex}.
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-zinc-600">
                    {t.competencies.sectionLabel}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950">
                  {t.competencies.title}
                </h2>
                <p className="mt-3 text-base text-zinc-600 max-w-2xl leading-relaxed">
                  {t.competencies.subtitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-zinc-200/70 rounded-xl border border-zinc-300/60 self-start">
                <button
                  type="button"
                  onClick={() => setActiveCompetencyId(null)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    activeCompetencyId === null
                      ? 'bg-white text-zinc-950 shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  {t.competencies.filterAll}
                </button>
                {t.competencies.blocks.map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() =>
                      setActiveCompetencyId((prev) =>
                        prev === block.id ? null : block.id
                      )
                    }
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                      activeCompetencyId === block.id
                        ? 'bg-white text-zinc-950 shadow-2xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    {block.index}. {block.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {t.competencies.blocks
                .filter((b) =>
                  activeCompetencyId ? b.id === activeCompetencyId : true
                )
                .map((block) => {
                  const IconComponent =
                    block.id === 'gestion-logistica'
                      ? Layers
                      : block.id === 'coordinacion-liderazgo'
                      ? UserCheck
                      : block.id === 'calidad-organizacion'
                      ? ShieldCheck
                      : Wrench;

                  return (
                    <motion.div
                      key={block.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-4 pb-5 border-b border-zinc-100">
                          <div>
                            <span className="font-mono-tabular text-xs font-semibold text-zinc-400">
                              {block.index}
                            </span>
                            <h3 className="mt-1 text-xl font-bold text-zinc-950">
                              {block.title}
                            </h3>
                            <p className="mt-1 text-xs text-zinc-500">
                              {block.subtitle}
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-lg border border-zinc-200 bg-[#FAFAFA] flex items-center justify-center text-zinc-700 shrink-0">
                            <IconComponent className="w-5 h-5" />
                          </div>
                        </div>

                        <ul className="mt-6 space-y-3">
                          {block.items.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between gap-4 py-2 border-b border-zinc-100 last:border-b-0 text-sm sm:text-[15px] text-zinc-800"
                            >
                              <span className="font-medium">{item}</span>
                              <span className="font-mono-tabular text-xs text-zinc-400">
                                {block.index}.{idx + 1}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            <div className="mt-8 p-5 rounded-xl border border-zinc-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-zinc-900">
                  {t.competencies.technicalNoteTitle}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-zinc-600">
                  {t.competencies.technicalNoteText}
                </p>
              </div>
              <span className="font-mono-tabular text-xs text-zinc-500 shrink-0">
                SAP · Ulises · RPS · CNC
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================================
            04. SECCIÓN «FORMACIÓN»
           ===================================================================== */}
        <section
          id="formacion"
          className="py-20 lg:py-28 border-b border-zinc-200/80 bg-white"
        >
          <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
            <div className="mb-12">
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-mono-tabular text-xs font-semibold text-zinc-400">
                  {t.education.sectionIndex}.
                </span>
                <span className="text-xs font-semibold tracking-wide text-zinc-600">
                  {t.education.sectionLabel}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950 max-w-2xl">
                {t.education.title}
              </h2>
              <p className="mt-3 text-base text-zinc-600 max-w-2xl leading-relaxed">
                {t.education.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {t.education.items
                .filter((item) => item.featured)
                .map((featuredItem) => (
                  <motion.div
                    key={featuredItem.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                    className="lg:col-span-7 rounded-xl border border-zinc-900 bg-zinc-950 text-white p-7 sm:p-9 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-4 pb-5 border-b border-zinc-800">
                        <span className="text-xs font-medium text-zinc-300 tracking-wide">
                          {t.education.featuredHeading}
                        </span>
                        <Sparkles className="w-5 h-5 text-zinc-300 shrink-0" />
                      </div>

                      <h3 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                        {featuredItem.title}
                      </h3>
                      <p className="mt-2 text-sm sm:text-base font-medium text-zinc-300">
                        {featuredItem.institution}
                      </p>
                      <p className="mt-1 font-mono-tabular text-xs text-zinc-400">
                        {featuredItem.detail}
                      </p>

                      <p className="mt-6 text-sm sm:text-base text-zinc-300 leading-relaxed">
                        {featuredItem.description}
                      </p>
                    </div>

                    <div className="mt-8 pt-5 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                      <span>{featuredItem.tagLabel}</span>
                      <span className="font-mono-tabular">120 h</span>
                    </div>
                  </motion.div>
                ))}

              <div className="lg:col-span-5 flex flex-col gap-6">
                {t.education.items
                  .filter((item) => !item.featured)
                  .map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.06 }}
                      className="rounded-xl border border-zinc-200 bg-[#FAFAFA] p-6 sm:p-7 flex-1 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-200/80">
                          <span className="text-xs font-medium text-zinc-500">
                            {item.tagLabel}
                          </span>
                          <GraduationCap className="w-4 h-4 text-zinc-600 shrink-0" />
                        </div>
                        <h3 className="mt-4 text-lg font-bold text-zinc-950 leading-snug">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs font-medium text-zinc-600">
                          {item.institution} · {item.detail}
                        </p>
                        <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-zinc-200">
              <h3 className="text-sm font-semibold text-zinc-500 mb-4">
                {t.education.languagesTitle}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {t.education.languagesList.map((langItem, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl border border-zinc-200 bg-[#FAFAFA] flex flex-col justify-between"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-base font-bold text-zinc-950">
                        {langItem.language}
                      </span>
                      <span className="font-mono-tabular text-xs font-medium text-zinc-600">
                        {langItem.level}
                      </span>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {langItem.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Downloadable Résumé PDF Banner */}
            <div className="mt-12 p-6 sm:p-8 rounded-xl border border-zinc-200 bg-[#FAFAFA] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <h3 className="text-lg font-bold text-zinc-950">
                  {t.resumeBanner.title}
                </h3>
                <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
                  {t.resumeBanner.description}
                </p>
                <p className="mt-2 font-mono-tabular text-xs text-zinc-500">
                  {cvPdfDataUrl
                    ? `${t.resumeBanner.statusReady} (${cvPdfFileName})`
                    : t.resumeBanner.statusPending}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={!cvPdfDataUrl}
                  aria-disabled={!cvPdfDataUrl}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    cvPdfDataUrl
                      ? 'bg-zinc-950 text-white hover:bg-zinc-800 cursor-pointer'
                      : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>{t.resumeBanner.downloadButton}</span>
                </button>

                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>{t.resumeBanner.uploadButton}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            05. SECCIÓN «CONTACTO» E INTEGRACIÓN GMAIL
           ===================================================================== */}
        <section id="contacto" className="py-20 lg:py-28 bg-[#FAFAFA]">
          <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              {/* Left Column (5 cols): Editorial Contact Pitch, Email Marker & Gmail Workspace Panel */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="font-mono-tabular text-xs font-semibold text-zinc-400">
                      {t.contact.sectionIndex}.
                    </span>
                    <span className="text-xs font-semibold tracking-wide text-zinc-600">
                      {t.contact.sectionLabel}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-950">
                    {t.contact.title}
                  </h2>

                  <p className="mt-4 text-base text-zinc-600 leading-relaxed">
                    {t.contact.subtitle}
                  </p>
                </div>

                {/* Email Address Block with Mandatory [CORREO PROFESIONAL PENDIENTE] Marker */}
                <div className="p-6 rounded-xl border border-zinc-200 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-500">
                      {t.contact.emailLabel}
                    </span>
                    <Mail className="w-4 h-4 text-zinc-500" />
                  </div>

                  <p className="mt-2 font-mono-tabular text-sm sm:text-base font-semibold text-zinc-950 break-all">
                    {configuredEmail || t.contact.emailPlaceholderMarker}
                  </p>

                  <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                    {t.contact.emailMarkerExplanation}
                  </p>

                  {!isEditingEmail ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEmailDraft(configuredEmail);
                        setIsEditingEmail(true);
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-800 hover:text-zinc-950 underline underline-offset-4 cursor-pointer"
                    >
                      <span>{t.contact.configureEmailBtn}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <form
                      onSubmit={handleSaveProfessionalEmail}
                      className="mt-4 pt-4 border-t border-zinc-100 space-y-3"
                    >
                      <input
                        type="email"
                        value={emailDraft}
                        onChange={(e) => {
                          setEmailDraft(e.target.value);
                          setEmailConfigError(null);
                        }}
                        placeholder="ejemplo@dominio.com"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-[#FAFAFA] text-zinc-900 focus:outline-2 focus:outline-zinc-900"
                      />
                      {emailConfigError && (
                        <p className="text-xs text-red-700">
                          {emailConfigError}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-md bg-zinc-950 text-white text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
                        >
                          {t.contact.saveEmailBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingEmail(false);
                            setEmailConfigError(null);
                          }}
                          className="px-3 py-1.5 rounded-md border border-zinc-300 bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 cursor-pointer"
                        >
                          {t.contact.cancelEmailBtn}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Official Google Workspace / Gmail API Panel */}
                <div className="p-6 rounded-xl border border-zinc-200 bg-white space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950">
                      {t.contact.gmailIntegration.panelTitle}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                      {t.contact.gmailIntegration.panelDescription}
                    </p>
                  </div>

                  {needsAuth || !gmailToken ? (
                    <div className="pt-1">
                      {/* Official "Sign in with Google" Material Button */}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoggingIn}
                        className="gsi-material-button"
                      >
                        <div className="gsi-material-button-state"></div>
                        <div className="gsi-material-button-content-wrapper">
                          <div className="gsi-material-button-icon">
                            <svg
                              version="1.1"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 48 48"
                              xmlnsXlink="http://www.w3.org/1999/xlink"
                              style={{ display: 'block' }}
                            >
                              <path
                                fill="#EA4335"
                                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                              ></path>
                              <path
                                fill="#4285F4"
                                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                              ></path>
                              <path
                                fill="#FBBC05"
                                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                              ></path>
                              <path
                                fill="#34A853"
                                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                              ></path>
                              <path fill="none" d="M0 0h48v48H0z"></path>
                            </svg>
                          </div>
                          <span className="gsi-material-button-contents">
                            {isLoggingIn
                              ? t.contact.gmailIntegration.signingInButton
                              : t.contact.gmailIntegration.signInButton}
                          </span>
                          <span style={{ display: 'none' }}>
                            Sign in with Google
                          </span>
                        </div>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2 border-t border-zinc-100">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs text-zinc-500">
                            {t.contact.gmailIntegration.connectedAs}
                          </p>
                          <p className="font-mono-tabular text-xs sm:text-sm font-semibold text-zinc-950 break-all">
                            {gmailProfile?.emailAddress || gmailUser?.email}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleGoogleLogout}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-[#FAFAFA] text-zinc-700 hover:text-zinc-950 text-xs font-medium transition-colors cursor-pointer shrink-0"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t.contact.gmailIntegration.signOutButton}</span>
                        </button>
                      </div>

                      {(gmailProfile?.emailAddress || gmailUser?.email) &&
                        configuredEmail !==
                          (gmailProfile?.emailAddress || gmailUser?.email) && (
                          <button
                            type="button"
                            onClick={() => {
                              const addr =
                                gmailProfile?.emailAddress ||
                                gmailUser?.email ||
                                '';
                              if (addr) {
                                setConfiguredEmail(addr);
                                try {
                                  localStorage.setItem(
                                    STORAGE_KEYS.PROFESSIONAL_EMAIL,
                                    addr
                                  );
                                } catch {
                                  // Ignore
                                }
                              }
                            }}
                            className="text-xs font-semibold text-zinc-800 hover:text-zinc-950 underline underline-offset-4 cursor-pointer"
                          >
                            {t.contact.gmailIntegration.useConnectedAsRecipient}
                          </button>
                        )}

                      {/* Recent Gmail Messages Preview */}
                      <div className="pt-3 border-t border-zinc-100">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-xs font-semibold text-zinc-700">
                            {t.contact.gmailIntegration.recentMessagesTitle}
                          </span>
                          <button
                            type="button"
                            onClick={handleRefreshGmailMessages}
                            disabled={isLoadingGmail}
                            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${
                                isLoadingGmail ? 'animate-spin' : ''
                              }`}
                            />
                            <span>
                              {t.contact.gmailIntegration.refreshMessagesButton}
                            </span>
                          </button>
                        </div>

                        {recentMessages.length === 0 ? (
                          <p className="text-xs text-zinc-500 py-2">
                            {isLoadingGmail
                              ? '...'
                              : t.contact.gmailIntegration.noMessagesFound}
                          </p>
                        ) : (
                          <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {recentMessages.map((msg) => (
                              <li
                                key={msg.id}
                                className="p-3 rounded-lg border border-zinc-200/80 bg-[#FAFAFA] flex items-start justify-between gap-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-zinc-900 truncate">
                                    {msg.subject}
                                  </p>
                                  <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                                    {msg.from}
                                  </p>
                                  <p className="text-[11px] text-zinc-600 line-clamp-1 mt-1">
                                    {msg.snippet}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRequestTrashMessage(msg)}
                                  title={
                                    t.contact.gmailIntegration.moveToTrashButton
                                  }
                                  className="p-1.5 rounded-md text-zinc-400 hover:text-red-700 hover:bg-white transition-colors cursor-pointer shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {gmailError && (
                    <p
                      role="alert"
                      className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"
                    >
                      {gmailError}
                    </p>
                  )}

                  {gmailSuccessBanner && (
                    <p
                      role="status"
                      className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3 font-medium"
                    >
                      {gmailSuccessBanner}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column (7 cols): Accessible Contact Form + Direct Gmail Actions */}
              <div className="lg:col-span-7">
                <form
                  onSubmit={handleFormSubmit}
                  noValidate
                  className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-10 shadow-2xs"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Nombre */}
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-semibold text-zinc-800 mb-2"
                      >
                        {t.contact.form.nameLabel} *
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        value={formValues.name}
                        onChange={(e) =>
                          handleFormChange('name', e.target.value)
                        }
                        placeholder={t.contact.form.namePlaceholder}
                        aria-invalid={!!formErrors.name}
                        aria-describedby={
                          formErrors.name ? 'error-contact-name' : undefined
                        }
                        className={`w-full px-4 py-3 text-sm rounded-lg border bg-[#FAFAFA] text-zinc-950 placeholder:text-zinc-400 transition-colors focus:bg-white focus:outline-2 focus:outline-zinc-950 ${
                          formErrors.name ? 'border-red-600' : 'border-zinc-300'
                        }`}
                      />
                      {formErrors.name && (
                        <p
                          id="error-contact-name"
                          role="alert"
                          className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.name}</span>
                        </p>
                      )}
                    </div>

                    {/* Empresa */}
                    <div>
                      <label
                        htmlFor="contact-company"
                        className="block text-xs font-semibold text-zinc-800 mb-2"
                      >
                        {t.contact.form.companyLabel} *
                      </label>
                      <input
                        id="contact-company"
                        name="company"
                        type="text"
                        autoComplete="organization"
                        value={formValues.company}
                        onChange={(e) =>
                          handleFormChange('company', e.target.value)
                        }
                        placeholder={t.contact.form.companyPlaceholder}
                        aria-invalid={!!formErrors.company}
                        aria-describedby={
                          formErrors.company
                            ? 'error-contact-company'
                            : undefined
                        }
                        className={`w-full px-4 py-3 text-sm rounded-lg border bg-[#FAFAFA] text-zinc-950 placeholder:text-zinc-400 transition-colors focus:bg-white focus:outline-2 focus:outline-zinc-950 ${
                          formErrors.company
                            ? 'border-red-600'
                            : 'border-zinc-300'
                        }`}
                      />
                      {formErrors.company && (
                        <p
                          id="error-contact-company"
                          role="alert"
                          className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{formErrors.company}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Correo electrónico */}
                  <div className="mt-6">
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-zinc-800 mb-2"
                    >
                      {t.contact.form.emailLabel} *
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formValues.email}
                      onChange={(e) =>
                        handleFormChange('email', e.target.value)
                      }
                      placeholder={t.contact.form.emailPlaceholder}
                      aria-invalid={!!formErrors.email}
                      aria-describedby={
                        formErrors.email ? 'error-contact-email' : undefined
                      }
                      className={`w-full px-4 py-3 text-sm rounded-lg border bg-[#FAFAFA] text-zinc-950 placeholder:text-zinc-400 transition-colors focus:bg-white focus:outline-2 focus:outline-zinc-950 ${
                        formErrors.email ? 'border-red-600' : 'border-zinc-300'
                      }`}
                    />
                    {formErrors.email && (
                      <p
                        id="error-contact-email"
                        role="alert"
                        className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Mensaje */}
                  <div className="mt-6">
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-semibold text-zinc-800 mb-2"
                    >
                      {t.contact.form.messageLabel} *
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      value={formValues.message}
                      onChange={(e) =>
                        handleFormChange('message', e.target.value)
                      }
                      placeholder={t.contact.form.messagePlaceholder}
                      aria-invalid={!!formErrors.message}
                      aria-describedby={
                        formErrors.message ? 'error-contact-message' : undefined
                      }
                      className={`w-full px-4 py-3 text-sm rounded-lg border bg-[#FAFAFA] text-zinc-950 placeholder:text-zinc-400 transition-colors focus:bg-white focus:outline-2 focus:outline-zinc-950 resize-y ${
                        formErrors.message
                          ? 'border-red-600'
                          : 'border-zinc-300'
                      }`}
                    />
                    {formErrors.message && (
                      <p
                        id="error-contact-message"
                        role="alert"
                        className="mt-1.5 flex items-center gap-1.5 text-xs text-red-700"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit, Gmail Send/Draft, and Reset Controls */}
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-zinc-950 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Mail className="w-4 h-4" />
                        <span>{t.contact.form.submitButton}</span>
                      </button>

                      {!needsAuth && gmailToken && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRequestGmailAction('send')}
                            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-zinc-900 bg-white text-zinc-950 hover:bg-zinc-100 text-sm font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Send className="w-4 h-4" />
                            <span>
                              {t.contact.gmailIntegration.sendViaGmailButton}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRequestGmailAction('draft')}
                            className="inline-flex items-center gap-2 px-4 py-3.5 rounded-lg border border-zinc-300 bg-[#FAFAFA] text-zinc-800 hover:bg-zinc-100 text-xs font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <FileText className="w-4 h-4" />
                            <span>
                              {
                                t.contact.gmailIntegration
                                  .saveDraftViaGmailButton
                              }
                            </span>
                          </button>
                        </>
                      )}
                    </div>

                    {(formValues.name ||
                      formValues.company ||
                      formValues.email ||
                      formValues.message) && (
                      <button
                        type="button"
                        onClick={handleResetForm}
                        className="px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-950 transition-colors cursor-pointer"
                      >
                        {t.contact.form.resetButton}
                      </button>
                    )}
                  </div>

                  {/* Validation & Integration Panel */}
                  <AnimatePresence>
                    {formValidated && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        role="status"
                        className="mt-6 p-5 rounded-xl border border-zinc-300 bg-[#FAFAFA] space-y-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-zinc-950">
                              {t.contact.form.validationReadyTitle}
                            </h4>
                            <p className="mt-1 text-xs sm:text-sm text-zinc-700 leading-relaxed">
                              {getActiveRecipientEmail()
                                ? t.contact.form.validationReadyConfiguredText
                                : t.contact.form.validationReadyPendingText}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={handleCopyPayload}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            {copiedPayload ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>
                                  {t.contact.form.copiedConfirmation}
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{t.contact.form.copyPayloadButton}</span>
                              </>
                            )}
                          </button>

                          {getActiveRecipientEmail() && (
                            <a
                              href={`mailto:${encodeURIComponent(
                                getActiveRecipientEmail()
                              )}?subject=${encodeURIComponent(
                                `${formValues.company.trim()} — ${formValues.name.trim()}`
                              )}&body=${encodeURIComponent(
                                formatPreparedMessage()
                              )}`}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                            >
                              <span>
                                {t.contact.form.openMailClientButton}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* QUIET EDITORIAL FOOTER */}
      <footer className="border-t border-zinc-200 bg-white py-10">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-zinc-950">{t.footer.rights}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {t.footer.privacyNotice}
            </p>
          </div>

          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('inicio');
            }}
            className="text-xs font-semibold text-zinc-700 hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0"
          >
            {t.footer.backToTop} ↑
          </a>
        </div>
      </footer>
    </div>
  );
}
