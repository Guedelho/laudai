export const metadata = {
  title: "Termos de Uso | Laudai",
};

const LAST_UPDATED = "18 de maio de 2026";
const CONTACT_EMAIL = "mateus.guedelho@hellohippo.com";

export default function TermsOfUsePage() {
  return (
    <article className="text-gray-800 leading-relaxed space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Termos de Uso</h1>
        <p className="text-sm text-gray-500 mt-1">Última atualização: {LAST_UPDATED}</p>
      </header>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">1. Aceitação dos termos</h2>
        <p>
          Ao criar uma conta no Laudai, você declara ser médico(a)-veterinário(a) regularmente inscrito(a) no CRMV e
          concorda em cumprir estes Termos de Uso e a Política de Privacidade.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">2. Serviço</h2>
        <p>
          O Laudai é uma ferramenta de apoio à elaboração de laudos veterinários, utilizando inteligência artificial
          para sugerir o texto a partir dos achados de exame fornecidos pelo usuário.{" "}
          <strong>
            O conteúdo gerado é uma sugestão e sempre exige revisão e validação por um(a) médico(a)-veterinário(a)
            habilitado(a).
          </strong>
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">3. Responsabilidade do usuário</h2>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Manter a confidencialidade das credenciais de acesso à conta;</li>
          <li>Fornecer informações verdadeiras e atualizadas, em especial CPF, CRMV e estado do CRMV;</li>
          <li>Revisar e validar todo laudo gerado antes de assinar ou disponibilizar ao tutor;</li>
          <li>
            Obter, quando aplicável, autorização do tutor responsável para o tratamento dos dados do paciente animal no
            âmbito da relação clínica;
          </li>
          <li>Utilizar a plataforma exclusivamente para fins lícitos e de natureza veterinária.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">4. Conta e cadastro</h2>
        <p>
          A criação da conta exige aceitação expressa destes Termos e da Política de Privacidade. O Laudai pode
          suspender ou encerrar contas em caso de uso indevido, fraude ou violação destes Termos.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">5. Limitação de responsabilidade</h2>
        <p>
          O Laudai não se responsabiliza por diagnósticos, condutas clínicas ou consequências decorrentes do uso
          inadequado dos laudos gerados. A responsabilidade técnica e ético-profissional pela emissão do laudo é
          exclusiva do(a) médico(a)-veterinário(a) usuário(a).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">6. Propriedade intelectual</h2>
        <p>
          O conteúdo dos laudos editados e os arquivos enviados (imagens) permanecem de titularidade do usuário. O
          código, marca, layout e interface do Laudai pertencem à Laudai e não podem ser reproduzidos sem autorização.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">7. Alterações</h2>
        <p>Estes Termos podem ser atualizados. Mudanças relevantes serão comunicadas e exigirão novo aceite.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">8. Foro</h2>
        <p>
          Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias relativas a estes Termos.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">9. Contato</h2>
        <p>
          Em caso de dúvidas, escreva para{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </article>
  );
}
