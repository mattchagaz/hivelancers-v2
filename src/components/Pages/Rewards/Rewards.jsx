import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  FaArrowRight,
  FaBolt,
  FaChartSimple,
  FaCircleCheck,
  FaClock,
  FaCoins,
  FaGift,
  FaLock,
  FaMedal,
  FaRocket,
  FaShieldHalved,
  FaStar,
  FaTrophy,
} from 'react-icons/fa6';
import { getMyRewards } from '../../../services/rewards';
import styles from './Rewards.module.css';

const AUDIENCE_LABEL = {
  ALL: 'Geral',
  FREELANCER: 'Freelancer',
  CLIENT: 'Cliente',
};

const REWARD_ICON = {
  badge: <FaMedal />,
  mission: <FaBolt />,
  analytics: <FaChartSimple />,
  coupon: <FaGift />,
  boost: <FaRocket />,
  support: <FaShieldHalved />,
  campaign: <FaStar />,
};

const formatNumber = (value = 0) => Number(value || 0).toLocaleString('pt-BR');

const formatCurrency = (cents = 0) =>
  (Number(cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const clampPercent = (value = 0) => Math.max(0, Math.min(100, Number(value) || 0));

function Rewards() {
  const [loading, setLoading] = useState(true);
  const [rewardsData, setRewardsData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getMyRewards()
      .then((data) => {
        if (!cancelled) setRewardsData(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = rewardsData?.summary || {};
  const level = rewardsData?.level;
  const nextLevel = rewardsData?.nextLevel;
  const sources = rewardsData?.sources || [];
  const missions = rewardsData?.missions || [];
  const rewards = rewardsData?.rewards || [];
  const stats = rewardsData?.stats || {};
  const progress = clampPercent(summary.progressToNext);
  const completedMissions = missions.filter((mission) => mission.completed).length;

  const topSources = useMemo(
    () => [...sources].sort((a, b) => b.xp - a.xp).slice(0, 6),
    [sources]
  );

  const visibleLevels = useMemo(() => {
    const levels = rewardsData?.levels || [];
    if (!levels.length) return [];
    const currentNumber = level?.levelNumber || 1;
    return levels
      .filter((item) => item.levelNumber >= Math.max(1, currentNumber - 1))
      .slice(0, 5);
  }, [level?.levelNumber, rewardsData?.levels]);

  if (loading) {
    return (
      <div className={styles.page}>
        <section className={styles.skeletonHero} />
        <div className={styles.skeletonGrid}>
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (!rewardsData) {
    return (
      <div className={styles.page}>
        <section className={styles.emptyState}>
          <div className={styles.emptyIcon}><FaGift /></div>
          <span className={styles.sectionKicker}>Recompensas</span>
          <h1>Não foi possível carregar seu progresso</h1>
          <p>Atualize a página ou tente novamente em alguns instantes.</p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Programa de recompensas</span>
          <h1>{level?.name || 'Nível 1'} na Hivelancers</h1>
          <p>
            Ganhe XP ao completar o perfil, publicar serviços, contratar, entregar pedidos e receber avaliações.
          </p>

          <div className={styles.progressBlock}>
            <div className={styles.progressMeta}>
              <span>{formatNumber(summary.totalXp)} XP acumulados</span>
              <strong>
                {nextLevel
                  ? `${formatNumber(nextLevel.xpRequired)} XP para ${nextLevel.name}`
                  : 'Nível máximo liberado'}
              </strong>
            </div>
            <div className={styles.progressTrack}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.levelCard}>
          <span className={styles.levelAura} style={{ background: level?.badgeColor || '#3e73e6' }} />
          <div className={styles.levelMedal} style={{ background: level?.badgeColor || '#3e73e6' }}>
            <FaTrophy />
          </div>
          <span>{AUDIENCE_LABEL[rewardsData.audience] || 'Geral'}</span>
          <strong>Nível {level?.levelNumber || 1}</strong>
          <p>{level?.description || 'Sua reputação dentro da plataforma começa aqui.'}</p>
        </div>
      </section>

      <section className={styles.statGrid}>
        <article className={styles.statCard}>
          <div className={styles.statIcon}><FaCoins /></div>
          <span>Créditos</span>
          <strong>{formatNumber(summary.rewardCredits)}</strong>
          <p>Saldo simbólico gerado pelo XP.</p>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statIcon}><FaCircleCheck /></div>
          <span>Missões</span>
          <strong>{completedMissions}/{missions.length}</strong>
          <p>Objetivos concluídos no programa.</p>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statIcon}><FaStar /></div>
          <span>Avaliações</span>
          <strong>{stats.averageRating ? stats.averageRating.toFixed(1) : '-'}</strong>
          <p>{formatNumber(stats.reviewCount)} avaliações recebidas.</p>
        </article>
        <article className={styles.statCard}>
          <div className={styles.statIcon}><FaChartSimple /></div>
          <span>Receita concluída</span>
          <strong>{formatCurrency(stats.revenueCents)}</strong>
          <p>Pedidos finalizados como freelancer.</p>
        </article>
      </section>

      <section className={styles.workspaceGrid}>
        <div className={styles.mainStack}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionKicker}>Missões</span>
                <h2>Próximos passos para subir de nível</h2>
              </div>
              <Link className={styles.panelAction} to="/settings">
                Ajustar perfil <FaArrowRight />
              </Link>
            </div>

            <div className={styles.missionList}>
              {missions.map((item) => {
                const itemProgress = clampPercent((item.progress / Math.max(1, item.target)) * 100);
                return (
                  <article key={item.id} className={styles.missionCard}>
                    <div className={styles.missionIcon}>
                      {item.completed ? <FaCircleCheck /> : <FaClock />}
                    </div>
                    <div className={styles.missionBody}>
                      <div className={styles.missionTop}>
                        <div>
                          <h3>{item.title}</h3>
                          <p>{item.description}</p>
                        </div>
                        <strong>+{formatNumber(item.xp)} XP</strong>
                      </div>
                      <div className={styles.smallProgressTrack}>
                        <span style={{ width: `${itemProgress}%` }} />
                      </div>
                      <small>{formatNumber(item.progress)} de {formatNumber(item.target)}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionKicker}>Benefícios</span>
                <h2>Recompensas disponíveis</h2>
              </div>
            </div>

            <div className={styles.rewardGrid}>
              {rewards.map((reward) => (
                <article key={reward.id} className={`${styles.rewardCard} ${reward.unlocked ? styles.unlocked : styles.locked}`}>
                  <div className={styles.rewardIcon}>
                    {reward.unlocked ? (REWARD_ICON[reward.type] || <FaGift />) : <FaLock />}
                  </div>
                  <span>Nível {reward.minLevel}</span>
                  <h3>{reward.title}</h3>
                  <p>{reward.description}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.asideStack}>
          <section className={styles.panel}>
            <span className={styles.sectionKicker}>Trilha</span>
            <h2>Próximos níveis</h2>
            <div className={styles.levelTimeline}>
              {visibleLevels.map((item) => {
                const reached = (level?.levelNumber || 1) >= item.levelNumber;
                return (
                  <div key={`${item.audience || 'ALL'}-${item.levelNumber}-${item.id || item.name}`} className={styles.levelStep}>
                    <span className={reached ? styles.levelDotDone : styles.levelDot} style={{ background: reached ? item.badgeColor : undefined }} />
                    <div>
                      <strong>{item.name}</strong>
                      <small>{formatNumber(item.xpRequired)} XP</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.panel}>
            <span className={styles.sectionKicker}>XP</span>
            <h2>Como você pontuou</h2>
            <div className={styles.sourceList}>
              {topSources.length ? (
                topSources.map((source) => (
                  <div key={source.id} className={styles.sourceRow}>
                    <span>{source.label}</span>
                    <strong>+{formatNumber(source.xp)}</strong>
                  </div>
                ))
              ) : (
                <div className={styles.miniEmpty}>
                  <FaBolt />
                  <p>Complete uma missão para começar a acumular XP.</p>
                </div>
              )}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

export default Rewards;
