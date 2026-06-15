import type { Metadata } from "next";
import { focusRing } from "@/lib/ui";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";
const SIGNUP_URL = `${APP_URL}/signup`;
const LOGIN_URL = `${APP_URL}/login`;
const TERMS_URL = `${APP_URL}/legal/termos-de-uso`;
const PRIVACY_URL = `${APP_URL}/legal/politica-de-privacidade`;

const WHATSAPP_URL = "https://wa.me/5561992688663?text=Ol%C3%A1%21%20Tenho%20uma%20d%C3%BAvida%20sobre%20o%20Laudai.";

const ORIGIN = "https://laudai.vet";

// Page <title> leads with the search query ("laudo de ultrassom veterinário"),
// brand last, kept under ~60 chars so it isn't truncated in the SERP.
const SEO_TITLE = "Laudo de ultrassom veterinário por especialistas | Laudai";
// Social cards favor the benefit hook over the brand prefix.
const SOCIAL_TITLE = "Laudos de ultrassom com padrão de especialista, em segundos";

const DESCRIPTION =
  "Laudos de ultrassom veterinário por médicos especialistas em diagnóstico por imagem. Estruture, revise e exporte em PDF em segundos. 7 dias grátis, sem cartão.";

export const metadata: Metadata = {
  metadataBase: new URL(ORIGIN),
  title: SEO_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Laudai",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Laudai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SOCIAL_TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${ORIGIN}/#organization`,
      name: "Laudai",
      url: ORIGIN,
      logo: `${ORIGIN}/apple-icon.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${ORIGIN}/#website`,
      name: "Laudai",
      url: ORIGIN,
      inLanguage: "pt-BR",
      publisher: { "@id": `${ORIGIN}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${ORIGIN}/#app`,
      name: "Laudai",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      url: ORIGIN,
      inLanguage: "pt-BR",
      description: DESCRIPTION,
      publisher: { "@id": `${ORIGIN}/#organization` },
      offers: {
        "@type": "Offer",
        price: "99.90",
        priceCurrency: "BRL",
        url: SIGNUP_URL,
      },
    },
  ],
};

const ctaPrimary = `inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 ${focusRing}`;
const ctaSecondary = `inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50 ${focusRing}`;

const sectionTitle = "text-2xl font-bold tracking-tight text-balance text-gray-900 sm:text-3xl lg:text-4xl";
const sectionIntro = "mx-auto mt-3 max-w-2xl text-base text-pretty text-gray-600 sm:text-lg";

