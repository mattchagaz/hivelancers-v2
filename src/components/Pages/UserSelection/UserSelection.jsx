import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setStoredUserRole } from '../../../utils/userRole';
import styles from './UserSelection.module.css';

function UserSelection() {
  const [selected, setSelected] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) return;
    setIsLeaving(true);

    setStoredUserRole(selected);

    setTimeout(() => {
      navigate('/welcome-user', { state: { role: selected } });
    }, 600);
  };

  const roles = [
    {
      id: 'freelancer',
      title: 'Sou Freelancer',
      subtitle: 'Quero oferecer meus serviços',
      description:
        'Crie seu perfil profissional, publique seus serviços, defina preços e receba pedidos de clientes de todo o Brasil.',
      features: [
        'Crie e gerencie seus serviços',
        'Receba pagamentos com segurança',
        'Construa sua reputação com avaliações',
        'Ganhe recompensas por desempenho',
      ],
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
    },
    {
      id: 'client',
      title: 'Sou Cliente',
      subtitle: 'Quero contratar serviços',
      description:
        'Encontre profissionais qualificados, compare propostas, contrate com segurança e acompanhe a entrega do seu projeto.',
      features: [
        'Busque entre milhares de serviços',
        'Pague somente após a entrega',
        'Converse direto com o freelancer',
        'Avalie e recomende profissionais',
      ],
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`${styles.page} ${isLeaving ? styles.leaving : ''}`}>
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      <div className={styles.bgOrb3} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.badge}>Passo 1 de 1</div>
          <h1 className={styles.title}>Como você quer usar a Hivelancers?</h1>
          <p className={styles.subtitle}>
            Escolha seu perfil principal. Não se preocupe, você poderá alterar isso depois nas configurações.
          </p>
        </div>

        {/* Cards */}
        <div className={styles.cards}>
          {roles.map((role, index) => (
            <div
              key={role.id}
              className={`${styles.card} ${selected === role.id ? styles.cardSelected : ''}`}
              onClick={() => setSelected(role.id)}
              style={{ animationDelay: `${0.15 + index * 0.1}s` }}
            >
              {/* Selection indicator */}
              <div className={styles.radioOuter}>
                <div className={styles.radioInner} />
              </div>

              <div className={styles.cardIcon}>{role.icon}</div>

              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{role.title}</h2>
                <span className={styles.cardSubtitle}>{role.subtitle}</span>
                <p className={styles.cardDescription}>{role.description}</p>

                <div className={styles.featureList}>
                  {role.features.map((feat, i) => (
                    <div key={i} className={styles.featureItem}>
                      <svg
                        className={styles.featureCheck}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={styles.actions}>
          <button
            className={styles.continueBtn}
            disabled={!selected}
            onClick={handleContinue}
          >
            Continuar
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

export default UserSelection;
