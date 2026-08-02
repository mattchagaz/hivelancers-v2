import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaArrowRight,
  FaArrowUpRightFromSquare,
  FaCalendarDays,
  FaCircleCheck,
  FaClock,
  FaLocationDot,
  FaShieldHalved,
  FaUserGroup,
} from 'react-icons/fa6';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import {
  createProjectProposal,
  getMyProject,
  getPublicProject,
  listProjectProposals,
  updateProject,
  updateProjectProposalStatus,
} from '../../../services/projects';
import { CategoryIcon } from '../../../utils/categoryIcons';
import styles from './ProjectDetails.module.css';

const statusLabels = {
  OPEN: 'Recebendo propostas',
  IN_PROGRESS: 'Profissional selecionado',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
  DRAFT: 'Rascunho',
};

const formatMoney = (cents = 0) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

const formatBudget = (project) =>
  project.budgetType === 'FIXED' || project.budgetMinCents === project.budgetMaxCents
    ? formatMoney(project.budgetMinCents)
    : `${formatMoney(project.budgetMinCents)} – ${formatMoney(project.budgetMaxCents)}`;

const personName = (person) =>
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || person?.username || 'Usuário';

function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState('');
  const [proposal, setProposal] = useState({
    coverLetter: '',
    price: '',
    deliveryDays: '',
    revisions: '1',
  });

  const isOwner = Boolean(user?.id && project?.client?.id === user.id);
  const canPropose = user?.userType === 'FREELANCER' && project?.status === 'OPEN';

  const fetchProject = useCallback(async () => {
    try {
      return await getPublicProject(id);
    } catch (publicError) {
      if (user?.userType === 'CLIENT') {
        try {
          return await getMyProject(id);
        } catch {
          // Preserve the public error because it is the least revealing response.
        }
      }
      throw publicError;
    }
  }, [id, user?.userType]);

  const loadProject = () =>
    fetchProject()
      .then(setProject)
      .catch((error) => toast.error(error.message));

  const loadProposals = () => {
    if (!isOwner) return Promise.resolve();
    setLoadingProposals(true);
    return listProjectProposals(id)
      .then(setProposals)
      .catch((error) => toast.error(error.message))
      .finally(() => setLoadingProposals(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchProject()
      .then((data) => {
        if (!cancelled) setProject(data);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [fetchProject, user?.id]);

  useEffect(() => {
    if (!isOwner) {
      setProposals([]);
      return;
    }
    loadProposals();
    // The owner state changes only after the project has loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner, id]);

  const clientInitials = useMemo(
    () => personName(project?.client).split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
    [project?.client]
  );

  const requireLogin = () => {
    navigate('/login', {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const submitProposal = async (event) => {
    event.preventDefault();
    if (!user) {
      requireLogin();
      return;
    }
    if (!canPropose || submitting) return;

    const priceCents = Math.round(Number(String(proposal.price).replace(',', '.')) * 100);
    setSubmitting(true);
    try {
      await createProjectProposal(id, {
        coverLetter: proposal.coverLetter,
        priceCents,
        deliveryDays: Number(proposal.deliveryDays),
        revisions: Number(proposal.revisions),
      });
      toast.success('Proposta enviada ao cliente.');
      setProposal({ coverLetter: '', price: '', deliveryDays: '', revisions: '1' });
      await loadProject();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const reviewProposal = async (proposalId, status) => {
    if (actionId) return;
    setActionId(proposalId);
    try {
      const result = await updateProjectProposalStatus(id, proposalId, status);
      toast.success(status === 'ACCEPTED' ? 'Proposta aceita.' : 'Proposta recusada.');
      await Promise.all([loadProject(), loadProposals()]);
      if (status === 'ACCEPTED' && result.conversationId) {
        navigate(`/messages?chat=${result.conversationId}`);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionId('');
    }
  };

  const changeProjectStatus = async (status) => {
    setActionId(`project_${status}`);
    try {
      const next = await updateProject(id, { status });
      setProject(next);
      toast.success(status === 'COMPLETED' ? 'Projeto marcado como concluído.' : 'Projeto encerrado.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActionId('');
    }
  };

  if (loading) {
    return <div className={styles.state}>Carregando projeto…</div>;
  }

  if (!project) {
    return (
      <div className={styles.state}>
        <h1>Projeto não encontrado</h1>
        <Link to="/projects">Voltar para oportunidades</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/projects" className={styles.back}><FaArrowLeft /> Projetos</Link>

      <div className={styles.layout}>
        <main className={styles.main}>
          <section className={styles.hero}>
            <div className={styles.heroMeta}>
              <span className={styles.category}>
                <CategoryIcon category={project.category} />
                {project.category?.name || 'Projeto multidisciplinar'}
              </span>
              <span className={`${styles.status} ${styles[project.status.toLowerCase()]}`}>
                {statusLabels[project.status]}
              </span>
            </div>

            <h1>{project.title}</h1>
            <p className={styles.published}>
              Publicado em {new Date(project.publishedAt || project.createdAt).toLocaleDateString('pt-BR')}
            </p>

            <div className={styles.heroStats}>
              <div><small>Orçamento</small><strong>{formatBudget(project)}</strong></div>
              <div><small><FaCalendarDays /> Prazo</small><strong>{project.deadline ? new Date(project.deadline).toLocaleDateString('pt-BR') : 'A combinar'}</strong></div>
              <div><small><FaUserGroup /> Interesse</small><strong>{project.proposalCount} {project.proposalCount === 1 ? 'proposta' : 'propostas'}</strong></div>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Sobre o projeto</h2>
            <div className={styles.description}>{project.description}</div>
          </section>

          {project.skills?.length > 0 && (
            <section className={styles.card}>
              <h2>Habilidades desejadas</h2>
              <div className={styles.skills}>
                {project.skills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
            </section>
          )}

          {project.referenceUrls?.length > 0 && (
            <section className={styles.card}>
              <h2>Referências fornecidas</h2>
              <div className={styles.references}>
                {project.referenceUrls.map((url, index) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    Referência {index + 1} <FaArrowUpRightFromSquare />
                  </a>
                ))}
              </div>
            </section>
          )}

          {isOwner && (
            <section className={styles.card}>
              <div className={styles.sectionHead}>
                <div>
                  <span>Seleção</span>
                  <h2>Propostas recebidas</h2>
                </div>
                <strong>{proposals.length}</strong>
              </div>

              {loadingProposals ? (
                <div className={styles.inlineState}>Carregando propostas…</div>
              ) : proposals.length === 0 ? (
                <div className={styles.inlineState}>Seu projeto ainda não recebeu propostas.</div>
              ) : (
                <div className={styles.proposals}>
                  {proposals.map((item) => (
                    <article key={item.id} className={styles.proposalCard}>
                      <div className={styles.freelancer}>
                        <div className={styles.avatar}>
                          {item.freelancer.avatarUrl
                            ? <img src={item.freelancer.avatarUrl} alt="" />
                            : personName(item.freelancer)[0]}
                        </div>
                        <div>
                          <Link to={`/profile/${item.freelancer.username || item.freelancer.id}`}>
                            {personName(item.freelancer)}
                          </Link>
                          <span>{item.freelancer.headline || 'Freelancer Hivelancers'}</span>
                        </div>
                        {item.freelancer.identityVerified && (
                          <span className={styles.verified}><FaShieldHalved /> Verificado</span>
                        )}
                      </div>

                      <p>{item.coverLetter}</p>

                      <div className={styles.proposalMeta}>
                        <div><small>Proposta</small><strong>{formatMoney(item.priceCents)}</strong></div>
                        <div><small>Entrega</small><strong>{item.deliveryDays} dias</strong></div>
                        <div><small>Revisões</small><strong>{item.revisions}</strong></div>
                        <span className={`${styles.proposalStatus} ${styles[item.status.toLowerCase()]}`}>
                          {item.status === 'PENDING' ? 'Aguardando' : item.status === 'ACCEPTED' ? 'Aceita' : 'Recusada'}
                        </span>
                      </div>

                      {item.status === 'PENDING' && project.status === 'OPEN' && (
                        <div className={styles.proposalActions}>
                          <button
                            type="button"
                            className={styles.reject}
                            disabled={Boolean(actionId)}
                            onClick={() => reviewProposal(item.id, 'REJECTED')}
                          >
                            Recusar
                          </button>
                          <button
                            type="button"
                            className={styles.accept}
                            disabled={Boolean(actionId)}
                            onClick={() => reviewProposal(item.id, 'ACCEPTED')}
                          >
                            Selecionar proposta <FaArrowRight />
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        <aside className={styles.sidebar}>
          <section className={styles.clientCard}>
            <span className={styles.asideLabel}>Publicado por</span>
            <Link to={`/profile/${project.client.username || project.client.id}`} className={styles.client}>
              <div className={styles.clientAvatar}>
                {project.client.avatarUrl ? <img src={project.client.avatarUrl} alt="" /> : clientInitials}
              </div>
              <div>
                <strong>{personName(project.client)}</strong>
                {project.client.username && <span>@{project.client.username}</span>}
              </div>
            </Link>
            <ul>
              {project.client.identityVerified && <li><FaShieldHalved /> Identidade verificada</li>}
              {project.client.location && <li><FaLocationDot /> {project.client.location}</li>}
              <li><FaClock /> Membro desde {new Date(project.client.createdAt).getFullYear()}</li>
            </ul>
          </section>

          {!user && project.status === 'OPEN' && (
            <section className={styles.proposalForm}>
              <span className={styles.asideLabel}>Quer participar?</span>
              <h2>Entre para enviar sua proposta.</h2>
              <p>Seu perfil e portfólio serão apresentados ao cliente.</p>
              <button type="button" className={styles.submit} onClick={requireLogin}>Entrar e enviar proposta</button>
              <Link to="/signup" className={styles.createAccount}>Criar conta</Link>
            </section>
          )}

          {canPropose && (
            <form className={styles.proposalForm} onSubmit={submitProposal}>
              <span className={styles.asideLabel}>Sua proposta</span>
              <h2>Mostre como você pode ajudar.</h2>

              <label>
                Mensagem ao cliente
                <textarea
                  value={proposal.coverLetter}
                  onChange={(event) => setProposal((current) => ({ ...current, coverLetter: event.target.value }))}
                  minLength={40}
                  maxLength={500}
                  rows={7}
                  placeholder="Apresente sua experiência, abordagem e o que está incluso."
                  required
                />
                <span className={styles.charCount}>{proposal.coverLetter.length}/500</span>
              </label>

              <label>
                Valor da proposta
                <div className={styles.money}>
                  <span>R$</span>
                  <input
                    type="number"
                    min="10"
                    step="0.01"
                    value={proposal.price}
                    onChange={(event) => setProposal((current) => ({ ...current, price: event.target.value }))}
                    required
                  />
                </div>
              </label>

              <div className={styles.formRow}>
                <label>
                  Entrega em dias
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={proposal.deliveryDays}
                    onChange={(event) => setProposal((current) => ({ ...current, deliveryDays: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Revisões
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={proposal.revisions}
                    onChange={(event) => setProposal((current) => ({ ...current, revisions: event.target.value }))}
                    required
                  />
                </label>
              </div>

              <button type="submit" className={styles.submit} disabled={submitting}>
                {submitting ? 'Enviando…' : 'Enviar proposta'}
              </button>
              <small>O envio da proposta ainda não gera cobrança.</small>
            </form>
          )}

          {isOwner && (
            <section className={styles.ownerActions}>
              <span className={styles.asideLabel}>Gerenciar projeto</span>
              <Link to="/projects/mine">Ver todos os projetos</Link>
              {project.status === 'DRAFT' && (
                <button
                  type="button"
                  className={styles.complete}
                  disabled={Boolean(actionId)}
                  onClick={() => changeProjectStatus('OPEN')}
                >
                  Publicar rascunho
                </button>
              )}
              {project.status === 'OPEN' && (
                <button
                  type="button"
                  disabled={Boolean(actionId)}
                  onClick={() => changeProjectStatus('CANCELED')}
                >
                  Encerrar publicação
                </button>
              )}
              {project.status === 'IN_PROGRESS' && (
                <button
                  type="button"
                  className={styles.complete}
                  disabled={Boolean(actionId)}
                  onClick={() => changeProjectStatus('COMPLETED')}
                >
                  <FaCircleCheck /> Marcar como concluído
                </button>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ProjectDetails;