const ICONS = {
  checkBadge:
    "M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z",
  bolt: "m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z",
  image:
    "m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z",
  microphone:
    "M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z",
  chat: "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z",
  document:
    "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
  team: "M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z",
  shield:
    "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
  lock: "M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  signature:
    "M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10",
  check: "m4.5 12.75 6 6 9-13.5",
} as const;

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      className={className ?? "h-5 w-5"}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.7}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
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
          <a href="#seguranca" className="hover:text-gray-900">
            Segurança
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
  const reassurances = ["7 dias grátis, sem cartão", "Conforme a LGPD", "Pronto para o CRMV"];
  return (
    <section id="topo" aria-labelledby="hero-title" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[860px] max-w-none -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-200/50 to-violet-200/50 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:py-28">
        <div className="animate-[fadeInUp_0.6s_ease-out_both] motion-reduce:animate-none">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-semibold text-blue-700">
            <Icon d={ICONS.checkBadge} className="h-3.5 w-3.5" />
            Feito por veterinários ultrassonografistas
          </span>
          <h1
            id="hero-title"
            className="mt-5 text-4xl leading-[1.1] font-bold tracking-tight text-balance text-gray-900 sm:text-5xl lg:text-6xl"
          >
            Laudos de ultrassom com{" "}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              padrão de especialista
            </span>
            , prontos em segundos.
          </h1>
          <p className="mt-5 max-w-xl text-base text-pretty text-gray-600 sm:text-lg lg:text-xl">
            Criado por médicos veterinários especialistas em diagnóstico por imagem. Você descreve os achados e o Laudai
            estrutura o laudo na hora. Revise, assine e exporte em PDF, com seus dados protegidos.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={SIGNUP_URL} className={`${ctaPrimary} w-full sm:w-auto`}>
              Criar conta grátis
            </a>
            <a href={LOGIN_URL} className={`${ctaSecondary} w-full sm:w-auto`}>
              Entrar
            </a>
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500">
            {reassurances.map((r) => (
              <li key={r} className="inline-flex items-center gap-1.5">
                <Icon d={ICONS.check} className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                {r}
              </li>
            ))}
          </ul>
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
              <Icon d={ICONS.microphone} className="h-4 w-4" />
              <Icon d={ICONS.image} className="h-4 w-4" />
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
              <Icon d={ICONS.bolt} className="h-3 w-3" />
              Pronto em segundos
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

function ForSpecialists() {
  const points = [
    {
      label: "Padrão de especialista",
      sub: "Seções, terminologia e nível de detalhe de quem é da área.",
      d: ICONS.checkBadge,
    },
    {
      label: "Medidas confiáveis",
      sub: "Valores lidos das imagens do exame, nunca inventados.",
      d: ICONS.image,
    },
    {
      label: "Pronto para o CRMV",
      sub: "Assinatura e registro do responsável em todo laudo.",
      d: ICONS.signature,
    },
  ];
  return (
    <section aria-labelledby="especialistas-title" className="border-y border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="especialistas-title" className={sectionTitle}>
            Criado por quem vive a ultrassonografia
          </h2>
          <p className={sectionIntro}>
            O Laudai foi criado por médicos veterinários especialistas em diagnóstico por imagem, gente que passa o dia
            na frente do aparelho. Cada laudo sai com a estrutura, a terminologia e o nível de detalhe que a área exige.
            E a palavra final é sempre sua.
          </p>
        </div>
        <ul className="mx-auto mt-10 grid max-w-4xl gap-6 sm:mt-12 sm:grid-cols-3">
          {points.map((p) => (
            <li key={p.label} className="rounded-2xl border border-gray-200 bg-white p-6">
              <span
                aria-hidden
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
              >
                <Icon d={p.d} />
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

function HowItWorks() {
  const steps = [
    {
      title: "Descreva os achados",
      body: "Por voz, texto ou anexando as imagens do exame, do jeito que for mais rápido para você.",
    },
    {
      title: "Receba o laudo estruturado",
      body: "Em segundos, tudo organizado nas seções que a área exige, com as medidas lidas das imagens.",
    },
    {
      title: "Revise, assine e exporte",
      body: "Edite o que quiser e gere o PDF com o logo da clínica e sua assinatura e CRMV.",
    },
  ];
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-title" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 id="como-funciona-title" className={`text-center ${sectionTitle}`}>
          Como funciona
        </h2>
        <p className={`text-center ${sectionIntro}`}>
          Do achado ao laudo assinado em três passos. Você mantém o controle do início ao fim.
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

function Features() {
  const features = [
    {
      title: "Laudo em segundos",
      body: "Dos achados ao laudo estruturado em segundos, não em mais uma hora de digitação no fim do dia.",
      d: ICONS.bolt,
    },
    {
      title: "Leitura das imagens",
      body: "Órgãos e medidas lidos direto das imagens do ultrassom. Valores nunca são inventados.",
      d: ICONS.image,
    },
    {
      title: "Ditado por voz",
      body: "Transcrição em tempo real no navegador para falar os achados sem largar a sonda.",
      d: ICONS.microphone,
    },
    {
      title: "Assistente clínico",
      body: "Tire dúvidas e gere laudos conversando, como num chat, no ritmo do plantão.",
      d: ICONS.chat,
    },
    {
      title: "PDF profissional",
      body: "Exporte com o logo da clínica e a assinatura e CRMV do autor do laudo.",
      d: ICONS.document,
    },
    {
      title: "Laudos em equipe",
      body: "Toda a clínica compartilha laudos e pacientes, cada um com sua assinatura.",
      d: ICONS.team,
    },
  ];
  return (
    <section
      id="recursos"
      aria-labelledby="recursos-title"
      className="scroll-mt-20 border-y border-gray-200 bg-gray-50"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 id="recursos-title" className={`text-center ${sectionTitle}`}>
          Tudo o que o laudo precisa
        </h2>
        <p className={`text-center ${sectionIntro}`}>
          Feito para a rotina da ultrassonografia veterinária: rápido no plantão, confiável no resultado.
        </p>
        <ul className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li
              key={f.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <span
                aria-hidden
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
              >
                <Icon d={f.d} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-gray-900 sm:text-lg">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Security() {
  const points = [
    {
      label: "Conforme a LGPD",
      sub: "Consentimento registrado e direito de exclusão dos seus dados, sempre.",
      d: ICONS.shield,
    },
    {
      label: "Acesso restrito",
      sub: "Laudos e imagens em armazenamento privado, visíveis apenas para você e quem você convidar.",
      d: ICONS.lock,
    },
    {
      label: "Histórico completo",
      sub: "Cada edição registrada, com versões e rastreabilidade de ponta a ponta.",
      d: ICONS.clock,
    },
  ];
  return (
    <section
      id="seguranca"
      aria-labelledby="seguranca-title"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="seguranca-title" className={sectionTitle}>
          Segurança levada a sério
        </h2>
        <p className={sectionIntro}>
          Laudo é documento clínico. O Laudai trata os dados dos seus pacientes e tutores com o cuidado que eles exigem.
        </p>
      </div>
      <ul className="mx-auto mt-10 grid max-w-4xl gap-6 sm:mt-12 sm:grid-cols-3">
        {points.map((p) => (
          <li key={p.label} className="rounded-2xl border border-gray-200 bg-white p-6">
            <span
              aria-hidden
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
            >
              <Icon d={p.d} />
            </span>
            <h3 className="mt-4 text-base font-semibold text-gray-900">{p.label}</h3>
            <p className="mt-1 text-sm text-gray-600">{p.sub}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Pricing() {
  const included = [
    "Laudos de ultrassom abdominal em segundos",
    "Assistente clínico e ditado por voz",
    "PDF com logo, assinatura e CRMV",
    "Equipe, histórico de versões e segurança LGPD",
  ];
  return (
    <section id="preco" aria-labelledby="preco-title" className="scroll-mt-20 border-y border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
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
                  <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.check} />
                </svg>
                {it}
              </li>
            ))}
          </ul>
          <a href={SIGNUP_URL} className={`${ctaPrimary} mt-8 w-full`}>
            Começar grátis
          </a>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Preciso de cartão de crédito para testar?",
    a: "Não. O teste de 7 dias começa no cadastro, sem cartão. Ao fim do período, você só assina se quiser continuar.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. O cancelamento é feito na própria plataforma, em poucos cliques, e o acesso vale até o fim do período já pago.",
  },
  {
    q: "O laudo sai pronto para assinar?",
    a: "Sim. O PDF sai com o logo da clínica, a assinatura e o CRMV do responsável. Você revisa e edita tudo antes de exportar.",
  },
  {
    q: "Como meus dados são tratados?",
    a: "Conforme a LGPD: consentimento registrado, armazenamento privado e direito de exclusão dos seus dados a qualquer momento.",
  },
  {
    q: "Preciso instalar alguma coisa?",
    a: "Não. O Laudai roda no navegador, no computador ou no tablet. O ditado por voz funciona melhor no Chrome e no Edge.",
  },
];

function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 id="faq-title" className={`text-center ${sectionTitle}`}>
        Dúvidas frequentes
      </h2>
      <div className="mx-auto mt-10 max-w-3xl space-y-3 sm:mt-12">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-gray-200 bg-white p-5">
            <summary
              className={`flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-base font-semibold text-gray-900 [&::-webkit-details-marker]:hidden ${focusRing}`}
            >
              {f.q}
              <Icon
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
                className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-pretty text-gray-600 sm:text-base">{f.a}</p>
          </details>
        ))}
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
          Laudos com padrão de especialista, prontos em segundos, para você cuidar do que importa: o paciente.
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
          <a href="#faq" className="hover:text-gray-900">
            Dúvidas frequentes
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-blue-700 focus:shadow"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <Hero />
        <ForSpecialists />
        <HowItWorks />
        <Features />
        <Security />
        <Pricing />
        <Faq />
        <Contact />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
