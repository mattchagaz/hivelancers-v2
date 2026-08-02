import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import styles from '../Settings.module.css';
import {
  createMyStripeConnectDashboardLink,
  createMyStripeConnectOnboardingLink,
  getMyStripeConnectStatus,
} from '../../../../services/payments';
import { SectionHeader } from '../Settings.ui';

function renderCardIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3" /><line x1="2" y1="10" x2="22" y2="10" /></svg>;
}

export default function BillingPanel({ isFreelancer }) {
  const [connectState, setConnectState] = useState({ configured: true, connected: false, account: null });
  const [isLoading, setIsLoading] = useState(isFreelancer);
  const [activeStripeAction, setActiveStripeAction] = useState('');

  useEffect(() => {
    if (isFreelancer) {
      getMyStripeConnectStatus().then(setConnectState).catch(() => {}).finally(() => setIsLoading(false));
    }
  }, [isFreelancer]);

  return (
    <section className={styles.card}>
      <SectionHeader
        title="Pagamentos, planos e verificação"
        subtitle={isFreelancer ? 'Gerencie assinatura, dados de recebimento e liberação de repasses.' : 'Gerencie assinatura, métodos de pagamento e histórico de cobrança.'}
      />
      <div className={styles.listRow}>
        <div className={styles.listIcon}>{renderCardIcon()}</div>
        <div className={styles.listCopy}>
          <strong>Verificação de identidade</strong>
          <span>Confirme CPF e documento para proteger recompensas, cupons, pedidos e limites futuros da conta.</span>
        </div>
        <Link to="/verification" className={styles.btnPrimary}>Abrir verificação</Link>
      </div>
      {isFreelancer ? (
        <>
          <div className={styles.listRow}>
            <div className={styles.listIcon}>{renderCardIcon()}</div>
            <div className={styles.listCopy}>
              <strong>Conta Stripe Connect</strong>
              <span>{isLoading ? 'Verificando...' : connectState.account ? 'Conta de repasse conectada. Use a Stripe para acompanhar saques.' : 'Conecte sua conta recebedora para liberar repasses de pedidos pagos.'}</span>
            </div>
            <button
              type="button"
              className={styles.btnGhost}
              disabled={activeStripeAction === 'stripe'}
              onClick={async () => {
                setActiveStripeAction('stripe');
                try {
                  const data = connectState.account?.detailsSubmitted
                    ? await createMyStripeConnectDashboardLink()
                    : await createMyStripeConnectOnboardingLink();
                  if (data?.url) window.location.assign(data.url);
                } catch (error) {
                  toast.error(error.message || 'Não foi possível abrir a Stripe.');
                  setActiveStripeAction('');
                }
              }}
            >
              {activeStripeAction === 'stripe' ? 'Abrindo...' : connectState.account?.detailsSubmitted ? 'Abrir Stripe' : 'Conectar Stripe'}
            </button>
          </div>
          <div className={styles.listRow}>
            <div className={styles.listIcon}>{renderCardIcon()}</div>
            <div className={styles.listCopy}>
              <strong>Plano e assinatura</strong>
              <span>Compare benefícios, comissão, recursos de crescimento e cobrança recorrente.</span>
            </div>
            <Link to="/subscription" className={styles.btnGhost}>Ver planos</Link>
          </div>
        </>
      ) : (
        <>
          <div className={styles.listRow}>
            <div className={styles.listIcon}>{renderCardIcon()}</div>
            <div className={styles.listCopy}>
              <strong>Plano e assinatura</strong>
              <span>Veja os recursos disponíveis para clientes, equipes e empresas.</span>
            </div>
            <Link to="/subscription" className={styles.btnPrimary}>Ver planos</Link>
          </div>
          <div className={styles.listRow}>
            <div className={styles.listIcon}>{renderCardIcon()}</div>
            <div className={styles.listCopy}>
              <strong>Métodos de pagamento</strong>
              <span>Gerenciamento de cartões e recibos para clientes ficará disponível pelo portal seguro.</span>
            </div>
            <button type="button" className={styles.btnGhost} disabled>Em breve</button>
          </div>
        </>
      )}
    </section>
  );
}
