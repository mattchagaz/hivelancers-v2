import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import styles from './CreateService.module.css';
import { listCategories, createService, getMyService, updateService, archiveService } from '../../../services/services';
import { uploadImageToCloudinary } from '../../../services/cloudinary';

const TIER_BY_INDEX = ['BASIC', 'STANDARD', 'PREMIUM'];
const TIER_NAME = { BASIC: 'Básico', STANDARD: 'Padrão', PREMIUM: 'Premium' };

const featuresFromDescription = (desc = '') =>
  desc
    .split('\n')
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean);

function CreateService() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditMode = Boolean(editId);
  const fileInputRef = useRef(null);
  const [step, setStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isArchiving, setIsArchiving] = useState(false);
  const [existingStatus, setExistingStatus] = useState(null);

  // Step 0 — Info básica
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Step 1 — Planos de preço
  const [plans, setPlans] = useState([
    { name: 'Básico', price: '', delivery: '', revisions: '', features: [''] },
    { name: 'Padrão', price: '', delivery: '', revisions: '', features: [''] },
    { name: 'Premium', price: '', delivery: '', revisions: '', features: [''] },
  ]);
  const [activePlans, setActivePlans] = useState([true, true, true]);

  // Step 2 — Portfólio
  const [images, setImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Step 3 — FAQ
  const [faqs, setFaqs] = useState([{ question: '', answer: '' }]);

  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoadingCats(false));
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    (async () => {
      try {
        const svc = await getMyService(editId);
        if (cancelled) return;
        setTitle(svc.title || '');
        setDescription(svc.description || '');
        setCategory(svc.categoryId || '');
        setExistingStatus(svc.status || 'DRAFT');

        const loadedPlans = [...plans];
        const loadedActive = [false, false, false];
        (svc.plans || []).forEach((p) => {
          const idx = TIER_BY_INDEX.indexOf(p.tier);
          if (idx === -1) return;
          loadedActive[idx] = true;
          const feats = featuresFromDescription(p.description);
          loadedPlans[idx] = {
            name: p.title || TIER_NAME[p.tier],
            price: p.priceCents != null ? (p.priceCents / 100).toString() : '',
            delivery: p.deliveryDays?.toString() || '',
            revisions: p.revisions?.toString() || '',
            features: feats.length > 0 ? feats : [''],
          };
        });
        setPlans(loadedPlans);
        setActivePlans(loadedActive);

        const loadedImgs = (svc.images || []).map((img) => ({
          url: img.url,
          preview: img.url,
          name: '',
        }));
        setImages(loadedImgs);
      } catch (err) {
        toast.error(err.message);
        navigate('/dashboard');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isEditMode, editId]);

  const steps = [
    { label: 'Informações', desc: 'Título, descrição e categoria' },
    { label: 'Preços', desc: 'Planos e entregas' },
    { label: 'Portfólio', desc: 'Imagens do trabalho' },
    { label: 'Revisão', desc: 'Confirme e publique' },
  ];

  const selectedCat = categories.find((c) => c.id === category);

  // ===== Tag handlers =====
  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(',', '');
      if (tag && !tags.includes(tag) && tags.length < 5) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    }
  };
  const removeTag = (idx) => setTags(tags.filter((_, i) => i !== idx));

  // ===== Plan handlers =====
  const updatePlan = (planIdx, field, value) => {
    const updated = [...plans];
    updated[planIdx] = { ...updated[planIdx], [field]: value };
    setPlans(updated);
  };

  const updateFeature = (planIdx, featIdx, value) => {
    const updated = [...plans];
    const feats = [...updated[planIdx].features];
    feats[featIdx] = value;
    updated[planIdx] = { ...updated[planIdx], features: feats };
    setPlans(updated);
  };

  const addFeature = (planIdx) => {
    const updated = [...plans];
    if (updated[planIdx].features.length < 6) {
      updated[planIdx] = { ...updated[planIdx], features: [...updated[planIdx].features, ''] };
      setPlans(updated);
    }
  };

  const removeFeature = (planIdx, featIdx) => {
    const updated = [...plans];
    updated[planIdx] = {
      ...updated[planIdx],
      features: updated[planIdx].features.filter((_, i) => i !== featIdx),
    };
    setPlans(updated);
  };

  // ===== Image handlers =====
  const handleFiles = async (files) => {
    const remaining = 6 - images.length;
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining);
    if (picked.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await Promise.all(
        picked.map(async (file) => {
          const { url } = await uploadImageToCloudinary(file);
          return { url, preview: url, name: file.name };
        })
      );
      setImages((prev) => [...prev, ...uploaded].slice(0, 6));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (idx) => setImages(images.filter((_, i) => i !== idx));
  const setCover = (idx) => {
    const moved = [...images];
    const [item] = moved.splice(idx, 1);
    moved.unshift(item);
    setImages(moved);
  };

  // ===== FAQ handlers =====
  const updateFaq = (idx, field, value) => {
    const updated = [...faqs];
    updated[idx] = { ...updated[idx], [field]: value };
    setFaqs(updated);
  };
  const addFaq = () => {
    if (faqs.length < 5) setFaqs([...faqs, { question: '', answer: '' }]);
  };
  const removeFaq = (idx) => setFaqs(faqs.filter((_, i) => i !== idx));

  // ===== Validation =====
  const validateStep = (s) => {
    if (s === 0) {
      if (!title.trim()) { toast.error('Dê um título ao seu serviço.'); return false; }
      if (title.trim().length < 10) { toast.error('O título precisa ter pelo menos 10 caracteres.'); return false; }
      if (!description.trim() || description.trim().length < 30) { toast.error('A descrição precisa ter pelo menos 30 caracteres.'); return false; }
      if (!category) { toast.error('Selecione uma categoria.'); return false; }
      return true;
    }
    if (s === 1) {
      const active = plans.filter((_, i) => activePlans[i]);
      if (active.length === 0) { toast.error('Ative pelo menos um plano de preço.'); return false; }
      for (const p of active) {
        if (!p.price || isNaN(p.price) || Number(p.price) <= 0) { toast.error(`Defina um preço válido para o plano "${p.name}".`); return false; }
        if (!p.delivery) { toast.error(`Defina o prazo de entrega do plano "${p.name}".`); return false; }
      }
      return true;
    }
    if (s === 2) {
      if (uploading) { toast.error('Aguarde o upload das imagens terminar.'); return false; }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };
  const goBack = () => setStep(step - 1);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const planPayload = plans
        .map((p, i) => ({ p, i }))
        .filter(({ i }) => activePlans[i])
        .map(({ p, i }) => {
          const feats = p.features.map((f) => f.trim()).filter(Boolean);
          const description = feats.length > 0 ? feats.map((f) => `• ${f}`).join('\n') : p.name;
          return {
            tier: TIER_BY_INDEX[i],
            title: p.name.trim() || TIER_BY_INDEX[i],
            description,
            priceCents: Math.round(Number(p.price) * 100),
            deliveryDays: Number(p.delivery),
            revisions: p.revisions === '' ? 1 : Number(p.revisions),
          };
        });

      const basePayload = {
        title: title.trim(),
        description: description.trim(),
        categoryId: category,
        plans: planPayload,
        images: images.map((img) => ({ url: img.url })),
      };

      if (isEditMode) {
        await updateService(editId, basePayload);
        toast.success('Serviço atualizado com sucesso!');
        setTimeout(() => navigate(`/services/${editId}`), 800);
      } else {
        await createService({ ...basePayload, status: 'PUBLISHED' });
        toast.success('Serviço publicado com sucesso!');
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const doArchive = async () => {
    setIsArchiving(true);
    try {
      await archiveService(editId);
      toast.success('Serviço arquivado.');
      setTimeout(() => navigate('/dashboard'), 600);
    } catch (err) {
      toast.error(err.message);
      setIsArchiving(false);
    }
  };

  const handleArchive = () => {
    if (!isEditMode || isArchiving) return;
    toast('Arquivar este serviço?', {
      description: 'Ele deixará de aparecer na listagem pública. Você pode republicar depois.',
      duration: 8000,
      action: { label: 'Arquivar', onClick: doArchive },
      cancel: { label: 'Cancelar', onClick: () => {} },
    });
  };

  const handleRepublish = async () => {
    if (!isEditMode || isArchiving) return;
    setIsArchiving(true);
    try {
      const svc = await updateService(editId, { status: 'PUBLISHED' });
      setExistingStatus(svc.status || 'PUBLISHED');
      toast.success('Serviço republicado.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  // ===== Character counter helper =====
  const charCount = (val, max) => (
    <span className={`${styles.charCount} ${val.length > max ? styles.charOver : ''}`}>
      {val.length}/{max}
    </span>
  );

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>Carregando serviço...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ===== Header ===== */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>{isEditMode ? 'Editar serviço' : 'Criar novo serviço'}</h1>
          <p className={styles.pageSub}>
            {isEditMode
              ? 'Atualize as informações do seu serviço. As alterações ficam visíveis imediatamente.'
              : 'Preencha as informações para publicar seu serviço na plataforma.'}
          </p>
        </div>
        {isEditMode && existingStatus !== 'ARCHIVED' && (
          <button
            type="button"
            className={styles.backBtn}
            onClick={handleArchive}
            disabled={isArchiving}
            style={{ color: '#b91c1c', borderColor: '#fecaca' }}
          >
            {isArchiving ? 'Arquivando...' : 'Arquivar serviço'}
          </button>
        )}
        {isEditMode && existingStatus === 'ARCHIVED' && (
          <button
            type="button"
            className={styles.backBtn}
            onClick={handleRepublish}
            disabled={isArchiving}
            style={{ color: '#047857', borderColor: '#a7f3d0' }}
          >
            {isArchiving ? 'Republicando...' : 'Republicar serviço'}
          </button>
        )}
      </div>

      {/* ===== Stepper ===== */}
      <div className={styles.stepper}>
        {steps.map((s, i) => (
          <div key={i} className={`${styles.stepItem} ${i === step ? styles.stepActive : ''} ${i < step ? styles.stepDone : ''}`}>
            <div className={styles.stepCircle}>
              {i < step ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <div className={styles.stepText}>
              <span className={styles.stepLabel}>{s.label}</span>
              <span className={styles.stepDesc}>{s.desc}</span>
            </div>
            {i < steps.length - 1 && <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />}
          </div>
        ))}
      </div>

      {/* ===== Content ===== */}
      <div className={styles.body}>
        {/* ========== STEP 0: Info ========== */}
        {step === 0 && (
          <div className={styles.stepContent} key="s0">
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Informações básicas</h2>
              <p className={styles.sectionSub}>Descreva seu serviço de forma clara e atrativa.</p>

              <div className={styles.field}>
                <label className={styles.label}>
                  Título do serviço {charCount(title, 80)}
                </label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder='Ex: "Crio logos profissionais e identidade visual completa"'
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                />
                <span className={styles.hint}>Seja específico e descritivo — títulos claros atraem mais clientes.</span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Descrição {charCount(description, 1200)}
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder="Descreva detalhadamente o que você entrega, seu processo de trabalho, diferenciais e experiência..."
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1200))}
                />
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Categoria</h2>

              <div className={styles.catGrid}>
                {loadingCats && <span className={styles.hint}>Carregando...</span>}
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`${styles.catCard} ${category === cat.id ? styles.catActive : ''}`}
                    onClick={() => { setCategory(cat.id); setSubCategory(''); }}
                  >
                    <span className={styles.catIcon}>{cat.icon || '📦'}</span>
                    <span className={styles.catLabel}>{cat.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Tags</h2>
              <p className={styles.sectionSub}>Adicione até 5 tags para seu serviço ser encontrado mais facilmente.</p>
              <div className={styles.tagInputWrap}>
                {tags.map((tag, i) => (
                  <span key={i} className={styles.tag}>
                    {tag}
                    <button type="button" className={styles.tagRemove} onClick={() => removeTag(i)}>×</button>
                  </span>
                ))}
                {tags.length < 5 && (
                  <input
                    className={styles.tagInput}
                    type="text"
                    placeholder={tags.length === 0 ? 'Digite e pressione Enter...' : 'Adicionar tag...'}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                  />
                )}
              </div>
            </section>
          </div>
        )}

        {/* ========== STEP 1: Pricing ========== */}
        {step === 1 && (
          <div className={styles.stepContent} key="s1">
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Planos de preço</h2>
              <p className={styles.sectionSub}>Defina até 3 planos com entregas e prazos diferentes. Desative os que não quiser usar.</p>

              <div className={styles.plansGrid}>
                {plans.map((plan, pi) => (
                  <div key={pi} className={`${styles.planCard} ${!activePlans[pi] ? styles.planDisabled : ''} ${pi === 1 ? styles.planFeatured : ''}`}>
                    {pi === 1 && activePlans[pi] && <div className={styles.planPopular}>Mais popular</div>}

                    <div className={styles.planHeader}>
                      <div className={styles.planNameRow}>
                        <input
                          className={styles.planNameInput}
                          value={plan.name}
                          onChange={(e) => updatePlan(pi, 'name', e.target.value)}
                          placeholder="Nome do plano"
                          disabled={!activePlans[pi]}
                        />
                        <label className={styles.toggle}>
                          <input
                            type="checkbox"
                            checked={activePlans[pi]}
                            onChange={() => {
                              const a = [...activePlans];
                              a[pi] = !a[pi];
                              setActivePlans(a);
                            }}
                          />
                          <span className={styles.toggleTrack} />
                        </label>
                      </div>
                    </div>

                    {activePlans[pi] && (
                      <div className={styles.planBody}>
                        <div className={styles.field}>
                          <label className={styles.labelSm}>Preço (R$)</label>
                          <div className={styles.priceInput}>
                            <span className={styles.pricePrefix}>R$</span>
                            <input
                              className={styles.input}
                              type="number"
                              placeholder="0,00"
                              value={plan.price}
                              onChange={(e) => updatePlan(pi, 'price', e.target.value)}
                              style={{ paddingLeft: '40px' }}
                            />
                          </div>
                        </div>

                        <div className={styles.planRow}>
                          <div className={styles.field}>
                            <label className={styles.labelSm}>Prazo (dias)</label>
                            <input
                              className={styles.input}
                              type="number"
                              placeholder="7"
                              value={plan.delivery}
                              onChange={(e) => updatePlan(pi, 'delivery', e.target.value)}
                            />
                          </div>
                          <div className={styles.field}>
                            <label className={styles.labelSm}>Revisões</label>
                            <input
                              className={styles.input}
                              type="number"
                              placeholder="2"
                              value={plan.revisions}
                              onChange={(e) => updatePlan(pi, 'revisions', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className={styles.field}>
                          <label className={styles.labelSm}>O que está incluído</label>
                          {plan.features.map((feat, fi) => (
                            <div key={fi} className={styles.featureRow}>
                              <svg className={styles.featureCheck} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                              <input
                                className={styles.featureInput}
                                type="text"
                                placeholder={`Entrega ${fi + 1}`}
                                value={feat}
                                onChange={(e) => updateFeature(pi, fi, e.target.value)}
                              />
                              {plan.features.length > 1 && (
                                <button type="button" className={styles.featureRemove} onClick={() => removeFeature(pi, fi)}>×</button>
                              )}
                            </div>
                          ))}
                          {plan.features.length < 6 && (
                            <button type="button" className={styles.addFeatureBtn} onClick={() => addFeature(pi)}>
                              + Adicionar entrega
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ========== STEP 2: Portfolio ========== */}
        {step === 2 && (
          <div className={styles.stepContent} key="s2">
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Portfólio</h2>
              <p className={styles.sectionSub}>Adicione até 6 imagens que demonstrem a qualidade do seu trabalho. A primeira será a imagem de capa.</p>

              <div
                className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className={styles.fileInput}
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className={styles.dropIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <span className={styles.dropTitle}>
                  {uploading ? 'Enviando imagens...' : 'Arraste imagens aqui ou clique para selecionar'}
                </span>
                <span className={styles.dropSub}>PNG, JPG ou WEBP — máximo 6 imagens</span>
              </div>

              {images.length > 0 && (
                <div className={styles.imageGrid}>
                  {images.map((img, i) => (
                    <div key={i} className={`${styles.imageCard} ${i === 0 ? styles.imageCover : ''}`}>
                      <img src={img.preview} alt={img.name} className={styles.imagePreview} />
                      {i === 0 && <span className={styles.coverBadge}>Capa</span>}
                      <div className={styles.imageOverlay}>
                        {i !== 0 && (
                          <button type="button" className={styles.imageBtn} onClick={() => setCover(i)} title="Definir como capa">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                          </button>
                        )}
                        <button type="button" className={`${styles.imageBtn} ${styles.imageBtnDanger}`} onClick={() => removeImage(i)} title="Remover">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Perguntas frequentes <span className={styles.optional}>(opcional)</span></h2>
              <p className={styles.sectionSub}>Antecipe as dúvidas dos clientes.</p>

              {faqs.map((faq, i) => (
                <div key={i} className={styles.faqItem}>
                  <div className={styles.faqHeader}>
                    <span className={styles.faqNum}>FAQ {i + 1}</span>
                    {faqs.length > 1 && (
                      <button type="button" className={styles.faqRemove} onClick={() => removeFaq(i)}>Remover</button>
                    )}
                  </div>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Pergunta"
                    value={faq.question}
                    onChange={(e) => updateFaq(i, 'question', e.target.value)}
                  />
                  <textarea
                    className={styles.textarea}
                    placeholder="Resposta"
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                  />
                </div>
              ))}
              {faqs.length < 5 && (
                <button type="button" className={styles.addFaqBtn} onClick={addFaq}>
                  + Adicionar pergunta
                </button>
              )}
            </section>
          </div>
        )}

        {/* ========== STEP 3: Review ========== */}
        {step === 3 && (
          <div className={styles.stepContent} key="s3">
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Revise seu serviço</h2>
              <p className={styles.sectionSub}>Confira todas as informações antes de publicar.</p>

              {/* Preview card */}
              <div className={styles.previewCard}>
                {images.length > 0 && (
                  <img src={images[0].preview} alt="Capa" className={styles.previewImg} />
                )}
                <div className={styles.previewBody}>
                  <div className={styles.previewMeta}>
                    <span className={styles.previewCat}>
                      {selectedCat?.icon || '📦'} {selectedCat?.name}
                      {subCategory && ` — ${subCategory}`}
                    </span>
                  </div>
                  <h3 className={styles.previewTitle}>{title || 'Sem título'}</h3>
                  <p className={styles.previewDesc}>{description || 'Sem descrição'}</p>

                  {tags.length > 0 && (
                    <div className={styles.previewTags}>
                      {tags.map((t, i) => (
                        <span key={i} className={styles.previewTag}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Plans summary */}
              <h3 className={styles.reviewSubtitle}>Planos de preço</h3>
              <div className={styles.reviewPlans}>
                {plans.map((plan, pi) =>
                  activePlans[pi] ? (
                    <div key={pi} className={styles.reviewPlan}>
                      <span className={styles.reviewPlanName}>{plan.name}</span>
                      <span className={styles.reviewPlanPrice}>R$ {plan.price || '0'}</span>
                      <span className={styles.reviewPlanMeta}>
                        {plan.delivery ? `${plan.delivery} dias` : '—'} · {plan.revisions || '0'} revisões
                      </span>
                      <div className={styles.reviewFeats}>
                        {plan.features.filter(Boolean).map((f, fi) => (
                          <div key={fi} className={styles.reviewFeat}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </div>

              {/* Images summary */}
              {images.length > 0 && (
                <>
                  <h3 className={styles.reviewSubtitle}>Portfólio ({images.length} imagens)</h3>
                  <div className={styles.reviewImages}>
                    {images.map((img, i) => (
                      <img key={i} src={img.preview} alt="" className={styles.reviewThumb} />
                    ))}
                  </div>
                </>
              )}

              {/* FAQs summary */}
              {faqs.some((f) => f.question && f.answer) && (
                <>
                  <h3 className={styles.reviewSubtitle}>Perguntas frequentes</h3>
                  <div className={styles.reviewFaqs}>
                    {faqs
                      .filter((f) => f.question && f.answer)
                      .map((f, i) => (
                        <div key={i} className={styles.reviewFaq}>
                          <span className={styles.reviewFaqQ}>{f.question}</span>
                          <span className={styles.reviewFaqA}>{f.answer}</span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>

      {/* ===== Footer Navigation ===== */}
      <div className={styles.footer}>
        <div className={styles.footerInner}>
          {step > 0 ? (
            <button type="button" className={styles.backBtn} onClick={goBack}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              Voltar
            </button>
          ) : (
            <div />
          )}

          <div className={styles.footerRight}>
            <span className={styles.footerStep}>Passo {step + 1} de {steps.length}</span>
            {step < 3 ? (
              <button type="button" className={styles.nextBtn} onClick={goNext}>
                Continuar
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </button>
            ) : (
              <button
                type="button"
                className={styles.publishBtn}
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <span className={styles.spinner} />
                ) : (
                  <>
                    {isEditMode ? 'Salvar alterações' : 'Publicar serviço'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default CreateService;