import styles from "./Support.module.css";

import {
  FaArrowRight,
} from 'react-icons/fa6';

function Support() {

const Stack = {
    Gerenciamento: [
        { label: "Recuperar sua conta", href: "/account/recover" },
        { label: "Esqueci meu nome de usuário", href: "/account/forgot-username" },
        { label: "Esqueci minha senha", href: "/account/forgot-password" },
    ],
    Pagamentos: [
        { label: "Reembolso de compra", href: "/payments/refund" },
        { label: "Resolver estornos", href: "/payments/chargebacks" },
    ],
    Privacidade: [
        { label: "Solicitar dados da conta", href: "/privacy/request-data" },
        { label: "Exclusão de conta", href: "/account/delete" },
    ],
}

    return (
        <div className={styles.page}>
        <section className={styles.hero}>
            <div className={styles.heroMain}>
              <span className={styles.eyebrow}>Suporte</span>
              <h1 className={styles.title}>Central de suporte Hivelancers</h1>
              <p className={styles.subtitle}>
                Encontre aqui o suporte e a ajuda necessaria para resolver o seus problemas dentro da plataforma.
              </p>
            </div>
            <div className={styles.heroStats}>
            <div className={styles.statCard}>
                <span>Pagamento via pix</span>
                <strong>OFF</strong>
            </div>
            <div className={styles.statCard}>
                <span>Serviços</span>
                <strong>ON</strong>
            </div>
            <div className={styles.statCard}>
                <span>Pagamento via credito/debito</span>
                <strong>ON</strong>
            </div>
            </div>
      </section>

        <section className={styles.tools}>
            <div className={styles.toolsHeader}>
                <div>
                    <span className={styles.sectionKicker}>Controle</span>
                    <h2>Ferramentas de Suporte</h2>
                </div>
            </div>
                <div className={styles.muiGrid}>
                    {Object.keys(Stack).map((key) => (
                        <section className={styles.muiPanelStack} key={key}>
                            <div className={styles.panelHead}>
                                <div>
                                    <span className={styles.sectionKicker}>Controle</span>
                                    <h3>{key}</h3>
                                </div>
                                <div></div>
                            </div>
                            <div className={styles.actionList}>
                            {Stack[key].map((item, index) => (
                                <div className={styles.muiPanel} key={index}>
                                    <a className={styles.panelAction} href={item.href}>{item.label} <FaArrowRight /></a>
                                </div>
                            ))}
                            </div>
                        </section>
                    ))}
                </div>
        </section>



        <section className={styles.ticketPanel}>
            <div className={styles.ticketHeader}>
                <div>
                    <span className={styles.sectionKicker}>Conversa</span>
                    <h2>Esta tendo algum outro problema?</h2>
                </div>
            </div>
            <div className={styles.muiHeader}>
                <div className={styles.muiPanel}>
                    <a className={styles.panelAction} href="/ticket">
                        <div>
                            <h3>Enviar um ticket</h3>
                            <strong>Diga qual é o problema em um ticket</strong>
                        </div>
                        <FaArrowRight />
                    </a>
                </div>

                <div className={styles.muiPanel}>
                    <a className={styles.panelAction} href="/livesupport">
                        <div>
                            <h3>Suporte ao vivo</h3>
                            <strong>Converse com a gente para resolver seus problemas sem demora</strong>
                        </div>
                        <FaArrowRight />
                    </a>
                </div>
            </div>
        </section>
        </div>
    )
}

export default Support;