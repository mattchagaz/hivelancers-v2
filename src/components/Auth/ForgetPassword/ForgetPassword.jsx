import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import {
  FaArrowLeft,
  FaCheck,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaShieldAlt,
  FaTimes,
} from 'react-icons/fa';
import styles from './ForgetPassword.module.css';
import { forgotPassword, resetPassword } from '../../../services/auth';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

function ForgetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef([]);

  const [rules, setRules] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  useEffect(() => {
    if (step === 2) inputsRef.current[0]?.focus();
  }, [step]);

  const validatePassword = (pwd) => {
    setRules({
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecialChar: /[@$!%*?&]/.test(pwd),
    });
  };

  const handlePasswordChange = (value) => {
    setNewPassword(value);
    validatePassword(value);
  };

  const allRulesValid = Object.values(rules).every(Boolean);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleRequestCode = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Informe um e-mail válido.');
      return;
    }
    setIsLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      toast.success('Se o e-mail existir, enviaremos um código em instantes.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
      toast.error('Digite os 6 dígitos do código.');
      return;
    }
    if (!allRulesValid) {
      toast.error('A senha não atende todos os requisitos.');
      return;
    }
    if (!passwordsMatch) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        code,
        newPassword,
      });
      toast.success('Senha redefinida! Faça login com a nova senha.');
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      toast.error(err.message);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      toast.success('Novo código enviado.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsResending(false);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => `${a}${'*'.repeat(Math.max(b.length, 2))}${c}`);

  return (
    <div className={styles.page}>
      <div className={styles.brandSide}>
        <div className={styles.brandContent}>
          <div className={styles.logoMark}>H</div>
          <h1 className={styles.brandTitle}>Hivelancers</h1>
          <p className={styles.brandTagline}>
            Recupere o acesso à sua conta em poucos segundos, com segurança.
          </p>
          <div className={styles.infoCard}>
            <FaShieldAlt className={styles.infoIcon} />
            <div>
              <span className={styles.infoTitle}>Proteção em primeiro lugar</span>
              <span className={styles.infoDesc}>
                Enviamos um código único para seu e-mail e invalidamos sessões antigas após a redefinição.
              </span>
            </div>
          </div>
        </div>
        <div className={styles.brandDecor} />
        <div className={styles.brandDecor2} />
      </div>

      <div className={styles.formSide}>
        <div className={styles.formContainer}>
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
              {step === 1 ? 'Esqueceu a senha?' : 'Redefina sua senha'}
            </h2>
            <p className={styles.formSubtitle}>
              {step === 1
                ? 'Informe seu e-mail e enviaremos um código para redefinir sua senha.'
                : <>Digite o código enviado para <strong>{maskedEmail}</strong> e crie uma nova senha.</>}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="email">E-mail</label>
                <div className={styles.inputWrapper}>
                  <FaEnvelope className={styles.inputIcon} />
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                {isLoading ? <span className={styles.spinner} /> : 'Enviar código'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Código de verificação</label>
                <div className={styles.otpGroup} onPaste={handlePaste}>
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputsRef.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      className={styles.otpInput}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isLoading}
                    />
                  ))}
                </div>
                <div className={styles.resendRow}>
                  <span className={styles.resendText}>Não recebeu?</span>
                  <button
                    type="button"
                    className={styles.resendBtn}
                    onClick={handleResend}
                    disabled={cooldown > 0 || isResending}
                  >
                    {cooldown > 0
                      ? `Reenviar em ${cooldown}s`
                      : isResending
                      ? 'Enviando...'
                      : 'Reenviar código'}
                  </button>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="newPassword">Nova senha</label>
                <div className={styles.inputWrapper}>
                  <FaLock className={styles.inputIcon} />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    className={styles.input}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

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
                    className={`${styles.rule} ${rules[key] ? styles.ruleValid : styles.ruleInvalid}`}
                  >
                    {rules[key] ? <FaCheck className={styles.ruleIcon} /> : <FaTimes className={styles.ruleIcon} />}
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="confirmPassword">Confirmar nova senha</label>
                <div className={styles.inputWrapper}>
                  <FaLock className={styles.inputIcon} />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    className={`${styles.input} ${
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? styles.inputSuccess
                          : styles.inputError
                        : ''
                    }`}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowConfirm((v) => !v)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <span className={styles.errorMsg}>As senhas não coincidem</span>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={
                  isLoading ||
                  digits.some((d) => !d) ||
                  !allRulesValid ||
                  !passwordsMatch
                }
              >
                {isLoading ? <span className={styles.spinner} /> : 'Redefinir senha'}
              </button>
            </form>
          )}

          <Link to="/login" className={styles.backLink}>
            <FaArrowLeft className={styles.backIcon} />
            Voltar ao login
          </Link>
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  );
}

export default ForgetPassword;
