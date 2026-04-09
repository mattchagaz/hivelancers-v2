import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './WelcomeUser.module.css';

function WelcomeUser() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || 'freelancer';

  const isFreelancer = role === 'freelancer';

  const steps = isFreelancer
    ? [
        {
          tag: 'Bem-vindo',
          title: 'Você está pronto para começar!',
          description:
            'A Hivelancers é a plataforma onde freelancers como você podem transformar suas habilidades em renda. Vamos te mostrar como tudo funciona.',
          visual: 'welcome',
        },
        {
          tag: 'Passo 1',
          title: 'Crie seus serviços',
          description:
            'Monte seu portfólio com os serviços que você oferece. Defina descrições, prazos e até 3 planos de preço diferentes — básico, padrão e premium.',
          visual: 'services',
          tips: [
            'Use imagens de alta qualidade no portfólio',
            'Descreva claramente o que está incluído',
            'Preços competitivos atraem os primeiros clientes',
          ],
        },
        {
          tag: 'Passo 2',
          title: 'Receba pedidos e entregue',
          description:
            'Quando um cliente contratar seu serviço, você receberá uma notificação. Converse pelo chat integrado, alinhe expectativas e entregue um trabalho incrível.',
          visual: 'orders',
          tips: [
            'Responda rápido — clientes valorizam agilidade',
            'Use o chat para esclarecer dúvidas antes de começar',
            'Entregue antes do prazo quando possível',
          ],
        },
        {
          tag: 'Passo 3',
          title: 'Ganhe, cresça e seja recompensado',
          description:
            'Receba pagamentos com segurança após a aprovação do cliente. Acumule avaliações positivas, suba de nível e desbloqueie recompensas exclusivas na plataforma.',
          visual: 'rewards',
          tips: [
            'Boas avaliações te colocam em destaque',
            'Complete missões para ganhar XP extra',
            'Indique amigos e ganhe bônus',
          ],
        },
      ]
    : [
        {
          tag: 'Bem-vindo',
          title: 'Encontre o profissional ideal!',
          description:
            'A Hivelancers conecta você aos melhores freelancers do Brasil. Vamos te mostrar como encontrar, contratar e gerenciar seus projetos.',
          visual: 'welcome',
        },
        {
          tag: 'Passo 1',
          title: 'Busque e descubra serviços',
          description:
            'Navegue por categorias ou use a busca para encontrar exatamente o que precisa. Filtre por preço, avaliação, prazo de entrega e mais.',
          visual: 'services',
          tips: [
            'Use filtros para refinar sua busca',
            'Compare planos de preço de cada serviço',
            'Confira avaliações de outros clientes',
          ],
        },
        {
          tag: 'Passo 2',
          title: 'Contrate com segurança',
          description:
            'Escolheu o profissional? Faça o pedido e o pagamento fica retido em escrow até você aprovar a entrega. Sem surpresas, sem riscos.',
          visual: 'orders',
          tips: [
            'Converse com o freelancer antes de contratar',
            'Detalhe bem o que você espera no pedido',
            'O pagamento só é liberado com sua aprovação',
          ],
        },
        {
          tag: 'Passo 3',
          title: 'Avalie e recomende',
          description:
            'Após receber seu projeto, avalie o freelancer. Sua opinião ajuda outros clientes e recompensa os melhores profissionais da plataforma.',
          visual: 'rewards',
          tips: [
            'Avaliações honestas melhoram a plataforma',
            'Indique freelancers para seus colegas',
            'Acumule pontos como cliente recorrente',
          ],
        },
      ];

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  const handleNext = () => {
    if (isLast) {
      setIsLeaving(true);
      setTimeout(() => {
        // TODO: marcar onboarding como completo no backend
        navigate('/dashboard');
      }, 500);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setCurrentStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    setIsLeaving(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
  };

  /* Ícones visuais por step */
  const visuals = {
    welcome: (
      <div className={styles.visualWelcome}>
        <div className={styles.welcomeEmoji}>
          {isFreelancer ? (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
        </div>
        <div className={styles.welcomeRing1} />
        <div className={styles.welcomeRing2} />
        <div className={styles.welcomeRing3} />
      </div>
    ),
    services: (
      <div className={styles.visualCards}>
        <div className={`${styles.miniCard} ${styles.miniCard1}`}>
          <div className={styles.miniCardImg} />
          <div className={styles.miniCardLines}>
            <div className={styles.miniLine} style={{ width: '70%' }} />
            <div className={styles.miniLine} style={{ width: '45%' }} />
          </div>
          <div className={styles.miniCardPrice}>R$ 150</div>
        </div>
        <div className={`${styles.miniCard} ${styles.miniCard2}`}>
          <div className={styles.miniCardImg} />
          <div className={styles.miniCardLines}>
            <div className={styles.miniLine} style={{ width: '60%' }} />
            <div className={styles.miniLine} style={{ width: '80%' }} />
          </div>
          <div className={styles.miniCardPrice}>R$ 280</div>
        </div>
        <div className={`${styles.miniCard} ${styles.miniCard3}`}>
          <div className={styles.miniCardImg} />
          <div className={styles.miniCardLines}>
            <div className={styles.miniLine} style={{ width: '55%' }} />
            <div className={styles.miniLine} style={{ width: '40%' }} />
          </div>
          <div className={styles.miniCardPrice}>R$ 99</div>
        </div>
      </div>
    ),
    orders: (
      <div className={styles.visualChat}>
        <div className={`${styles.chatBubble} ${styles.chatLeft}`}>
          <div className={styles.chatAvatar}>C</div>
          <div className={styles.chatMsg}>
            <div className={styles.miniLine} style={{ width: '90%' }} />
            <div className={styles.miniLine} style={{ width: '60%' }} />
          </div>
        </div>
        <div className={`${styles.chatBubble} ${styles.chatRight}`}>
          <div className={styles.chatMsg}>
            <div className={styles.miniLine} style={{ width: '75%' }} />
            <div className={styles.miniLine} style={{ width: '50%' }} />
          </div>
          <div className={styles.chatAvatar} style={{ background: 'var(--primary-color)', color: '#fff' }}>F</div>
        </div>
        <div className={`${styles.chatBubble} ${styles.chatLeft}`}>
          <div className={styles.chatAvatar}>C</div>
          <div className={styles.chatMsg}>
            <div className={styles.miniLine} style={{ width: '70%' }} />
          </div>
        </div>
      </div>
    ),
    rewards: (
      <div className={styles.visualRewards}>
        <div className={styles.rewardBadge}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </svg>
          <span className={styles.badgeLabel}>Nível 1</span>
        </div>
        <div className={styles.xpBar}>
          <div className={styles.xpFill} />
          <span className={styles.xpText}>0 / 100 XP</span>
        </div>
        <div className={styles.rewardStars}>
          {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill={i <= 3 ? '#f59e0b' : '#e2e2ea'} stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div className={`${styles.page} ${isLeaving ? styles.leaving : ''}`}>
      <div className={styles.bgGradient} />

      {/* Skip button */}
      <button className={styles.skipBtn} onClick={handleSkip}>
        Pular introdução
      </button>

      <div className={styles.container}>
        {/* Progress bar */}
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step dots */}
        <div className={styles.dots}>
          {steps.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === currentStep ? styles.dotActive : ''} ${i < currentStep ? styles.dotDone : ''}`}
              onClick={() => setCurrentStep(i)}
            />
          ))}
        </div>

        {/* Main content */}
        <div className={styles.content} key={currentStep}>
          {/* Visual */}
          <div className={styles.visualArea}>
            {visuals[step.visual]}
          </div>

          {/* Text */}
          <div className={styles.textArea}>
            <span className={styles.tag}>{step.tag}</span>
            <h1 className={styles.title}>{step.title}</h1>
            <p className={styles.description}>{step.description}</p>

            {step.tips && (
              <div className={styles.tipsBox}>
                {step.tips.map((tip, i) => (
                  <div key={i} className={styles.tipItem}>
                    <div className={styles.tipBullet}>{i + 1}</div>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className={styles.nav}>
          <button
            className={styles.backBtn}
            onClick={handleBack}
            disabled={isFirst}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Voltar
          </button>

          <button className={styles.nextBtn} onClick={handleNext}>
            {isLast ? 'Começar a usar' : 'Próximo'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
);
}

export default WelcomeUser;