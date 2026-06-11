import type { Metadata } from "next";
import { focusRing } from "@/lib/ui";

const APP_URL = "https://app.laudai.vet";
const SIGNUP_URL = `${APP_URL}/signup`;
const LOGIN_URL = `${APP_URL}/login`;

export const metadata: Metadata = {
  title: "Laudai — Assistente de IA para laudos veterinários",
  description:
    "Assistente de IA para laudos veterinários: descreva os achados e gere o laudo estruturado em segundos. Revise, assine e exporte em PDF. 7 dias grátis, sem cartão.",
};

const ctaPrimary = `inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 ${focusRing}`;
const ctaSecondary = `inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 ${focusRing}`;

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

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <span className="text-lg font-bold tracking-tight text-gray-900">Laudai</span>
        <nav className="hidden items-center gap-7 text-sm font-medium text-gray-600 sm:flex">
          <a href="#recursos" className="hover:text-gray-900">
            Recursos
          </a>
          <a href="#como-funciona" className="hover:text-gray-900">
            Como funciona
          </a>
          <a href="#preco" className="hover:text-gray-900">
            Preço
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={LOGIN_URL}
            className={`text-sm font-medium text-gray-700 hover:text-gray-900 ${focusRing} rounded-lg px-2 py-1.5`}
          >
            Entrar
          </a>
          <a
            href={SIGNUP_URL}
            className={`inline-flex items-center rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 ${focusRing}`}
          >
            Criar conta grátis
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-blue-200/50 to-violet-200/50 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div className="animate-[fadeInUp_0.6s_ease-out_both]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/70 px-3 py-1 text-xs font-semibold text-violet-700">
            <Sparkle className="h-3.5 w-3.5" />
            Assistente de IA para veterinários
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Seu assistente de{" "}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">IA</span> para
            laudos veterinários.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-gray-600">
            Descreva os achados do exame e a IA gera o laudo estruturado em segundos — pronto para revisar, assinar e
            exportar em PDF.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={SIGNUP_URL} className={ctaPrimary}>
              Criar conta grátis
            </a>
            <a href={LOGIN_URL} className={ctaSecondary}>
              Entrar
            </a>
          </div>
          <p className="mt-3 text-sm text-gray-500">7 dias grátis · sem cartão de crédito</p>
        </div>
        <div className="animate-[fadeInUp_0.7s_ease-out_both]">
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
        {/* Input panel */}
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
        {/* Output panel */}
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Laudo estruturado</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white">
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
      <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">{title}</p>
      <div className="mt-1.5 space-y-1.5">
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
      body: "Estrutura tudo em seções padronizadas e lê as medidas das imagens — sem inventar valores.",
    },
    {
      title: "Revise, assine e exporte",
      body: "Edite o que quiser e gere o PDF com o logo da clínica e sua assinatura e CRMV.",
    },
  ];
  return (
    <section id="como-funciona" className="border-y border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">Como funciona</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
          Do achado ao laudo assinado em três passos — a IA faz o trabalho pesado, você mantém o controle.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-gray-200 bg-white p-6">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
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
      body: "A IA lê órgãos e medidas direto das imagens do ultrassom — e nunca inventa valores.",
      d: "m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z",
    },
    {
      title: "Ditado por voz",
      body: "Transcrição em tempo real no navegador — fale os achados sem largar a sonda.",
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
      body: "Cada edição do laudo fica registrada — segurança e rastreabilidade total.",
      d: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    },
  ];
  return (
    <section id="recursos" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">Tudo o que o laudo precisa</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
        Um assistente feito para a rotina da ultrassonografia veterinária.
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${
                f.accent ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"
              }`}
            >
              <FeatureIcon d={f.d} />
            </span>
            <h3 className="mt-4 text-base font-semibold text-gray-900">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { label: "Conforme a LGPD", sub: "Consentimento e exclusão de dados" },
    { label: "Dados no Brasil", sub: "Infraestrutura na região sa-east-1" },
    { label: "Feito para o CRMV", sub: "Assinatura e registro no laudo" },
  ];
  return (
    <section className="border-y border-gray-200 bg-gray-50">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-12 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="text-center">
            <p className="text-sm font-semibold text-gray-900">{it.label}</p>
            <p className="mt-1 text-sm text-gray-500">{it.sub}</p>
          </div>
        ))}
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
    <section id="preco" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">Preço simples</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
        Comece com 7 dias grátis. Sem cartão, sem compromisso.
      </p>
      <div className="mx-auto mt-12 max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight text-gray-900">R$ 99,90</span>
          <span className="text-gray-500">/mês</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">ou R$ 990,90/ano — economize 2 meses</p>
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

function FinalCta() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-violet-600">
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Pronto para laudar mais rápido?</h2>
        <p className="mx-auto mt-3 max-w-xl text-blue-50">
          Deixe a IA escrever o laudo enquanto você cuida do que importa: o paciente.
        </p>
        <a
          href={SIGNUP_URL}
          className={`mt-8 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 ${focusRing}`}
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
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        <span className="text-sm font-bold text-gray-900">Laudai</span>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <a href="/legal/termos-de-uso" className="hover:text-gray-900">
            Termos de uso
          </a>
          <a href="/legal/politica-de-privacidade" className="hover:text-gray-900">
            Privacidade
          </a>
          <a href={LOGIN_URL} className="hover:text-gray-900">
            Entrar
          </a>
          <a href={SIGNUP_URL} className="hover:text-gray-900">
            Criar conta
          </a>
        </nav>
        <span className="text-sm text-gray-400">© 2026 Laudai</span>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <TrustStrip />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
