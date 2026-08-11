import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import styles from '../Settings.module.css';
import { useAuth } from '../../../../contexts/authContextStore';
import { deleteMyAccount, exportMyData } from '../../../../services/users';
import ConfirmDialog from '../../../UI/ConfirmDialog/ConfirmDialog';
import { Field, SectionHeader } from '../Settings.ui';

export default function DangerPanel() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [phraseConfirmation, setPhraseConfirmation] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const canDelete =
    emailConfirmation.trim().toLowerCase() === String(user?.email || '').toLowerCase() &&
    phraseConfirmation.trim() === 'EXCLUIR MINHA CONTA';

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportMyData();
      toast.success('Arquivo com seus dados preparado com sucesso.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteMyAccount({
        email: emailConfirmation.trim(),
        confirmation: phraseConfirmation.trim(),
      });
      setUser(null);
      navigate('/login', { replace: true });
      toast.success('Sua conta foi encerrada e os dados pessoais foram anonimizados.');
    } catch (err) {
      toast.error(err.message);
      setDeleteConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <section className={styles.card}>
        <SectionHeader
          title="Portabilidade dos seus dados"
          subtitle="Baixe uma cópia em JSON com perfil, serviços, pedidos, mensagens, pagamentos e verificações."
        />
        <div className={styles.accountDataAction}>
          <div className={styles.listCopy}>
            <strong>Exportar dados da conta</strong>
            <span>O arquivo é gerado de forma privada e baixado somente neste navegador.</span>
          </div>
          <button
            type="button"
            className={`${styles.btnGhost} ${styles.accountActionButton}`}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Preparando...' : 'Baixar meus dados'}
          </button>
        </div>
      </section>

      <section className={`${styles.card} ${styles.dangerCard}`}>
        <SectionHeader
          title="Encerramento da conta"
          subtitle="A conta será desativada e os dados pessoais serão anonimizados. Registros financeiros e contratuais podem ser retidos quando a lei exigir."
        />
        <div className={styles.dangerConfirmGrid}>
          <Field label="Confirme seu e-mail">
            <input
              className={styles.input}
              type="email"
              autoComplete="email"
              value={emailConfirmation}
              onChange={(event) => setEmailConfirmation(event.target.value)}
              placeholder={user?.email || 'seu@email.com'}
            />
          </Field>
          <Field label='Digite "EXCLUIR MINHA CONTA"'>
            <input
              className={styles.input}
              value={phraseConfirmation}
              onChange={(event) => setPhraseConfirmation(event.target.value)}
              autoComplete="off"
            />
          </Field>
        </div>

        <div className={styles.dangerActionBar}>
          <div className={styles.dangerActionCopy}>
            <strong>Excluir conta permanentemente</strong>
            <span>Pedidos em andamento, valores retidos ou assinatura ativa precisam ser resolvidos antes.</span>
          </div>
          <div className={styles.dangerButtonGroup}>
            <small>{canDelete ? 'Confirmações concluídas' : 'Complete as duas confirmações acima'}</small>
            <button
              type="button"
              className={styles.rowActionDanger}
              disabled={!canDelete || deleting}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              Excluir definitivamente
            </button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        variant="danger"
        eyebrow="Ação irreversível"
        title="Tem certeza que deseja excluir sua conta?"
        description={(
          <>
            <p>Seu acesso será encerrado imediatamente e você não poderá recuperar esta conta.</p>
            <ul>
              <li>Projetos em rascunho ou abertos serão cancelados.</li>
              <li>Projetos em andamento precisam ser finalizados antes.</li>
              <li>Históricos financeiros e contratuais obrigatórios serão mantidos anonimizados.</li>
            </ul>
          </>
        )}
        confirmLabel="Sim, excluir minha conta"
        cancelLabel="Não, manter minha conta"
        isLoading={deleting}
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
