export const HELP_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Primeiros passos',
    description: 'Entenda a plataforma, configure sua conta e prepare seu perfil.',
    icon: 'start',
    articles: [
      {
        id: 'how-hivelancers-works',
        title: 'Como a Hivelancers funciona',
        summary: 'Uma visão completa sobre serviços, projetos, pagamentos protegidos e pedidos.',
        audience: 'Todos',
        readTime: '4 min',
        keywords: ['começar', 'plataforma', 'cliente', 'freelancer', 'pedido'],
        sections: [
          {
            title: 'Duas formas de contratar',
            paragraphs: [
              'Na Hivelancers, um cliente pode contratar um serviço já publicado por um freelancer ou publicar um projeto para receber propostas personalizadas.',
              'Nos dois casos, a contratação só começa depois que o pagamento é confirmado. Antes disso existe apenas uma tentativa de checkout, sem pedido, contrato ou conversa de execução.',
            ],
            bullets: [
              'Serviços: escolha um pacote, envie o briefing e finalize o pagamento.',
              'Projetos: publique a necessidade, compare propostas e pague para aceitar a escolhida.',
              'Pedidos: acompanhe prazo, mensagens, entregas, revisões e aprovação em um só lugar.',
            ],
          },
          {
            title: 'O que torna a contratação protegida',
            paragraphs: [
              'O valor pago fica registrado na plataforma. O freelancer executa o trabalho conforme o escopo contratado e o cliente acompanha cada etapa pelo pedido.',
              'Depois da entrega, o cliente pode aprovar, solicitar uma revisão disponível no pacote ou abrir uma disputa quando houver uma divergência relevante.',
            ],
            note: 'Nunca combine pagamentos externos. Fora da plataforma não é possível aplicar a proteção do pedido, registrar entregas ou analisar uma disputa.',
          },
        ],
      },
      {
        id: 'account-profile-setup',
        title: 'Configure sua conta e seu perfil',
        summary: 'Complete os dados essenciais para contratar, publicar e transmitir confiança.',
        audience: 'Todos',
        readTime: '3 min',
        keywords: ['perfil', 'conta', 'cadastro', 'username', 'foto'],
        sections: [
          {
            title: 'Informações básicas',
            steps: [
              'Confirme seu e-mail e conclua o onboarding inicial.',
              'Adicione nome, foto, localização, telefone e um nome de usuário público.',
              'Escreva uma apresentação objetiva sobre sua experiência ou sobre o que sua empresa procura.',
              'Revise suas preferências de privacidade e notificações em Configurações.',
            ],
          },
          {
            title: 'Para freelancers',
            paragraphs: ['Um perfil profissional completo melhora a decisão do cliente antes da contratação. Inclua especialidades, portfólio e informações coerentes com os serviços publicados.'],
            bullets: [
              'Use trabalhos reais e descreva qual foi sua participação.',
              'Mantenha os títulos e descrições dos serviços específicos.',
              'Cadastre sua chave Pix antes de tentar publicar um serviço.',
            ],
          },
        ],
      },
      {
        id: 'identity-verification',
        title: 'Verificação de identidade',
        summary: 'Saiba por que ela existe, quais estados aparecem e como enviar seus dados.',
        audience: 'Todos',
        readTime: '3 min',
        keywords: ['identidade', 'documento', 'verificação', 'segurança'],
        sections: [
          {
            title: 'Por que verificamos contas',
            paragraphs: ['A verificação reduz fraude, melhora a confiança entre usuários e pode ser necessária para liberar determinadas ações da conta. Os documentos são usados somente para análise e obrigações de segurança.'],
          },
          {
            title: 'Estados da análise',
            bullets: [
              'Não iniciada: nenhum envio foi realizado.',
              'Em análise: os dados foram recebidos e aguardam revisão.',
              'Verificada: a identidade foi aprovada.',
              'Recusada: os dados precisam ser corrigidos ou reenviados.',
            ],
            note: 'Envie imagens legíveis, sem cortes ou reflexos, e confira se o nome informado corresponde ao documento.',
          },
        ],
      },
    ],
  },
  {
    id: 'clients',
    title: 'Para clientes',
    description: 'Contrate serviços ou publique projetos com segurança.',
    icon: 'client',
    articles: [
      {
        id: 'hire-a-service',
        title: 'Como contratar um serviço',
        summary: 'Escolha o pacote certo, prepare o briefing e conclua o checkout.',
        audience: 'Clientes',
        readTime: '4 min',
        keywords: ['contratar', 'serviço', 'pacote', 'briefing', 'checkout'],
        sections: [
          {
            title: 'Antes de pagar',
            steps: [
              'Compare o escopo, prazo, número de revisões e preço de cada pacote.',
              'Confira o perfil, portfólio e histórico do profissional.',
              'Preencha um briefing com objetivo, público, referências e formato de entrega.',
              'Revise o valor do serviço, a taxa do cliente e qualquer desconto aplicado.',
            ],
          },
          {
            title: 'Depois do checkout',
            paragraphs: ['O pedido e a conversa são criados somente quando o gateway confirma o pagamento. No cartão, você segue para o Checkout seguro da AbacatePay; no Pix, o QR Code aparece dentro da Hivelancers. Tentativas ainda válidas podem ser retomadas em Financeiro.'],
            note: '“Aguardando pagamento” não significa que existe um pedido. É apenas um checkout aberto e nenhuma cobrança foi confirmada.',
          },
        ],
      },
      {
        id: 'publish-project-and-compare-proposals',
        title: 'Publique um projeto e compare propostas',
        summary: 'Descreva a necessidade, receba propostas e escolha um profissional.',
        audience: 'Clientes',
        readTime: '5 min',
        keywords: ['projeto', 'proposta', 'orçamento', 'freelancer'],
        sections: [
          {
            title: 'Criando um bom projeto',
            bullets: [
              'Use um título direto e explique o resultado esperado.',
              'Informe escopo, referências, prazo desejado e restrições importantes.',
              'Escolha categoria e habilidades que ajudem profissionais adequados a encontrar o projeto.',
              'Evite publicar dados pessoais ou meios de contato externos.',
            ],
          },
          {
            title: 'Escolhendo uma proposta',
            paragraphs: ['Analise a mensagem do profissional, valor, prazo, revisões, perfil e portfólio. Ao clicar para contratar, você revisará toda a proposta antes de pagar.'],
            note: 'A proposta só é aceita e a conversa de trabalho só é aberta após a confirmação do pagamento protegido.',
          },
        ],
      },
      {
        id: 'review-delivery',
        title: 'Aprovação, revisão e conclusão',
        summary: 'O que fazer quando o freelancer envia uma entrega.',
        audience: 'Clientes',
        readTime: '4 min',
        keywords: ['aprovar', 'entrega', 'revisão', 'concluir', 'pedido'],
        sections: [
          {
            title: 'Ao receber a entrega',
            steps: [
              'Abra o pedido e confira os arquivos, links e observações enviados.',
              'Compare o material ao briefing e ao escopo contratado.',
              'Aprove se estiver correto ou solicite uma revisão descrevendo ajustes objetivos.',
              'Use a disputa somente quando a situação não puder ser resolvida pelo fluxo normal.',
            ],
          },
          {
            title: 'Liberação do pagamento',
            paragraphs: ['A aprovação conclui o pedido e libera o repasse previsto ao freelancer. Depois disso, mantenha sua avaliação honesta e relacionada à experiência real da contratação.'],
          },
        ],
      },
    ],
  },
  {
    id: 'freelancers',
    title: 'Para freelancers',
    description: 'Publique, envie propostas, entregue trabalhos e receba repasses.',
    icon: 'freelancer',
    articles: [
      {
        id: 'publish-service',
        title: 'Como publicar um serviço',
        summary: 'Prepare uma oferta clara e deixe seus recebimentos prontos.',
        audience: 'Freelancers',
        readTime: '5 min',
        keywords: ['publicar', 'serviço', 'pix', 'pacote', 'freelancer'],
        sections: [
          {
            title: 'Requisitos para publicar',
            paragraphs: ['Antes da publicação, você precisa ter uma chave Pix ativa cadastrada para repasses. Isso evita que clientes encontrem um serviço que ainda não pode ser contratado.'],
            steps: [
              'Abra Financeiro ou Configurações → Faturamento.',
              'Informe sua chave Pix (CPF, e-mail, telefone ou aleatória).',
              'Volte à Hivelancers e use “Já cadastrei, verificar novamente”.',
              'Quando o status estiver pronto, finalize e publique o serviço.',
            ],
          },
          {
            title: 'Monte pacotes fáceis de comparar',
            bullets: [
              'Defina exatamente o que está incluído em cada pacote.',
              'Use prazos realistas e um número claro de revisões.',
              'Explique o que o cliente precisa enviar no briefing.',
              'Evite promessas genéricas ou entregáveis ambíguos.',
            ],
          },
        ],
      },
      {
        id: 'send-project-proposal',
        title: 'Como enviar uma boa proposta',
        summary: 'Apresente abordagem, prazo e valor para projetos de clientes.',
        audience: 'Freelancers',
        readTime: '4 min',
        keywords: ['proposta', 'projeto', 'prazo', 'preço', 'portfolio'],
        sections: [
          {
            title: 'O que incluir',
            bullets: [
              'Mostre que entendeu o objetivo do projeto.',
              'Explique sua abordagem e os principais entregáveis.',
              'Informe um prazo que inclua execução e revisões.',
              'Use um preço coerente com o escopo e destaque experiências relevantes.',
            ],
          },
          {
            title: 'Quando a proposta é aceita',
            paragraphs: ['A proposta fica reservada durante o checkout do cliente. Ela só muda para aceita quando o pagamento é confirmado e o pedido protegido é criado.'],
          },
        ],
      },
      {
        id: 'deliver-and-get-paid',
        title: 'Entregas, revisões e recebimentos',
        summary: 'Acompanhe o pedido até a liberação do repasse.',
        audience: 'Freelancers',
        readTime: '5 min',
        keywords: ['entregar', 'revisão', 'receber', 'repasse', 'stripe'],
        sections: [
          {
            title: 'Executando o pedido',
            steps: [
              'Confirme o briefing e esclareça dúvidas na conversa do pedido.',
              'Registre atualizações importantes sem retirar a negociação da plataforma.',
              'Envie a entrega com uma descrição clara e todos os arquivos ou links necessários.',
              'Se houver revisão, responda dentro do escopo e do limite contratado.',
            ],
          },
          {
            title: 'Recebendo o valor',
            paragraphs: ['O valor líquido considera a taxa aplicável ao freelancer. Após a aprovação, pagamentos no cartão ou no Pix são repassados pela AbacatePay à sua chave Pix cadastrada e protegida por criptografia.'],
            note: 'A Central financeira separa valores protegidos, repasses concluídos e eventuais pendências da conta recebedora.',
          },
        ],
      },
    ],
  },
  {
    id: 'payments',
    title: 'Pagamentos e taxas',
    description: 'Checkout, cupons, proteção do valor, reembolsos e repasses.',
    icon: 'payments',
    articles: [
      {
        id: 'payment-statuses',
        title: 'Entenda os status de pagamento',
        summary: 'Veja o significado de cada estado exibido no financeiro.',
        audience: 'Todos',
        readTime: '4 min',
        keywords: ['checkout_created', 'pendente', 'pago', 'expirado', 'cancelado'],
        sections: [
          {
            title: 'Antes da confirmação',
            bullets: [
              'Aguardando pagamento: a sessão foi criada, mas ainda não houve confirmação.',
              'Em processamento: a cobrança foi enviada e aguarda retorno definitivo do gateway.',
              'Cancelado: o usuário encerrou a tentativa antes do pagamento.',
              'Expirado: o prazo do link terminou sem confirmação.',
              'Falhou: o gateway ou a plataforma não conseguiu concluir a tentativa.',
            ],
          },
          {
            title: 'Depois da confirmação',
            bullets: [
              'Pago: a cobrança foi confirmada e o pedido foi criado.',
              'Retido: o valor do freelancer está protegido até a conclusão prevista.',
              'Transferido: o repasse foi enviado à conta conectada.',
              'Reembolsado: a devolução ao cliente foi registrada.',
            ],
            note: 'Uma tentativa não paga nunca deve aparecer como pedido confirmado ou receita processada.',
          },
        ],
      },
      {
        id: 'fees-coupons-plans',
        title: 'Taxas, cupons e planos',
        summary: 'Como o total é formado e quando benefícios reduzem custos.',
        audience: 'Todos',
        readTime: '4 min',
        keywords: ['taxa', 'cupom', 'desconto', 'plano', 'assinatura'],
        sections: [
          {
            title: 'Composição do checkout',
            paragraphs: ['Antes do pagamento, o resumo mostra o valor contratado, descontos válidos, taxa de serviço do cliente e total final. O freelancer visualiza sua própria taxa e o líquido estimado na área financeira.'],
          },
          {
            title: 'Cupons e assinaturas',
            bullets: [
              'O cupom precisa estar ativo, dentro da validade e respeitar o pedido mínimo.',
              'Limites de uso e desconto máximo podem reduzir ou impedir o benefício.',
              'Planos pagos podem reduzir taxas conforme as regras exibidas na assinatura.',
              'O desconto aplicado sempre aparece antes de gerar o Pix ou redirecionar para a AbacatePay.',
            ],
          },
        ],
      },
      {
        id: 'refunds-and-disputes',
        title: 'Reembolsos e disputas',
        summary: 'Quando solicitar análise e quais informações ajudam na decisão.',
        audience: 'Todos',
        readTime: '5 min',
        keywords: ['reembolso', 'disputa', 'cancelamento', 'problema', 'entrega'],
        sections: [
          {
            title: 'Antes de abrir uma disputa',
            paragraphs: ['Tente resolver a divergência pela conversa do pedido. Explique o ponto do escopo que não foi atendido e mantenha os arquivos e decisões registrados na plataforma.'],
          },
          {
            title: 'O que a equipe analisa',
            bullets: [
              'Briefing e escopo originalmente contratados.',
              'Mensagens, prazos, entregas e solicitações de revisão.',
              'Evidências anexadas por cliente e freelancer.',
              'Status financeiro e ações já realizadas no pedido.',
            ],
            note: 'A abertura de disputa não garante reembolso automático. A decisão depende do histórico e das evidências do caso.',
          },
        ],
      },
    ],
  },
  {
    id: 'orders-communication',
    title: 'Pedidos e comunicação',
    description: 'Mensagens, prazos, revisões, entregas e resolução de problemas.',
    icon: 'orders',
    articles: [
      {
        id: 'order-lifecycle',
        title: 'Ciclo completo de um pedido',
        summary: 'Do pagamento confirmado até a conclusão e avaliação.',
        audience: 'Todos',
        readTime: '4 min',
        keywords: ['pedido', 'status', 'prazo', 'entrega', 'conclusão'],
        sections: [
          {
            title: 'Etapas principais',
            steps: [
              'Pagamento confirmado e pedido protegido criado.',
              'Freelancer inicia a execução com base no briefing.',
              'Entrega é enviada e fica disponível para análise.',
              'Cliente aprova ou solicita uma revisão disponível.',
              'Pedido é concluído, repasse liberado e avaliação habilitada.',
            ],
          },
          {
            title: 'Histórico confiável',
            paragraphs: ['Mudanças relevantes ficam registradas na linha do tempo do pedido. Use sempre a conversa associada para decisões de escopo, prazo e entrega.'],
          },
        ],
      },
      {
        id: 'safe-messaging',
        title: 'Boas práticas nas mensagens',
        summary: 'Comunique decisões com clareza e mantenha a negociação protegida.',
        audience: 'Todos',
        readTime: '3 min',
        keywords: ['mensagens', 'conversa', 'segurança', 'contato'],
        sections: [
          {
            title: 'Comunicação objetiva',
            bullets: [
              'Concentre cada conversa no projeto ou pedido relacionado.',
              'Registre alterações de prazo ou escopo antes de executá-las.',
              'Não compartilhe senhas, códigos de acesso ou dados financeiros.',
              'Denuncie mensagens suspeitas e evite pagamentos externos.',
            ],
          },
          {
            title: 'Arquivos e referências',
            paragraphs: ['Descreva o conteúdo enviado, verifique permissões de links e remova informações pessoais desnecessárias. Em uma disputa, registros claros ajudam a equipe a entender o caso.'],
          },
        ],
      },
    ],
  },
  {
    id: 'account-security',
    title: 'Conta e segurança',
    description: 'Acesso, privacidade, notificações e exclusão da conta.',
    icon: 'security',
    articles: [
      {
        id: 'access-and-security',
        title: 'Acesso e segurança da conta',
        summary: 'Proteja suas credenciais e recupere o acesso quando necessário.',
        audience: 'Todos',
        readTime: '3 min',
        keywords: ['senha', 'login', 'segurança', 'recuperar', 'email'],
        sections: [
          {
            title: 'Se você não consegue entrar',
            steps: [
              'Use “Esqueci minha senha” na tela de login.',
              'Informe o e-mail cadastrado e confira também a caixa de spam.',
              'Crie uma senha exclusiva e não reutilize credenciais de outros sites.',
              'Se o e-mail não chegar ou houver acesso suspeito, abra um chamado.',
            ],
          },
          {
            title: 'Cuidados importantes',
            bullets: [
              'A equipe nunca solicitará sua senha por mensagem.',
              'Confira o domínio antes de informar dados de acesso.',
              'Encerre sessões em dispositivos compartilhados.',
              'Mantenha e-mail e telefone atualizados.',
            ],
          },
        ],
      },
      {
        id: 'delete-account',
        title: 'Como funciona a exclusão da conta',
        summary: 'Entenda cancelamentos, anonimização e registros que precisam permanecer.',
        audience: 'Todos',
        readTime: '4 min',
        keywords: ['excluir', 'deletar', 'conta', 'anonimização', 'lgpd'],
        sections: [
          {
            title: 'O que acontece ao excluir',
            paragraphs: ['O acesso é encerrado imediatamente. Projetos em rascunho ou abertos são cancelados e deixam de aparecer nas listagens públicas. Dados pessoais que não precisam permanecer são removidos ou anonimizados.'],
          },
          {
            title: 'O que pode permanecer',
            paragraphs: ['Pedidos concluídos e registros financeiros, contratuais, antifraude ou de auditoria podem ser preservados de forma anonimizada pelo período necessário para obrigações legais e segurança da plataforma.'],
            note: 'A exclusão é definitiva e exige confirmação adicional antes de ser executada.',
          },
        ],
      },
    ],
  },
];

export const HELP_ARTICLES = HELP_CATEGORIES.flatMap((category) => (
  category.articles.map((article) => ({ ...article, categoryId: category.id, categoryTitle: category.title }))
));

export const DEFAULT_HELP_ARTICLE_ID = 'how-hivelancers-works';

export const findHelpArticles = (query) => {
  const normalized = query.trim().toLocaleLowerCase('pt-BR');
  if (!normalized) return [];

  return HELP_ARTICLES.filter((article) => {
    const searchable = [
      article.title,
      article.summary,
      article.categoryTitle,
      ...article.keywords,
      ...article.sections.flatMap((section) => [
        section.title,
        ...(section.paragraphs || []),
        ...(section.bullets || []),
        ...(section.steps || []),
        section.note || '',
      ]),
    ].join(' ').toLocaleLowerCase('pt-BR');

    return searchable.includes(normalized);
  });
};
