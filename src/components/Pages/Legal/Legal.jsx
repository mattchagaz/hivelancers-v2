import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCookieBite,
  FaFileContract,
  FaScaleBalanced,
  FaShieldHalved,
  FaTriangleExclamation,
  FaUserLock,
} from 'react-icons/fa6';
import { useAuth } from '../../../contexts/authContextStore';
import styles from './Legal.module.css';

const UPDATED_AT = '24 de julho de 2026';

const DOCUMENTS = {
  terms: {
    title: 'Termos de Uso',
    shortTitle: 'Termos',
    description: 'Regras para contas, serviços, pedidos, pagamentos, cancelamentos e disputas.',
    icon: FaFileContract,
    sections: [
      {
        title: '1. Sobre a plataforma',
        paragraphs: [
          'A Hivelancers é uma plataforma digital que aproxima clientes e freelancers para publicação, contratação e acompanhamento de serviços. A plataforma oferece recursos de comunicação, pagamento, entrega, avaliação, cancelamento e mediação de disputas.',
          'Cliente e freelancer são responsáveis pelas informações que fornecem, pelo escopo acordado e pelo cumprimento das obrigações assumidas em cada pedido. A Hivelancers atua na infraestrutura e na mediação prevista nestes Termos, sem se tornar executora do serviço contratado.',
        ],
      },
      {
        title: '2. Cadastro e segurança da conta',
        paragraphs: [
          'O usuário deve fornecer dados verdadeiros, manter suas credenciais protegidas e comunicar imediatamente qualquer uso não autorizado. Contas podem exigir confirmação de e-mail e verificação de identidade para acesso a pagamentos, recebimentos ou recursos sensíveis.',
          'O uso da plataforma é destinado a pessoas com capacidade legal para contratar. Contas não podem ser cedidas, comercializadas ou usadas para representar terceiros sem autorização.',
        ],
      },
      {
        title: '3. Serviços e pedidos',
        paragraphs: [
          'Freelancers devem descrever com clareza o serviço, preço, prazo, entregáveis e limites de revisão. Clientes devem fornecer briefing e materiais necessários. O conteúdo combinado no pedido e na conversa vinculada poderá ser considerado na análise de uma disputa.',
          'Conteúdo ilegal, fraudulento, discriminatório, abusivo, que viole direitos de terceiros ou tente retirar indevidamente uma transação da plataforma pode ser removido e resultar em restrição da conta.',
        ],
      },
      {
        title: '4. Pagamentos, taxas e repasses',
        paragraphs: [
          'Valores, taxas e condições aplicáveis devem ser exibidos antes da confirmação da contratação. Pagamentos podem ser processados por prestadores especializados e ficar retidos até a conclusão, cancelamento ou decisão de disputa.',
          'Prazos bancários, verificações do provedor de pagamento e obrigações fiscais do usuário podem afetar cobranças, reembolsos e repasses. O freelancer é responsável por suas obrigações tributárias e cadastrais.',
        ],
      },
      {
        title: '5. Cancelamentos, entregas e disputas',
        paragraphs: [
          'Antes do início, o cliente pode solicitar o cancelamento conforme o estado do pedido. Após o início, situações de descumprimento devem seguir o fluxo de disputa. A abertura de disputa pausa o fluxo financeiro até análise administrativa.',
          'Na mediação, a equipe poderá considerar escopo, mensagens, arquivos, prazos, tentativas de solução e demais evidências relacionadas. A decisão operacional poderá resultar em reembolso ao cliente ou liberação ao freelancer, sem impedir direitos assegurados pela legislação aplicável.',
        ],
      },
      {
        title: '6. Propriedade intelectual',
        paragraphs: [
          'Cada usuário permanece responsável pelos direitos sobre conteúdos enviados. A transferência ou licença dos entregáveis deve respeitar o que foi combinado no pedido e somente ocorre após as condições de pagamento aplicáveis.',
          'O usuário concede à Hivelancers autorização limitada para armazenar, processar e exibir conteúdos na medida necessária para operar, proteger e prestar o serviço.',
        ],
      },
      {
        title: '7. Suspensão, encerramento e alterações',
        paragraphs: [
          'A Hivelancers poderá limitar ou suspender contas por fraude, risco de segurança, violação destes Termos, ordem legal ou necessidade de proteção da comunidade. Sempre que possível, o usuário será informado e poderá procurar o suporte.',
          'Estes Termos podem ser atualizados para refletir mudanças legais ou operacionais. Alterações relevantes devem ser comunicadas antes de produzirem efeitos, quando exigido.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Aviso de Privacidade',
    shortTitle: 'Privacidade',
    description: 'Como a Hivelancers coleta, usa, compartilha, protege e elimina dados pessoais.',
    icon: FaShieldHalved,
    sections: [
      {
        title: '1. Controlador e contato',
        paragraphs: [
          'A pessoa jurídica responsável pela operação da Hivelancers será a controladora dos dados pessoais tratados para funcionamento da plataforma. A razão social, CNPJ, endereço e o canal público do encarregado ou responsável por privacidade devem ser inseridos aqui antes do lançamento comercial.',
          'Enquanto a plataforma estiver em validação, solicitações autenticadas podem ser iniciadas pela área de Configurações ou pelo Suporte. Um canal público de privacidade ainda deve ser definido para atender pessoas sem acesso à conta.',
        ],
        warning: true,
      },
      {
        title: '2. Dados tratados',
        items: [
          'Cadastro e contato: nome, e-mail, telefone, credenciais protegidas e tipo de conta.',
          'Perfil profissional: foto, username, biografia, localização, links, habilidades, portfólio e serviços.',
          'Identidade e conformidade: CPF, dados cadastrais, endereço e documentos enviados para verificação.',
          'Operação: pedidos, escopos, entregas, avaliações, disputas, tickets e mensagens.',
          'Pagamentos: identificadores, valores, situação da cobrança, reembolso e repasse. Dados completos de cartão são tratados pelo provedor de pagamento.',
          'Dados técnicos e segurança: endereço IP, navegador, registros de acesso, auditoria administrativa e eventos de prevenção a fraude.',
        ],
      },
      {
        title: '3. Finalidades e bases legais',
        items: [
          'Executar o contrato e fornecer cadastro, marketplace, chat, pedidos, entregas e pagamentos.',
          'Cumprir obrigações legais e regulatórias, inclusive fiscais, contábeis, de prevenção a fraude e atendimento a autoridades.',
          'Exercer direitos em processos, disputas e investigações de segurança.',
          'Atender interesses legítimos de segurança, melhoria e proteção da plataforma, com avaliação de necessidade e impacto.',
          'Usar consentimento quando ele for a base adequada, como comunicações promocionais ou tecnologias opcionais.',
        ],
      },
      {
        title: '4. Compartilhamento e transferências',
        paragraphs: [
          'Dados são compartilhados somente quando necessário com o outro participante de uma contratação, administradores autorizados, prestadores de infraestrutura, armazenamento, comunicação, prevenção a fraude e pagamentos, além de autoridades quando houver obrigação válida.',
          'A operação atual utiliza ou prevê o uso de fornecedores como Fly.io para aplicação, Cloudinary para mídia privada, Stripe e AbacatePay para pagamentos e Brevo para e-mails. Alguns fornecedores podem tratar dados fora do Brasil, com salvaguardas contratuais e medidas compatíveis com a LGPD.',
        ],
      },
      {
        title: '5. Retenção e eliminação',
        paragraphs: [
          'Os dados são mantidos pelo tempo necessário para as finalidades informadas. Após o encerramento da conta, dados pessoais devem ser eliminados ou anonimizados, salvo quando a conservação for necessária para obrigação legal, prevenção a fraude, exercício de direitos ou registros financeiros e contratuais.',
          'A plataforma oferece exportação e solicitação de exclusão em Configurações. Pedidos ativos, valores retidos ou obrigações pendentes precisam ser resolvidos antes do encerramento.',
        ],
      },
      {
        title: '6. Segurança e incidentes',
        paragraphs: [
          'São aplicados controles de acesso, documentos privados, autenticação, limitação de requisições, registros de auditoria e separação de permissões. Nenhuma medida elimina integralmente riscos, por isso eventos suspeitos devem ser comunicados ao suporte.',
          'Incidentes relevantes serão avaliados e comunicados aos titulares e à ANPD quando exigido pela regulamentação aplicável.',
        ],
      },
      {
        title: '7. Direitos do titular',
        items: [
          'Confirmar o tratamento e acessar seus dados.',
          'Corrigir dados incompletos, inexatos ou desatualizados.',
          'Solicitar anonimização, bloqueio, portabilidade ou eliminação quando aplicável.',
          'Obter informações sobre compartilhamentos.',
          'Revogar consentimento e se opor a tratamentos quando cabível.',
          'Solicitar revisão e explicação de decisões exclusivamente automatizadas que afetem seus interesses.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookies e Armazenamento Local',
    shortTitle: 'Cookies',
    description: 'Tecnologias usadas no navegador para sessão, preferências e funcionamento da plataforma.',
    icon: FaCookieBite,
    sections: [
      {
        title: '1. Tecnologias essenciais',
        paragraphs: [
          'A Hivelancers utiliza cookie HttpOnly de atualização de sessão, armazenamento local para o token de acesso e informações necessárias para manter o login. Essas tecnologias são essenciais para autenticação e segurança.',
          'Também são guardadas localmente preferências de tema, idioma, notificações, papel da conta, itens recentes e cache de localidades. O histórico oficial das notificações permanece no servidor; cópias locais podem ser usadas para melhorar a experiência.',
        ],
      },
      {
        title: '2. Tecnologias opcionais',
        paragraphs: [
          'A versão atual não ativa cookies publicitários nem ferramentas externas de análise comportamental. Caso tecnologias opcionais sejam adicionadas, elas deverão permanecer desabilitadas até uma escolha válida do usuário e poderão ser alteradas posteriormente.',
        ],
      },
      {
        title: '3. Como controlar',
        paragraphs: [
          'O usuário pode limpar dados locais e bloquear cookies nas configurações do navegador. O bloqueio de tecnologias essenciais pode impedir login, segurança da sessão e outras funcionalidades da plataforma.',
        ],
      },
    ],
  },
  rights: {
    title: 'Seus Direitos na LGPD',
    shortTitle: 'Direitos LGPD',
    description: 'Caminhos práticos para acessar, corrigir, exportar ou excluir seus dados.',
    icon: FaUserLock,
    sections: [
      {
        title: 'O que você pode solicitar',
        items: [
          'Confirmação e acesso aos dados tratados.',
          'Correção de informações incompletas ou incorretas.',
          'Informações sobre finalidades e compartilhamentos.',
          'Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados irregularmente.',
          'Portabilidade, revogação de consentimento e oposição quando aplicáveis.',
          'Revisão de decisões exclusivamente automatizadas.',
        ],
      },
      {
        title: 'Como exercer seus direitos',
        paragraphs: [
          'Para corrigir dados, use Configurações. Para obter uma cópia estruturada, use “Baixar meus dados”. Para encerrar e anonimizar a conta, use “Excluir conta definitivamente”.',
          'Pedidos que não possam ser concluídos automaticamente devem ser enviados ao Suporte com a categoria Segurança ou Conta. A Hivelancers poderá confirmar a identidade do solicitante para evitar acesso ou exclusão indevidos.',
        ],
      },
      {
        title: 'Limites e resposta',
        paragraphs: [
          'Alguns dados podem ser preservados quando houver obrigação legal, necessidade de prevenção a fraude, exercício regular de direitos ou contratos ainda em andamento. Se um pedido não puder ser atendido integralmente, o motivo deverá ser informado.',
          'O exercício dos direitos é gratuito. Após tentar o canal da Hivelancers, o titular também pode procurar a Autoridade Nacional de Proteção de Dados ou órgãos de defesa do consumidor quando aplicável.',
        ],
      },
    ],
  },
};

const PATH_TO_DOCUMENT = {
  '/terms': 'terms',
  '/privacy': 'privacy',
  '/cookies': 'cookies',
  '/lgpd': 'rights',
};

function Legal() {
  const location = useLocation();
  const { user } = useAuth();
  const activeKey = PATH_TO_DOCUMENT[location.pathname] || 'privacy';
  const document = DOCUMENTS[activeKey];
  const ActiveIcon = document.icon;
  const backTo = user ? '/settings?tab=privacy' : '/login';

  const sourceLinks = useMemo(() => [
    {
      label: 'Direitos dos titulares — ANPD',
      href: 'https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares',
    },
    {
      label: 'Aviso de Privacidade — ANPD',
      href: 'https://www.gov.br/anpd/pt-br/acesso-a-informacao/aviso-de-privacidade',
    },
  ], []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to={backTo} className={styles.backLink}>
          <FaArrowLeft /> Voltar
        </Link>
        <Link to="/legal" className={styles.brand}>
          <span>H</span>
          <strong>Hivelancers</strong>
        </Link>
        <span className={styles.version}>Atualizado em {UPDATED_AT}</span>
      </header>

      <main className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>
            <FaScaleBalanced />
            <div>
              <strong>Central Legal</strong>
              <span>Transparência e privacidade</span>
            </div>
          </div>

          <nav aria-label="Documentos jurídicos">
            {Object.entries(DOCUMENTS).map(([key, item]) => {
              const Icon = item.icon;
              const path = key === 'terms' ? '/terms' : key === 'privacy' ? '/privacy' : key === 'cookies' ? '/cookies' : '/lgpd';
              return (
                <Link key={key} to={path} className={key === activeKey ? styles.activeNav : ''}>
                  <Icon />
                  <span>{item.shortTitle}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <article className={styles.document}>
          <section className={styles.hero}>
            <span className={styles.heroIcon}><ActiveIcon /></span>
            <div>
              <span className={styles.eyebrow}>Documento público</span>
              <h1>{document.title}</h1>
              <p>{document.description}</p>
            </div>
          </section>

          <div className={styles.sections}>
            {document.sections.map((section) => (
              <section key={section.title} className={section.warning ? styles.warningSection : ''}>
                <h2>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items && (
                  <ul>
                    {section.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <footer className={styles.documentFooter}>
            <div>
              <strong>Precisa exercer um direito?</strong>
              <p>Use as ferramentas da conta ou abra uma solicitação autenticada no suporte.</p>
            </div>
            <div className={styles.footerActions}>
              <Link to={user ? '/settings?tab=danger' : '/login'}>Dados da conta</Link>
              <Link to={user ? '/support/ticket' : '/login'}>Abrir solicitação</Link>
            </div>
            <div className={styles.sources}>
              {sourceLinks.map((source) => (
                <a key={source.href} href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
              ))}
            </div>
          </footer>
        </article>
      </main>
    </div>
  );
}

export default Legal;
