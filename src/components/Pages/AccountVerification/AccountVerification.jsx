import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  FaArrowRight,
  FaCircleCheck,
  FaClock,
  FaFileShield,
  FaIdCard,
  FaLock,
  FaRotateRight,
  FaShieldHalved,
  FaTriangleExclamation,
  FaUpload,
  FaUserCheck,
} from 'react-icons/fa6';
import { getMyAccountVerification, submitMyAccountVerification } from '../../../services/users';
import { uploadImageToCloudinary } from '../../../services/cloudinary';
import { useAuth } from '../../../contexts/AuthContext';
import SpotlightCard from '../../UI/SpotlightCard/SpotlightCard';
import styles from './AccountVerification.module.css';

const DOCUMENT_LABEL = {
  RG: 'RG',
  CNH: 'CNH',
  PASSPORT: 'Passaporte',
  OTHER: 'Outro documento',
};

const STATUS_COPY = {
  NOT_STARTED: {
    tone: 'blue',
    label: 'Não iniciada',
    title: 'Sua identidade ainda não foi verificada',
    text: 'Envie CPF e documento oficial para liberar recursos sensíveis com mais segurança.',
    icon: <FaIdCard />,
  },
  DRAFT: {
    tone: 'blue',
    label: 'Rascunho',
    title: 'Complete os dados para análise',
    text: 'Você pode revisar as informações antes de enviar para a equipe Hivelancers.',
    icon: <FaClock />,
  },
  PENDING: {
    tone: 'orange',
    label: 'Em análise',
    title: 'Documentos aguardando revisão',
    text: 'A equipe vai conferir os dados enviados. Você pode reenviar caso precise corrigir algo.',
    icon: <FaClock />,
  },
  VERIFIED: {
    tone: 'green',
    label: 'Verificada',
    title: 'Conta verificada pela Hivelancers',
    text: 'Sua identidade foi aprovada. Isso ajuda a proteger recompensas, cupons, pedidos e recebimentos futuros.',
    icon: <FaCircleCheck />,
  },
  REJECTED: {
    tone: 'red',
    label: 'Recusada',
    title: 'Precisamos de uma correção',
    text: 'Revise o motivo da recusa, ajuste os documentos e envie novamente para análise.',
    icon: <FaTriangleExclamation />,
  },
};

const onlyDigits = (value = '') => value.replace(/\D/g, '');

const formatCpf = (value = '') => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
};

