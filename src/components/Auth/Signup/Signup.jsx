import { useState } from 'react';
import styles from './Signup.module.css';
import { toast, Toaster } from 'sonner';
import {
  FaCheck,
  FaTimes,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaArrowLeft,
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../../../services/auth';

function SignupP() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [passwordRules, setPasswordRules] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const navigate = useNavigate();

  const handlePasswordChange = (password) => {
    setPasswordRules({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      setFormData({ ...formData, [name]: formatPhoneNumber(value) });
    } else if (name === 'firstName' || name === 'lastName') {
      setFormData({ ...formData, [name]: formatName(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (name === 'password') handlePasswordChange(value);
  };

  const formatPhoneNumber = (value) => {
    const clean = value.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 10) {
      return clean.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return clean.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const formatName = (value) => {
    return value
      .replace(/[^a-zA-ZÀ-ÿ\s]/g, '')
      .toLowerCase()
      .replace(/\b(\w)/g, (char) => char.toUpperCase());
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Preencha seu nome e sobrenome.');
      return false;
    }
    if (!formData.phone) {
      toast.error('Informe seu telefone.');
      return false;
    }
    const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Telefone inválido. Ex: (11) 99999-9999');
      return false;
    }
    if (!formData.email) {
      toast.error('Informe seu e-mail.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('E-mail inválido.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!Object.values(passwordRules).every(Boolean)) {
      toast.error('A senha não atende todos os requisitos.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem.');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep1()) setStep(2);
  };

  const prevStep = () => setStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      await registerUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      toast.success('Conta criada! Enviamos um código para seu e-mail.');
      setIsFadingOut(true);
      setTimeout(() => {
        navigate(`/verify-otp?email=${encodeURIComponent(formData.email.trim().toLowerCase())}`);
      }, 600);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const allPasswordValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch =
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  return (
    <div className={`${styles.page} ${isFadingOut ? styles.fadeOut : ''}`}>
      {/* Lado esquerdo — branding */}
      <div className={styles.brandSide}>
        <div className={styles.brandContent}>
          <div className={styles.logoMark}>H</div>
          <h1 className={styles.brandTitle}>Hivelancers</h1>
          <p className={styles.brandTagline}>
            Crie sua conta e comece a vender seus serviços ou encontre o profissional ideal para seu projeto.
          </p>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <span className={styles.featureTitle}>Pagamentos seguros</span>
                <span className={styles.featureDesc}>Escrow protege ambas as partes</span>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <span className={styles.featureTitle}>Avaliações reais</span>
                <span className={styles.featureDesc}>Feedback verificado de clientes</span>
              </div>
            </div>
            <div className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </div>
              <div>
                <span className={styles.featureTitle}>Chat em tempo real</span>
                <span className={styles.featureDesc}>Comunique-se direto com clientes</span>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.brandDecor} />
        <div className={styles.brandDecor2} />
      </div>

      {/* Lado direito — formulário */}
      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          {/* Stepper */}
          <div className={styles.stepper}>
            <div className={`${styles.stepDot} ${step >= 1 ? styles.active : ''}`}>
              <span>1</span>
            </div>
            <div className={`${styles.stepLine} ${step >= 2 ? styles.active : ''}`} />
            <div className={`${styles.stepDot} ${step >= 2 ? styles.active : ''}`}>
              <span>2</span>
            </div>
          </div>

          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {step === 1 ? 'Crie sua conta' : 'Defina sua senha'}
            </h2>
            <p className={styles.formSubtitle}>
              {step === 1
                ? 'Preencha seus dados pessoais'
                : 'Escolha uma senha segura para sua conta'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Step 1 — Dados pessoais */}
            {step === 1 && (
              <div className={styles.stepContent} key="step1">
                <div className={styles.row}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="firstName">Nome</label>
                    <div className={styles.inputWrapper}>
                      <FaUser className={styles.inputIcon} />
                      <input
                        id="firstName"
                        type="text"
                        name="firstName"
                        className={styles.input}
                        placeholder="João"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="lastName">Sobrenome</label>
                    <div className={styles.inputWrapper}>
                      <FaUser className={styles.inputIcon} />
                      <input
                        id="lastName"
                        type="text"
                        name="lastName"
                        className={styles.input}
                        placeholder="Silva"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="phone">Telefone</label>
                  <div className={styles.inputWrapper}>
                    <FaPhone className={styles.inputIcon} />
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      className={styles.input}
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="email">E-mail</label>
                  <div className={styles.inputWrapper}>
                    <FaEnvelope className={styles.inputIcon} />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      className={styles.input}
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={nextStep}
                >
                  Continuar
                  <FaArrowRight className={styles.btnIcon} />
                </button>
              </div>
            )}

            {/* Step 2 — Senha */}
            {step === 2 && (
              <div className={styles.stepContent} key="step2">
                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="password">Senha</label>
                  <div className={styles.inputWrapper}>
                    <FaLock className={styles.inputIcon} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={styles.input}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Password rules */}
                <div className={styles.passwordRules}>
                  {[
                    { key: 'minLength', label: 'Mínimo 8 caracteres' },
                    { key: 'hasUppercase', label: 'Uma letra maiúscula' },
                    { key: 'hasLowercase', label: 'Uma letra minúscula' },
                    { key: 'hasNumber', label: 'Um número' },
                    { key: 'hasSpecialChar', label: 'Caractere especial (@$!%*?&)' },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      className={`${styles.rule} ${
                        passwordRules[key] ? styles.ruleValid : styles.ruleInvalid
                      }`}
                    >
                      {passwordRules[key] ? (
                        <FaCheck className={styles.ruleIcon} />
                      ) : (
                        <FaTimes className={styles.ruleIcon} />
                      )}
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label} htmlFor="confirmPassword">
                    Confirmar senha
                  </label>
                  <div className={styles.inputWrapper}>
                    <FaLock className={styles.inputIcon} />
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      className={`${styles.input} ${
                        formData.confirmPassword.length > 0
                          ? passwordsMatch
                            ? styles.inputSuccess
                            : styles.inputError
                          : ''
                      }`}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex={-1}
                    >
                      {showConfirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {formData.confirmPassword.length > 0 && !passwordsMatch && (
                    <span className={styles.errorMsg}>As senhas não coincidem</span>
                  )}
                  {passwordsMatch && (
                    <span className={styles.successMsg}>Senhas coincidem!</span>
                  )}
                </div>

                <div className={styles.btnRow}>
                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={prevStep}
                  >
                    <FaArrowLeft className={styles.btnIcon} />
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isLoading || !allPasswordValid || !passwordsMatch}
                  >
                    {isLoading ? (
                      <span className={styles.spinner} />
                    ) : (
                      'Criar conta'
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <>
                <div className={styles.divider}>
                  <span className={styles.dividerLine} />
                  <span className={styles.dividerText}>ou</span>
                  <span className={styles.dividerLine} />
                </div>

                <button type="button" className={styles.socialBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar com Google
                </button>
              </>
            )}
          </form>

          <p className={styles.footerText}>
            {step === 1 && (
              <>
                Já tem uma conta?{' '}
                <Link className={styles.footerLink} to="/login">
                  Faça login
                </Link>
              </>
            )}
          </p>

          {step === 2 && (
            <p className={styles.termsText}>
              Ao criar sua conta, você concorda com nossos{' '}
              <a href="/terms" className={styles.termsLink}>Termos de Uso</a> e{' '}
              <a href="/privacy" className={styles.termsLink}>Política de Privacidade</a>.
            </p>
          )}
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default SignupP;