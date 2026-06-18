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
                Encontre aqui o suporte para o seus problemas dentro da plataforma.
              </p>
            </div>
            <div className={styles.heroStats}>
            <div className={styles.statCard}>
                <span>Total salvo</span>
                <strong>Live</strong>
            </div>
            <div className={styles.statCard}>
                <span>Serviços</span>
                <strong>OFF</strong>
            </div>
            <div className={styles.statCard}>
                <span>Freelancers</span>
                <strong>OFF</strong>
            </div>
            </div>
      </section>

        <section className={styles.metricGrid}>
            <div className={styles.statusPanel}></div>
            <div className={styles.statusPanel}></div>
            <div className={styles.statusPanel}></div>
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
            <h3>Ticket</h3>
        </section>
        </div>
    )
}

export default Support;