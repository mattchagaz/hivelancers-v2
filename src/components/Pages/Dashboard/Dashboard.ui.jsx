import { Link } from 'react-router-dom';
import { FaArrowRight, FaCircleCheck } from 'react-icons/fa6';
import { SERVICE_GRADIENTS } from '../../../data/services';
import { CategoryIcon } from '../../../utils/categoryIcons';
import CategoryCarousel from '../../UI/CategoryCarousel/CategoryCarousel';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import styles from './Dashboard.module.css';
import {
  ORDER_STAGES,
  ORDER_STATUS_LABEL,
  SERVICE_STATUS_LABEL,
  formatPriceBRL,
  formatRelativeTime,
  getConversationPeer,
  getFullName,
  getInitials,
  getOrderPerson,
  getOrderTitle,
  getStageState,
} from './Dashboard.helpers';

export function DashboardHero({ eyebrow, title, description, primaryAction, secondaryAction, panel }) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>

        <div className={styles.heroActions}>
          <IconLink action={primaryAction} variant="primary" />
          <IconLink action={secondaryAction} variant="secondary" />
        </div>
      </div>

      <div className={styles.commandCard}>
        <span>{panel.label}</span>
        <strong>{panel.value}</strong>
        <p>{panel.detail}</p>
        <Link to={panel.actionTo}>
          {panel.actionLabel}
          <FaArrowRight />
        </Link>
      </div>
    </section>
  );
}

export function StatGrid({ items }) {
  return (
    <section className={styles.statGrid}>
      {items.map((item) => (
        <SpotlightCard key={item.label} className={`${styles.statCard} ${styles[item.tone]}`}>
          <div className={styles.statIcon}>{item.icon}</div>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <p>{item.detail}</p>
        </SpotlightCard>
      ))}
    </section>
  );
}

export function Panel({ kicker, title, description, actionLabel, actionTo, children }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          {kicker ? <span className={styles.sectionKicker}>{kicker}</span> : null}
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actionLabel && actionTo ? (
          <Link to={actionTo} className={styles.panelAction}>
            {actionLabel}
            <FaArrowRight />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function IconLink({ action, variant }) {
  if (!action) return null;
  return (
    <Link to={action.to} className={`${styles.heroAction} ${styles[variant]}`}>
      {action.icon}
      {action.label}
    </Link>
  );
}

export function QuickActions({ actions }) {
  return (
    <div className={styles.quickActions}>
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.to}
          className={`${styles.quickAction} ${action.primary ? styles.quickActionPrimary : ''}`}
        >
          <span>{action.icon}</span>
          <strong>{action.label}</strong>
          <FaArrowRight />
        </Link>
      ))}
    </div>
  );
}

export function OrderStack({ orders, mode }) {
  return (
    <div className={styles.orderStack}>
      {orders.map((order) => (
        <Link key={order.id} to={`/orders?id=${order.id}`} className={styles.orderCard}>
          <div className={styles.orderTop}>
            <div className={styles.orderTitleBlock}>
              <strong>{getOrderTitle(order)}</strong>
              <span>{mode === 'seller' ? 'Cliente' : 'Freelancer'}: {getOrderPerson(order, mode)}</span>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className={styles.orderMeta}>
            <span>{formatPriceBRL(order.priceCents)}</span>
            <span>{formatRelativeTime(order.updatedAt)}</span>
            <span>{order.deliveryDays || 1} dia{Number(order.deliveryDays || 1) > 1 ? 's' : ''}</span>
          </div>

          <div className={styles.timeline}>
            {ORDER_STAGES.map((stage) => {
              const state = getStageState(order.status, stage.key);
              return (
                <div key={stage.key} className={styles.timelineStep}>
                  <span className={`${styles.timelineBar} ${styles[`timeline_${state}`]}`} />
                  <small>{stage.label}</small>
                </div>
              );
            })}
          </div>
        </Link>
      ))}
    </div>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`${styles.statusBadge} ${styles[`status_${status}`] || ''}`}>
      {ORDER_STATUS_LABEL[status] || status}
    </span>
  );
}

