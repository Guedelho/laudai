import type { Metadata } from "next";
import { focusRing } from "@/lib/ui";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
const SIGNUP_URL = `${APP_URL}/signup`;
const LOGIN_URL = `${APP_URL}/login`;
const TERMS_URL = `${APP_URL}/legal/termos-de-uso`;
const PRIVACY_URL = `${APP_URL}/legal/politica-de-privacidade`;

const WHATSAPP_URL = "https://wa.me/5561992688663?text=Ol%C3%A1%21%20Tenho%20uma%20d%C3%BAvida%20sobre%20o%20Laudai.";

const DESCRIPTION =
  "O Laudai é uma IA criada por especialistas para gerar laudos veterinários estruturados em segundos. Você revisa, assina e exporta em PDF. 7 dias grátis, sem cartão.";

export const metadata: Metadata = {
  metadataBase: new URL("https://laudai.vet"),
  title: "Laudai: a IA de laudos veterinários criada por especialistas",
  description: DESCRIPTION,
  openGraph: {
    title: "Laudai: a IA de laudos veterinários criada por especialistas",
    description: DESCRIPTION,
    url: "/",
    siteName: "Laudai",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Laudai: a IA de laudos veterinários criada por especialistas",
    description: DESCRIPTION,
  },
};

const ctaPrimary = `inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 ${focusRing}`;
const ctaSecondary = `inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50 ${focusRing}`;

const sectionTitle = "text-2xl font-bold tracking-tight text-balance text-gray-900 sm:text-3xl lg:text-4xl";
const sectionIntro = "mx-auto mt-3 max-w-2xl text-base text-pretty text-gray-600 sm:text-lg";

function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
      />
    </svg>
  );
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24Zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.511 5.26l-.999 3.648 3.477-.945Zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413Z" />
    </svg>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#topo" className={`inline-flex rounded-lg ${focusRing}`}>
          <img src="/logo.svg" alt="Laudai" width={168} height={56} className="h-9 w-auto sm:h-10" />
        </a>
        <nav aria-label="Principal" className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex">
          <a href="#recursos" className="hover:text-gray-900">
            Recursos
          </a>
          <a href="#como-funciona" className="hover:text-gray-900">
            Como funciona
          </a>
          <a href="#preco" className="hover:text-gray-900">
            Preço
          </a>
          <a href="#contato" className="hover:text-gray-900">
            Contato
          </a>
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <a
            href={LOGIN_URL}
            className={`rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 ${focusRing}`}
          >
            Entrar
          </a>
          <a
            href={SIGNUP_URL}
            className={`inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:px-4 ${focusRing}`}
          >
            Criar conta<span className="hidden sm:inline">&nbsp;grátis</span>
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="topo" aria-labelledby="hero-title" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[860px] max-w-none -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-200/50 to-violet-200/50 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:py-28">
        <div className="animate-[fadeInUp_0.6s_ease-out_both] motion-reduce:animate-none">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/70 px-3 py-1 text-xs font-semibold text-violet-700">
            <Sparkle className="h-3.5 w-3.5" />
            Criado por especialistas em diagnóstico por imagem
          </span>
          <h1
            id="hero-title"
            className="mt-5 text-4xl leading-[1.1] font-bold tracking-tight text-balance text-gray-900 sm:text-5xl lg:text-6xl"
          >
            A <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">IA</span>{" "}
            para laudos veterinários, criada por especialistas.
          </h1>
          <p className="mt-5 max-w-xl text-base text-pretty text-gray-600 sm:text-lg lg:text-xl">
            O Laudai não é uma IA genérica: foi criado por especialistas para gerar laudos estruturados em segundos.
            Você revisa, assina e exporta em PDF.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={SIGNUP_URL} className={`${ctaPrimary} w-full sm:w-auto`}>
              Criar conta grátis
            </a>
            <a href={LOGIN_URL} className={`${ctaSecondary} w-full sm:w-auto`}>
              Entrar
            </a>
          </div>
          <p className="mt-3 text-sm text-gray-500">7 dias grátis, sem cartão de crédito.</p>
        </div>
        <div className="animate-[fadeInUp_0.7s_ease-out_both] motion-reduce:animate-none">
          <LaudoMock />
        </div>
      </div>
    </section>
  );
}

