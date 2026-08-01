import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCircleCheck, FaLightbulb } from 'react-icons/fa6';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import { createProject } from '../../../services/projects';
import { listCategories } from '../../../services/services';
import styles from './CreateProject.module.css';

const initialForm = {
  title: '',
  description: '',
  categoryId: '',
  budgetType: 'RANGE',
  budgetMin: '',
  budgetMax: '',
  deadline: '',
  skills: '',
  referenceUrls: '',
};

const toCents = (value) => Math.round(Number(String(value).replace(',', '.')) * 100);

function CreateProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listCategories().then(setCategories).catch((error) => toast.error(error.message));
  }, []);

  const skills = useMemo(
    () => form.skills.split(',').map((item) => item.trim()).filter(Boolean),
    [form.skills]
  );

  const update = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'budgetType' && value === 'FIXED'
        ? { budgetMax: current.budgetMin }
        : {}),
      ...(field === 'budgetMin' && current.budgetType === 'FIXED'
        ? { budgetMax: value }
        : {}),
    }));
  };

  const submit = async (event, status) => {
    event.preventDefault();
    if (submitting) return;

    const budgetMinCents = toCents(form.budgetMin);
    const budgetMaxCents = form.budgetType === 'FIXED'
      ? budgetMinCents
      : toCents(form.budgetMax);

    if (!Number.isFinite(budgetMinCents) || !Number.isFinite(budgetMaxCents)) {
      toast.error('Informe um orçamento válido.');
      return;
    }

    setSubmitting(true);
    try {
      const project = await createProject({
        title: form.title,
        description: form.description,
        categoryId: form.categoryId || null,
        budgetType: form.budgetType,
        budgetMinCents,
        budgetMaxCents,
        deadline: form.deadline ? new Date(`${form.deadline}T12:00:00`).toISOString() : null,
        skills,
        referenceUrls: form.referenceUrls
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        status,
      });
      toast.success(status === 'OPEN' ? 'Projeto publicado com sucesso.' : 'Rascunho salvo.');
      navigate(status === 'OPEN' ? `/projects/${project.id}` : '/projects/mine');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.userType !== 'CLIENT') {
    return (
      <div className={styles.restricted}>
        <FaLightbulb />
        <h1>Publicação disponível para clientes</h1>
        <p>Troque o tipo da conta ou entre com uma conta de cliente para publicar um projeto.</p>
        <Link to="/projects">Explorar projetos</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/projects/mine" className={styles.back}><FaArrowLeft /> Meus projetos</Link>

      <section className={styles.heading}>
        <span>Nova oportunidade</span>
        <h1>Conte o que você precisa realizar.</h1>
        <p>Um briefing claro atrai propostas melhores e reduz retrabalho durante a execução.</p>
      </section>

      <form className={styles.layout} onSubmit={(event) => submit(event, 'OPEN')}>
        <main className={styles.formCard}>
          <section>
            <div className={styles.sectionTitle}>
              <span>1</span>
              <div>
                <h2>Resumo do projeto</h2>
                <p>Explique o resultado esperado, não apenas a tarefa.</p>
              </div>
            </div>

            <label>
              Título
              <input
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                placeholder="Ex: Criar identidade visual e landing page"
                minLength={5}
                maxLength={140}
                required
              />
              <small>{form.title.length}/140</small>
            </label>

            <label>
              Descrição e entregáveis
              <textarea
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                placeholder="Contexto do negócio, objetivo, público, entregáveis esperados, referências e critérios de aprovação."
                minLength={40}
                maxLength={8000}
                rows={9}
                required
              />
              <small>{form.description.length}/8000</small>
            </label>
          </section>

          <section>
            <div className={styles.sectionTitle}>
              <span>2</span>
              <div>
                <h2>Área e habilidades</h2>
                <p>Ajude os profissionais certos a encontrar sua oportunidade.</p>
              </div>
            </div>

            <label>
              Categoria
              <select value={form.categoryId} onChange={(event) => update('categoryId', event.target.value)}>
                <option value="">Projeto multidisciplinar</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>

            <label>
              Habilidades desejadas
              <input
                value={form.skills}
                onChange={(event) => update('skills', event.target.value)}
                placeholder="Ex: Figma, React, Copywriting"
              />
              <small>Separe por vírgulas. Até 15 habilidades.</small>
            </label>

            {skills.length > 0 && (
              <div className={styles.chips}>
                {skills.slice(0, 15).map((skill) => <span key={skill}>{skill}</span>)}
              </div>
            )}
          </section>

          <section>
            <div className={styles.sectionTitle}>
              <span>3</span>
              <div>
                <h2>Orçamento e prazo</h2>
                <p>Esses dados ajudam o freelancer a preparar uma proposta viável.</p>
              </div>
            </div>

            <div className={styles.budgetType}>
              <button
                type="button"
                className={form.budgetType === 'RANGE' ? styles.selected : ''}
                onClick={() => update('budgetType', 'RANGE')}
              >
                Faixa de orçamento
              </button>
              <button
                type="button"
                className={form.budgetType === 'FIXED' ? styles.selected : ''}
                onClick={() => update('budgetType', 'FIXED')}
              >
                Valor fixo
              </button>
            </div>

            <div className={styles.twoColumns}>
              <label>
                {form.budgetType === 'FIXED' ? 'Valor do projeto' : 'Orçamento mínimo'}
                <div className={styles.moneyInput}>
                  <span>R$</span>
                  <input
                    type="number"
                    min="10"
                    step="0.01"
                    value={form.budgetMin}
                    onChange={(event) => update('budgetMin', event.target.value)}
                    placeholder="1.000,00"
                    required
                  />
                </div>
              </label>

              {form.budgetType === 'RANGE' && (
                <label>
                  Orçamento máximo
                  <div className={styles.moneyInput}>
                    <span>R$</span>
                    <input
                      type="number"
                      min="10"
                      step="0.01"
                      value={form.budgetMax}
                      onChange={(event) => update('budgetMax', event.target.value)}
                      placeholder="3.000,00"
                      required
                    />
                  </div>
                </label>
              )}

              <label>
                Prazo desejado
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={form.deadline}
                  onChange={(event) => update('deadline', event.target.value)}
                />
              </label>
            </div>
          </section>

          <section>
            <div className={styles.sectionTitle}>
              <span>4</span>
              <div>
                <h2>Referências</h2>
                <p>Links são opcionais e ficam visíveis no projeto publicado.</p>
              </div>
            </div>

            <label>
              Links de referência
              <textarea
                value={form.referenceUrls}
                onChange={(event) => update('referenceUrls', event.target.value)}
                placeholder={'https://exemplo.com/referencia\nhttps://figma.com/...'}
                rows={4}
              />
              <small>Um link completo por linha. Até 10 links.</small>
              <small>Não publique dados pessoais, senhas ou materiais confidenciais.</small>
            </label>
          </section>
        </main>

        <aside className={styles.side}>
          <div className={styles.summary}>
            <span>Antes de publicar</span>
            <h2>Um bom briefing contém:</h2>
            <ul>
              <li><FaCircleCheck /> Objetivo e contexto</li>
              <li><FaCircleCheck /> Entregáveis esperados</li>
              <li><FaCircleCheck /> Orçamento realista</li>
              <li><FaCircleCheck /> Prazo ou prioridade</li>
              <li><FaCircleCheck /> Referências de qualidade</li>
            </ul>
          </div>

          <button type="submit" className={styles.publish} disabled={submitting}>
            {submitting ? 'Salvando…' : 'Publicar projeto'}
          </button>
          <button
            type="button"
            className={styles.draft}
            disabled={submitting}
            onClick={(event) => submit(event, 'DRAFT')}
          >
            Salvar como rascunho
          </button>
          <p className={styles.notice}>Você poderá editar ou encerrar o projeto depois.</p>
        </aside>
      </form>
    </div>
  );
}

export default CreateProject;