const formatPhone = (value = '') => {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const formatLegalName = (value = '') =>
  value
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|\s)(\p{L})/gu, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase('pt-BR')}`);

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const emptyForm = {
  legalName: '',
  cpf: '',
  birthDate: '',
  documentType: 'RG',
  documentNumber: '',
  phone: '',
  addressLine: '',
  addressCity: '',
  addressState: '',
  addressPostalCode: '',
  documentFrontUrl: '',
  documentBackUrl: '',
  proofOfAddressUrl: '',
  consentAccepted: false,
};

const formFromVerification = (verification) => ({
  legalName: verification?.legalName || '',
  cpf: verification?.cpf || '',
  birthDate: toDateInput(verification?.birthDate),
  documentType: verification?.documentType || 'RG',
  documentNumber: verification?.documentNumber || '',
  phone: verification?.phone || '',
  addressLine: verification?.addressLine || '',
  addressCity: verification?.addressCity || '',
  addressState: verification?.addressState || '',
  addressPostalCode: verification?.addressPostalCode || '',
  documentFrontUrl: verification?.documentFrontUrl || '',
  documentBackUrl: verification?.documentBackUrl || '',
  proofOfAddressUrl: verification?.proofOfAddressUrl || '',
  consentAccepted: Boolean(verification?.consentAcceptedAt),
});

const getSavedCompletion = (verification) => {
  if (!verification) return 0;
  const required = [
    verification.legalName,
    onlyDigits(verification.cpf).length === 11,
    verification.birthDate,
    onlyDigits(verification.documentNumber).length === 11,
    verification.documentFrontUrl,
    verification.consentAcceptedAt,
  ];
  return Math.round((required.filter(Boolean).length / required.length) * 100);
};

function UploadField({ title, description, value, onChange, active, onUpload }) {
  return (
    <div className={styles.uploadField}>
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <label className={styles.uploadButton}>
        <FaUpload />
        {active ? 'Enviando...' : value ? 'Trocar arquivo' : 'Enviar arquivo'}
        <input
          type="file"
          accept="image/*,application/pdf"
          disabled={active}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = '';
          }}
        />
      </label>
      {value && (
        <a href={value} target="_blank" rel="noreferrer" className={styles.fileLink}>
          Arquivo enviado <FaArrowRight />
        </a>
      )}
      <input
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ou cole uma URL segura do documento"
      />
    </div>
  );
}

function AccountVerification() {
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'NOT_STARTED', verification: null });
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeUpload, setActiveUpload] = useState('');

  const loadVerification = useCallback(async () => {
    if (!user?.id) {
      setState({ status: 'NOT_STARTED', verification: null });
      setForm(emptyForm);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getMyAccountVerification();
      setState(data);
      if (data.verification && ['DRAFT', 'REJECTED'].includes(data.status)) {
        setForm(formFromVerification(data.verification));
      } else {
        setForm(emptyForm);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadVerification();
  }, [loadVerification]);

  const status = loading ? 'DRAFT' : state.status;
  const statusCopy = STATUS_COPY[status] || STATUS_COPY.NOT_STARTED;
  const verification = state.verification;

  const completion = useMemo(() => getSavedCompletion(verification), [verification]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const uploadFor = async (field, file) => {
    setActiveUpload(field);
    try {
      const { url } = await uploadImageToCloudinary(file);
      updateField(field, url);
      toast.success('Arquivo enviado.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setActiveUpload('');
    }
  };

  const saveVerification = async (submitForReview = false) => {
    if (saving) return;

    setSaving(true);
    try {
      const payload = {
        ...form,
        cpf: onlyDigits(form.cpf).slice(0, 11),
        documentNumber: onlyDigits(form.documentNumber).slice(0, 11),
        phone: onlyDigits(form.phone).slice(0, 11),
        country: 'BR',
        submitForReview,
      };
      const data = await submitMyAccountVerification(payload);
      setState(data);
      if (submitForReview) {
        setForm(emptyForm);
      } else if (data.verification) {
        setForm(formFromVerification(data.verification));
      } else {
        setForm(emptyForm);
      }
      window.dispatchEvent(new CustomEvent('hivelancers:notifications:refresh'));
      toast.success(submitForReview ? 'Verificação enviada para análise.' : 'Dados salvos.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    await saveVerification(true);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Verificação da conta</span>
          <h1>Confirme sua identidade para proteger benefícios, pedidos e recompensas.</h1>
          <p>
            Esta verificação é própria da Hivelancers e vale para clientes e freelancers. Ela ajuda a vincular CPF, reduzir abuso de múltiplas contas e preparar recursos como cupons, dinheiro promocional e limites maiores.
          </p>
        </div>

        <aside className={`${styles.statusCard} ${styles[statusCopy.tone]}`}>
          <div className={styles.statusIcon}>{statusCopy.icon}</div>
          <span>{statusCopy.label}</span>
          <strong>{statusCopy.title}</strong>
          <p>{statusCopy.text}</p>
          {verification?.reviewNote && <em>{verification.reviewNote}</em>}
        </aside>
      </section>

      {status === 'PENDING' && (
        <section className={`${styles.reviewNotice} ${styles.reviewNoticePending}`}>
          <div className={styles.reviewNoticeIcon}><FaClock /></div>
          <div>
            <span>Documentos enviados</span>
            <strong>Sua verificação está em análise</strong>
            <p>Assim que a equipe revisar seus dados, você receberá uma notificação com o resultado.</p>
          </div>
        </section>
      )}

      {status === 'REJECTED' && (
        <section className={`${styles.reviewNotice} ${styles.reviewNoticeRejected}`}>
          <div className={styles.reviewNoticeIcon}><FaTriangleExclamation /></div>
          <div>
            <span>Verificação recusada</span>
            <strong>Corrija as informações e envie novamente</strong>
            <p>{verification?.reviewNote || 'Os documentos não foram aprovados. Revise os dados, troque os arquivos se necessário e faça um novo envio.'}</p>
          </div>
        </section>
      )}

      {status === 'VERIFIED' && (
        <section className={`${styles.reviewNotice} ${styles.reviewNoticeApproved}`}>
          <div className={styles.reviewNoticeIcon}><FaCircleCheck /></div>
          <div>
            <span>Conta verificada</span>
            <strong>Sua identidade foi aprovada</strong>
            <p>Essa conta agora está vinculada aos dados analisados pela Hivelancers.</p>
          </div>
        </section>
      )}

      <section className={styles.metricGrid}>
        <SpotlightCard className={styles.metricCard}>
          <FaShieldHalved />
          <span>Progresso</span>
          <strong>{completion}%</strong>
          <p>Campos essenciais salvos</p>
        </SpotlightCard>
        <SpotlightCard className={styles.metricCard}>
          <FaLock />
          <span>CPF</span>
          <strong>{verification?.cpf ? 'Salvo' : 'Pendente'}</strong>
          <p>Um CPF só pode validar uma conta</p>
        </SpotlightCard>
        <SpotlightCard className={styles.metricCard}>
          <FaFileShield />
          <span>Documentos</span>
          <strong>{verification?.documentFrontUrl ? 'Documento salvo' : 'Pendente'}</strong>
          <p>Frente do documento, verso e comprovante quando houver</p>
        </SpotlightCard>
        <SpotlightCard className={styles.metricCard}>
          <FaUserCheck />
          <span>Status</span>
          <strong>{statusCopy.label}</strong>
          <p>{verification?.submittedAt ? `Enviado em ${new Date(verification.submittedAt).toLocaleDateString('pt-BR')}` : 'Aguardando envio'}</p>
        </SpotlightCard>
      </section>

      <form className={styles.workspaceGrid} onSubmit={submit}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.sectionKicker}>Dados pessoais</span>
            <h2>Identidade e CPF</h2>
            <p>Use os dados exatamente como aparecem no documento oficial.</p>
          </div>

          <div className={styles.formGrid}>
            <label className={styles.formField}>
              <span>Nome legal completo</span>
              <input value={form.legalName} onChange={(event) => updateField('legalName', formatLegalName(event.target.value))} placeholder="Nome completo" required />
            </label>
            <label className={styles.formField}>
              <span>CPF</span>
              <input
                value={formatCpf(form.cpf)}
                onChange={(event) => updateField('cpf', onlyDigits(event.target.value).slice(0, 11))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
                required
              />
            </label>
            <label className={styles.formField}>
              <span>Data de nascimento</span>
              <input type="date" value={form.birthDate} onChange={(event) => updateField('birthDate', event.target.value)} required />
            </label>
            <label className={styles.formField}>
              <span>Tipo de documento</span>
              <select value={form.documentType} onChange={(event) => updateField('documentType', event.target.value)}>
                {Object.entries(DOCUMENT_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className={styles.formField}>
              <span>Número do documento (CPF)</span>
              <input
                value={formatCpf(form.documentNumber)}
                onChange={(event) => updateField('documentNumber', onlyDigits(event.target.value).slice(0, 11))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                maxLength={14}
                pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
                required
              />
            </label>
            <label className={styles.formField}>
              <span>Telefone</span>
              <input
                value={formatPhone(form.phone)}
                onChange={(event) => updateField('phone', onlyDigits(event.target.value).slice(0, 11))}
                placeholder="(11) 90000-0000"
                inputMode="tel"
                maxLength={15}
                pattern="\(\d{2}\) \d{4,5}-\d{4}"
              />
            </label>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.sectionKicker}>Endereço</span>
            <h2>Contato e residência</h2>
            <p>O endereço ajuda em análises antifraude e disputas de recompensas.</p>
          </div>

          <div className={styles.formGrid}>
            <label className={`${styles.formField} ${styles.full}`}>
              <span>Endereço</span>
              <input value={form.addressLine} onChange={(event) => updateField('addressLine', event.target.value)} placeholder="Rua, número e complemento" />
            </label>
            <label className={styles.formField}>
              <span>Cidade</span>
              <input value={form.addressCity} onChange={(event) => updateField('addressCity', event.target.value)} />
            </label>
            <label className={styles.formField}>
              <span>Estado</span>
              <input value={form.addressState} onChange={(event) => updateField('addressState', event.target.value)} placeholder="SP" />
            </label>
            <label className={styles.formField}>
              <span>CEP</span>
              <input value={form.addressPostalCode} onChange={(event) => updateField('addressPostalCode', event.target.value)} />
            </label>
          </div>
        </section>

        <section className={styles.draftBar}>
          <div>
            <strong>Dados pessoais e endereço</strong>
            <span>Salve um rascunho enquanto separa os documentos. O envio para análise fica no final do formulário, junto com os arquivos.</span>
          </div>
          <div>
            <button type="button" className={styles.secondaryAction} onClick={() => saveVerification(false)} disabled={saving || Boolean(activeUpload)}>
              Salvar dados
            </button>
          </div>
        </section>

        <section className={`${styles.panel} ${styles.documentsPanel}`}>
          <div className={styles.panelHeader}>
            <span className={styles.sectionKicker}>Documentos</span>
            <h2>Arquivos para análise</h2>
            <p>Envie imagens ou PDFs legíveis. A frente do documento é obrigatória; verso e comprovante ajudam a acelerar a revisão.</p>
          </div>

          <div className={styles.uploadGrid}>
            <UploadField
              title="Frente do documento"
              description="RG, CNH ou passaporte em imagem ou PDF"
              value={form.documentFrontUrl}
              onChange={(value) => updateField('documentFrontUrl', value)}
              active={activeUpload === 'documentFrontUrl'}
              onUpload={(file) => uploadFor('documentFrontUrl', file)}
            />
            <UploadField
              title="Verso do documento"
              description="Imagem ou PDF quando o documento tiver verso"
              value={form.documentBackUrl}
              onChange={(value) => updateField('documentBackUrl', value)}
              active={activeUpload === 'documentBackUrl'}
              onUpload={(file) => uploadFor('documentBackUrl', file)}
            />
            <UploadField
              title="Comprovante de endereço"
              description="Conta de consumo ou documento recente em imagem ou PDF"
              value={form.proofOfAddressUrl}
              onChange={(value) => updateField('proofOfAddressUrl', value)}
              active={activeUpload === 'proofOfAddressUrl'}
              onUpload={(file) => uploadFor('proofOfAddressUrl', file)}
            />
          </div>

          <label className={styles.consentBox}>
            <input
              type="checkbox"
              checked={form.consentAccepted}
              onChange={(event) => updateField('consentAccepted', event.target.checked)}
            />
            <span>Confirmo que os dados são verdadeiros e autorizo a Hivelancers a analisar essas informações para segurança, prevenção de abuso e liberação de benefícios.</span>
          </label>

          <div className={styles.submitRow}>
            <button type="button" className={styles.secondaryAction} onClick={loadVerification} disabled={loading}>
              <FaRotateRight /> Atualizar
            </button>
            <button type="submit" className={styles.primaryAction} disabled={saving || Boolean(activeUpload)}>
              {saving ? 'Enviando...' : 'Enviar tudo para análise'} <FaArrowRight />
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}

export default AccountVerification;
