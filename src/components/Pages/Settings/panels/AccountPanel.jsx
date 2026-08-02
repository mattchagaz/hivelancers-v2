import { useState } from 'react';
import { toast } from 'sonner';
import styles from '../Settings.module.css';
import { useAuth } from '../../../../contexts/AuthContext';
import { updateUserType } from '../../../../services/users';
import { toUserType } from '../../../../utils/authFlow';
import { formatPhoneBR } from '../../../../utils/formatters';
import { Field, FormActions, SectionHeader } from '../Settings.ui';

function AccountTypeCard({ userRole }) {
  const { setUser } = useAuth();
  const [selected, setSelected] = useState(userRole);
  const [isSaving, setIsSaving] = useState(false);
  const dirty = selected !== userRole;

  const save = async () => {
    if (!dirty || isSaving) return;
    setIsSaving(true);
    try {
      const updated = await updateUserType(toUserType(selected));
      setUser(updated);
      toast.success('Visão da conta atualizada!');
    } catch (err) {
      toast.error(err.message);
      setSelected(userRole);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.card}>
      <SectionHeader title="Visão da Conta" subtitle="Alterne sua experiência principal dentro da plataforma." />
      <div className={styles.optionGrid}>
        <button type="button" className={`${styles.optionCard} ${selected === 'freelancer' ? styles.optionCardActive : ''}`} onClick={() => setSelected('freelancer')}>
          <div className={styles.optionContent}>
            <strong>Como Freelancer </strong>
            <p>Foco em vender serviços, portfólio e receber pedidos.</p>
          </div>
        </button>
        <button type="button" className={`${styles.optionCard} ${selected === 'client' ? styles.optionCardActive : ''}`} onClick={() => setSelected('client')}>
          <div className={styles.optionContent}>
            <strong>Como Cliente</strong>
            <p>Foco em explorar, contratar talentos e gerenciar projetos.</p>
          </div>
        </button>
      </div>
      <FormActions primaryLabel="Aplicar Mudança" onSave={save} isSaving={isSaving} disabled={!dirty} />
    </section>
  );
}

export default function AccountPanel({ profile, updateProfile, userRole, isSaving, dirty, onSave, onCancel }) {
  return (
    <>
      <AccountTypeCard userRole={userRole} />
      <section className={styles.card}>
        <SectionHeader title="Credenciais" subtitle="Informações sensíveis usadas para login e segurança." />
        <div className={styles.formGrid}>
          <Field label="E-mail de Acesso" hint="Para alterar o e-mail, contate o suporte.">
            <input type="email" className={styles.input} value={profile.email} disabled />
          </Field>
          <Field label="Telefone de Contato">
            <input type="tel" className={styles.input} value={profile.phone} placeholder="(11) 99999-9999" maxLength={16} onChange={(e) => updateProfile('phone', formatPhoneBR(e.target.value))} />
          </Field>
        </div>
        <FormActions onSave={onSave} onCancel={onCancel} isSaving={isSaving} disabled={!dirty} />
      </section>
    </>
  );
}