export function ServiceStack({ services, editable = false }) {
  return (
    <div className={styles.serviceStack}>
      {services.map((service) => {
        const price = service.plans?.[0]?.priceCents ?? service.minPriceCents ?? 0;
        const href = editable ? `/services/${service.id}/edit` : `/services/${service.id}`;
        return (
          <Link key={service.id} to={href} className={styles.serviceRow}>
            <div className={styles.serviceIcon}>
              <CategoryIcon category={service.category} />
            </div>
            <div>
              <strong>{service.title}</strong>
              <p>{service.category?.name || 'Serviço'} • {service.plans?.length || 0} plano(s)</p>
            </div>
            <div className={styles.serviceRowMeta}>
              <span className={`${styles.serviceStatus} ${styles[`service_${service.status}`]}`}>
                {SERVICE_STATUS_LABEL[service.status] || service.status}
              </span>
              <small>{formatPriceBRL(price)}</small>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function ConversationStack({ conversations, userId }) {
  return (
    <div className={styles.conversationStack}>
      {conversations.map((conversation) => {
        const peer = getConversationPeer(conversation, userId);
        const preview = conversation.lastMessage?.content || 'Conversa iniciada';
        return (
          <Link key={conversation.id} to={`/messages?chat=${conversation.id}`} className={styles.conversationRow}>
            <div className={styles.avatar}>
              {peer?.avatarUrl ? <img src={peer.avatarUrl} alt="" /> : getInitials(peer)}
            </div>
            <div>
              <strong>{getFullName(peer)}</strong>
              <p>{preview}</p>
            </div>
            <div className={styles.conversationMeta}>
              <span>{formatRelativeTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}</span>
              {Number(conversation.unreadCount || 0) ? <b>{conversation.unreadCount}</b> : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function ServiceShowcase({ services }) {
  return (
    <div className={styles.showcaseGrid}>
      {services.map((service, index) => {
        const price = service.plans?.[0]?.priceCents ?? service.minPriceCents ?? 0;
        const seller = service.owner ? getFullName(service.owner) : 'Freelancer';
        return (
          <Link key={service.id} to={`/services/${service.id}`} className={styles.showcaseCard}>
            <div
              className={styles.showcaseVisual}
              style={
                service.coverUrl
                  ? { background: `url(${service.coverUrl}) center/cover` }
                  : { background: SERVICE_GRADIENTS[index % SERVICE_GRADIENTS.length] }
              }
            />
            <div className={styles.showcaseBody}>
              <span>{seller}</span>
              <strong>{service.title}</strong>
              <p>{service.category?.name || 'Serviço'} • a partir de {formatPriceBRL(price)}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function CategoryStrip({ categories }) {
  return (
    <div className={styles.categoryStrip}>
      <CategoryCarousel
        categories={categories}
        compact
        getHref={(category) => `/explore?category=${category.slug}`}
      />
    </div>
  );
}

export function FreelancerShortlist({ freelancers }) {
  return (
    <div className={styles.shortlistStack}>
      {freelancers.map((freelancer) => {
        const handle = freelancer.username || freelancer.id;
        return (
          <Link key={freelancer.id} to={`/profile/${handle}`} className={styles.freelancerRow}>
            <div className={styles.avatar}>
              {freelancer.avatarUrl ? <img src={freelancer.avatarUrl} alt="" /> : getInitials(freelancer)}
            </div>
            <div>
              <strong>{getFullName(freelancer)}</strong>
              <p>{freelancer.featuredProject?.title || freelancer.headline || 'Perfil salvo para comparar'}</p>
            </div>
            <FaArrowRight />
          </Link>
        );
      })}
    </div>
  );
}

export function SavedServices({ services }) {
  return (
    <div className={styles.savedStack}>
      {services.map((service) => {
        const price = service.plans?.[0]?.priceCents ?? service.minPriceCents ?? 0;
        return (
          <Link key={service.id} to={`/services/${service.id}`} className={styles.savedRow}>
            <div className={styles.serviceIcon}>
              <CategoryIcon category={service.category} />
            </div>
            <div>
              <strong>{service.title}</strong>
              <p>{service.owner ? getFullName(service.owner) : service.category?.name || 'Serviço salvo'}</p>
            </div>
            <small>{formatPriceBRL(price)}</small>
          </Link>
        );
      })}
    </div>
  );
}

export function SignalList({ items }) {
  return (
    <div className={styles.signalList}>
      {items.map((item) => (
        <div key={item.label} className={styles.signalItem}>
          <span>{item.label}</span>
          <strong className={styles[`signal_${item.tone}`]}>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function PriorityList({ items }) {
  return (
    <div className={styles.priorityList}>
      {items.map((item) => (
        <div key={item} className={styles.priorityItem}>
          <FaCircleCheck />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

export function EmptyBlock({ icon, title, description, actionLabel, actionTo }) {
  return (
    <div className={styles.emptyBlock}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {actionLabel && actionTo ? (
        <Link to={actionTo} className={styles.emptyAction}>
          {actionLabel}
          <FaArrowRight />
        </Link>
      ) : null}
    </div>
  );
}

export function LoadingRows({ count = 4 }) {
  return (
    <div className={styles.loadingRows}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.loadingRow}>
          <span />
          <div>
            <b />
            <small />
          </div>
        </div>
      ))}
    </div>
  );
}