function LaudoMock() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-xl shadow-gray-200/60">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Achados do exame</span>
            <div className="flex items-center gap-1.5 text-gray-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.6}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                />
              </svg>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.6}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 6h.008v.008H18V6Z"
                />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-700">
            “Fígado com dimensões e ecogenicidade preservadas. Rim esquerdo medindo 4,1 cm, relação córtico-medular
            mantida. Pequena quantidade de sedimento em vesícula urinária.”
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Laudo estruturado</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-2 py-0.5 text-xs font-semibold text-white">
              <Sparkle className="h-3 w-3" />
              Gerado por IA
            </span>
          </div>
          <div className="mt-3 space-y-3">
            <MockSection title="Fígado" lines={["w-full", "w-4/5"]} />
            <MockSection title="Rim esquerdo" lines={["w-full", "w-3/5"]} />
            <MockSection title="Impressão diagnóstica" lines={["w-11/12", "w-2/3"]} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MockSection({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-blue-700 uppercase">{title}</p>
      <div className="mt-1.5 space-y-1.5" aria-hidden>
        {lines.map((w, i) => (
          <div key={i} className={`h-2 rounded-full bg-gray-100 ${w}`} />
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Descreva os achados",
      body: "Por voz, texto ou anexando as imagens do exame. Você guia, a IA escuta.",
    },
    {
      title: "A IA gera o laudo",
      body: "Estrutura tudo em seções padronizadas e lê as medidas das imagens, sem inventar valores.",
    },
    {
      title: "Revise, assine e exporte",
      body: "Edite o que quiser e gere o PDF com o logo da clínica e sua assinatura e CRMV.",
    },
  ];
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-funciona-title"
      className="scroll-mt-20 border-y border-gray-200 bg-gray-50"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 id="como-funciona-title" className={`text-center ${sectionTitle}`}>
          Como funciona
        </h2>
        <p className={`text-center ${sectionIntro}`}>
          Do achado ao laudo assinado em três passos. A IA faz o trabalho pesado e você mantém o controle.
        </p>
        <ol className="mt-10 grid gap-6 sm:mt-12 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-gray-200 bg-white p-6">
              <span
                aria-hidden
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-bold text-white"
              >
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FeatureIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function Features() {
  const features = [
    {
      title: "Assistente IA",
      body: "Tire dúvidas clínicas e gere laudos conversando, como num chat.",
      accent: true,
      d: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z",
    },
    {
      title: "Leitura das imagens",
      body: "A IA lê órgãos e medidas direto das imagens do ultrassom e nunca inventa valores.",
      d: "m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z",
    },
    {
      title: "Ditado por voz",
      body: "Transcrição em tempo real no navegador para falar os achados sem largar a sonda.",
      d: "M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z",
    },
    {
      title: "PDF profissional",
      body: "Exporte com o logo da clínica e a assinatura e CRMV do autor do laudo.",
      d: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
    },
    {
      title: "Laudos em equipe",
      body: "Toda a clínica compartilha laudos e pacientes, cada um com sua assinatura.",
      d: "M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z",
    },
    {
      title: "Histórico e versões",
      body: "Cada edição do laudo fica registrada, com segurança e rastreabilidade total.",
      d: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    },
  ];
  return (
    <section
      id="recursos"
      aria-labelledby="recursos-title"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
    >
      <h2 id="recursos-title" className={`text-center ${sectionTitle}`}>
        Tudo o que o laudo precisa
      </h2>
      <p className={`text-center ${sectionIntro}`}>
        Um assistente feito para a rotina da ultrassonografia veterinária.
      </p>
      <ul className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <li
            key={f.title}
            className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span
              aria-hidden
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${
                f.accent ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"
              }`}
            >
              <FeatureIcon d={f.d} />
            </span>
            <h3 className="mt-4 text-base font-semibold text-gray-900 sm:text-lg">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ForSpecialists() {
  const points = [
    {
      label: "Padrão de especialista",
      sub: "Estrutura e terminologia de quem é da área.",
      d: "M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z",
    },
    {
      label: "Conforme a LGPD",
      sub: "Consentimento e exclusão de dados.",
      d: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
    },
    {
      label: "Pronto para o CRMV",
      sub: "Assinatura e registro no laudo.",
      d: "M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10",
    },
  ];
  return (
    <section aria-labelledby="especialistas-title" className="border-y border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="especialistas-title" className={sectionTitle}>
            Criado por especialistas
          </h2>
          <p className={sectionIntro}>
            O Laudai foi criado por médicos veterinários especialistas em diagnóstico por imagem. A estrutura, a
            terminologia e o nível de detalhe seguem o que a área exige. A IA monta o rascunho e você mantém a palavra
            final.
          </p>
        </div>
        <ul className="mx-auto mt-10 grid max-w-4xl gap-6 sm:mt-12 sm:grid-cols-3">
          {points.map((p) => (
            <li key={p.label} className="rounded-2xl border border-gray-200 bg-white p-6">
              <span
                aria-hidden
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
              >
                <FeatureIcon d={p.d} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-gray-900">{p.label}</h3>
              <p className="mt-1 text-sm text-gray-600">{p.sub}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Pricing() {
  const included = [
    "Laudos de ultrassom abdominal com IA",
    "Assistente IA e ditado por voz",
    "PDF com logo, assinatura e CRMV",
    "Laudos em equipe e histórico de versões",
  ];
  return (
    <section
      id="preco"
      aria-labelledby="preco-title"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
    >
      <h2 id="preco-title" className={`text-center ${sectionTitle}`}>
        Preço simples
      </h2>
      <p className={`text-center ${sectionIntro}`}>Comece com 7 dias grátis. Sem cartão, sem compromisso.</p>
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:mt-12 sm:p-8">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight text-gray-900">R$ 99,90</span>
          <span className="text-gray-600">/mês</span>
        </div>
        <p className="mt-1 text-sm text-gray-600">ou R$ 990,90 por ano (economize 2 meses).</p>
        <ul className="mt-6 space-y-3">
          {included.map((it) => (
            <li key={it} className="flex items-start gap-2.5 text-sm text-gray-700">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.2}
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              {it}
            </li>
          ))}
        </ul>
        <a href={SIGNUP_URL} className={`${ctaPrimary} mt-8 w-full`}>
          Começar grátis
        </a>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section
      id="contato"
      aria-labelledby="contato-title"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center sm:p-12">
        <h2 id="contato-title" className={sectionTitle}>
          Ainda com dúvidas?
        </h2>
        <p className={sectionIntro}>
          Fale com a nossa equipe no WhatsApp. Respondemos rápido e ajudamos você a começar.
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1da851] focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:outline-none`}
        >
          <WhatsappIcon className="h-5 w-5" />
          Falar no WhatsApp
        </a>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-violet-600">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-balance text-white sm:text-3xl lg:text-4xl">
          Pronto para laudar mais rápido?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-white/85">
          Deixe a IA escrever o rascunho enquanto você cuida do que importa: o paciente.
        </p>
        <a
          href={SIGNUP_URL}
          className={`mt-8 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 ${focusRing}`}
        >
          Criar conta grátis
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <img src="/logo.svg" alt="Laudai" width={168} height={56} className="h-8 w-auto" />
        <nav
          aria-label="Rodapé"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600"
        >
          <a href="#recursos" className="hover:text-gray-900">
            Recursos
          </a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
            WhatsApp
          </a>
          <a href={TERMS_URL} className="hover:text-gray-900">
            Termos de uso
          </a>
          <a href={PRIVACY_URL} className="hover:text-gray-900">
            Privacidade
          </a>
          <a href={LOGIN_URL} className="hover:text-gray-900">
            Entrar
          </a>
        </nav>
        <span className="text-sm text-gray-500">© 2026 Laudai</span>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-blue-700 focus:shadow"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <Hero />
        <HowItWorks />
        <Features />
        <ForSpecialists />
        <Pricing />
        <Contact />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
