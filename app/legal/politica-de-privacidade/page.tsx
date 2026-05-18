export const metadata = {
  title: "Política de Privacidade | Laudai",
};

const LAST_UPDATED = "18 de maio de 2026";
const CONTACT_EMAIL = "mateus.guedelho@hellohippo.com";

export default function PrivacyPolicyPage() {
  return (
    <article className="text-gray-800 leading-relaxed space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Política de Privacidade</h1>
        <p className="text-sm text-gray-500 mt-1">Última atualização: {LAST_UPDATED}</p>
      </header>

      <section>
        <p>
          Esta Política de Privacidade descreve como o Laudai (&quot;nós&quot;, &quot;Laudai&quot;) coleta, utiliza,
          armazena e compartilha dados pessoais de seus usuários, em conformidade com a Lei nº 13.709/2018 — Lei Geral
          de Proteção de Dados Pessoais (&quot;LGPD&quot;).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">1. Controlador dos dados</h2>
        <p>
          O Laudai atua como controlador dos dados pessoais dos médicos-veterinários cadastrados. Para questões
          relativas a esta política ou ao exercício de direitos previstos na LGPD, entre em contato por meio do e-mail{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">2. Dados coletados</h2>
        <p>Coletamos e tratamos as seguintes categorias de dados pessoais:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>
            <strong>Dados de cadastro do veterinário:</strong> e-mail, nome completo, CPF, CRMV e estado do CRMV.
          </li>
          <li>
            <strong>Dados profissionais:</strong> logotipo da clínica e imagem de assinatura digital.
          </li>
          <li>
            <strong>Dados clínicos do paciente animal:</strong> nome, espécie, raça, idade, sexo, castração.
          </li>
          <li>
            <strong>Dados do tutor responsável:</strong> nome do tutor, fornecido pelo veterinário.
          </li>
          <li>
            <strong>Dados do exame:</strong> achados de exame, imagens enviadas, laudos gerados e editados, PDFs.
          </li>
          <li>
            <strong>Dados técnicos:</strong> cookies estritamente necessários à sessão de autenticação.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">3. Finalidades e bases legais</h2>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>
            <strong>Execução de contrato</strong> (Art. 7º, V): geração, armazenamento e edição de laudos veterinários,
            autenticação do usuário e funcionamento da plataforma.
          </li>
          <li>
            <strong>Consentimento</strong> (Art. 7º, I): aceite expresso da Política de Privacidade e dos Termos de Uso
            no momento do cadastro.
          </li>
          <li>
            <strong>Cumprimento de obrigação legal ou regulatória</strong> (Art. 7º, II): retenção do CPF e CRMV para
            identificação profissional do emissor do laudo, conforme exigência do Conselho Federal de Medicina
            Veterinária.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">4. Compartilhamento e operadores</h2>
        <p>Para operar a plataforma, compartilhamos dados com os seguintes operadores:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>
            <strong>Supabase</strong> (banco de dados e armazenamento) — região <em>sa-east-1</em> (São Paulo, Brasil).
            Dados de conta, cadastros e arquivos.
          </li>
          <li>
            <strong>Vercel</strong> (hospedagem da aplicação) — para servir as páginas e funções da plataforma.
          </li>
          <li>
            <strong>Google LLC — Gemini API</strong> (geração de texto por inteligência artificial) — recebe os achados
            de exame e os dados do paciente para gerar o texto do laudo.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">5. Transferência internacional</h2>
        <p>
          O serviço Gemini, operado pelo Google LLC, processa dados em servidores localizados fora do território
          nacional, incluindo os Estados Unidos. Essa transferência internacional ocorre com base nas garantias de
          adequação previstas no Art. 33 da LGPD e nas políticas contratuais do operador. Você pode revogar seu
          consentimento a qualquer momento por meio do contato acima, ciente de que isso impede a geração de novos
          laudos.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">6. Retenção</h2>
        <p>
          Os dados pessoais são mantidos enquanto sua conta estiver ativa. Após a solicitação de exclusão da conta, os
          dados são eliminados em até 30 (trinta) dias dos nossos sistemas e dos operadores acima, exceto quando a
          retenção for exigida por obrigação legal ou regulatória.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">7. Seus direitos</h2>
        <p>Você, como titular dos dados pessoais, tem o direito de:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Confirmar a existência de tratamento e acessar seus dados;</li>
          <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
          <li>
            Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com
            a LGPD;
          </li>
          <li>Solicitar a portabilidade de seus dados em formato estruturado (JSON);</li>
          <li>Obter informações sobre as entidades com as quais compartilhamos seus dados;</li>
          <li>Revogar o consentimento a qualquer momento.</li>
        </ul>
        <p className="mt-2">
          O exercício dos direitos pode ser feito diretamente nas configurações da sua conta (exportação e exclusão) ou
          pelo e-mail{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">8. Segurança</h2>
        <p>
          Aplicamos medidas técnicas como criptografia em trânsito (TLS), Row-Level Security (RLS) no banco de dados,
          buckets de armazenamento privados com URLs assinadas de curta duração e proteção contra bots e ataques na
          borda da rede.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">9. Cookies</h2>
        <p>
          Utilizamos apenas cookies estritamente necessários para manter a sessão de autenticação. Não utilizamos
          cookies de marketing, rastreamento ou perfis de terceiros.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">10. Atualizações desta Política</h2>
        <p>
          Esta política pode ser atualizada para refletir alterações na legislação ou no funcionamento da plataforma. Em
          caso de mudanças relevantes, solicitaremos novo consentimento.
        </p>
      </section>
    </article>
  );
}
