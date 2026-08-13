import { useEffect, useState } from 'react';
import { FaChevronLeft, FaCircleCheck, FaCopy, FaPix, FaShieldHalved } from 'react-icons/fa6';
import { toast, Toaster } from 'sonner';
import { getCheckoutSessionStatus } from '../../../services/payments';
import styles from './Checkout.module.css';

const formatPrice = (cents = 0) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(cents / 100);

export default function PixPaymentPanel({ initialPayment, pix, onOrderCreated, onBack }) {
  const [payment, setPayment] = useState(initialPayment);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let active = true;
    const check = async () => {
      if (!active) return;
      setChecking(true);
      try {
        const data = await getCheckoutSessionStatus(payment.id);
        if (cancelled) return;
        setPayment(data.payment);
        if (data.payment.order) {
          active = false;
          onOrderCreated(data.payment.order);
        } else if (!['CHECKOUT_CREATED', 'PENDING'].includes(data.payment.status)) {
          active = false;
        }
      } catch (error) {
        if (!cancelled) toast.error(error.message);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    const interval = window.setInterval(check, 4000);
    check();
    return () => {
      cancelled = true;
      active = false;
      window.clearInterval(interval);
    };
  }, [onOrderCreated, payment.id]);

  const pending = ['CHECKOUT_CREATED', 'PENDING'].includes(payment.status);
  const brCode = pix?.brCode || payment.pixBrCode;
  const qrCode = pix?.qrCodeBase64 || payment.pixQrCodeBase64;

  return (
    <div className={styles.pixPaymentPage}>
      <section className={styles.pixPaymentCard}>
        <button type="button" className={styles.pixMobileBack} onClick={onBack} aria-label="Voltar">
          <FaChevronLeft /> Voltar
        </button>

        <div className={styles.pixPaymentHeading}>
          <span className={styles.pixBrandIcon}><FaPix /></span>
          <div>
            <span>Pagamento protegido</span>
            <h1>{pending ? 'Pague com Pix para iniciar o pedido' : 'Este Pix não está mais disponível'}</h1>
            <p>O valor será confirmado pela AbacatePay e ficará protegido até a aprovação da entrega.</p>
          </div>
        </div>

        {pending ? (
          <div className={styles.pixPaymentBody}>
            <div className={styles.pixQrWrap}>
              {qrCode ? <img src={qrCode} alt="QR Code do pagamento Pix" /> : <FaPix />}
              <span>{checking ? 'Verificando pagamento...' : 'Aguardando pagamento'}</span>
            </div>
            <div className={styles.pixPaymentDetails}>
              <span className={styles.pixAmountLabel}>Total a pagar</span>
              <strong className={styles.pixAmount}>{formatPrice(payment.totalCents)}</strong>
              <ol>
                <li>Abra o aplicativo do seu banco.</li>
                <li>Escolha pagar com Pix e escaneie o QR Code.</li>
                <li>Aguarde a confirmação automática nesta tela.</li>
              </ol>
              <label className={styles.pixCopyField}>
                <span>Pix copia e cola</span>
                <div>
                  <input readOnly value={brCode || ''} />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (!brCode) throw new Error('Código Pix indisponível.');
                        if (navigator.clipboard?.writeText) {
                          await navigator.clipboard.writeText(brCode);
                        } else {
                          const input = document.createElement('textarea');
                          input.value = brCode;
                          input.style.position = 'fixed';
                          input.style.opacity = '0';
                          document.body.appendChild(input);
                          input.select();
                          document.execCommand('copy');
                          input.remove();
                        }
                        toast.success('Código Pix copiado.');
                      } catch (error) {
                        toast.error(error.message || 'Não foi possível copiar o código Pix.');
                      }
                    }}
                    disabled={!brCode}
                  >
                    <FaCopy /> Copiar
                  </button>
                </div>
              </label>
              <div className={styles.pixProtectionNote}>
                <FaShieldHalved />
                <span>Não feche a página até o banco confirmar. A atualização acontece automaticamente.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.pixExpiredState}>
            <FaCircleCheck />
            <p>O pagamento foi cancelado, expirou ou não pôde ser confirmado.</p>
            <button type="button" className={styles.primaryButton} onClick={onBack}>Criar um novo Pix</button>
          </div>
        )}
      </section>
      <Toaster position="top-center" richColors />
    </div>
  );
}
