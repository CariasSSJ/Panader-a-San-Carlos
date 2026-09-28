import React, { useEffect, useState } from 'react';

export const ModalDialog = ({
  isOpen,
  type = 'confirm',
  title = '',
  message = '',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  defaultValue = '',
  inputLabel = '',
  placeholder = '',
  onConfirm = () => {},
  onCancel = () => {},
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'input') {
      onConfirm(inputValue);
      return;
    }

    onConfirm();
  };

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-dialog-title"
        style={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.header}>
          <h3 id="modal-dialog-title" style={styles.title}>{title}</h3>
          <button type="button" style={styles.closeButton} onClick={onCancel} aria-label="Cerrar diálogo">
            ×
          </button>
        </div>

        <div style={styles.body}>
          {message && <p style={styles.message}>{message}</p>}

          {type === 'input' && (
            <div style={styles.fieldGroup}>
              {inputLabel && <label style={styles.label}>{inputLabel}</label>}
              <input
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={placeholder}
                style={styles.input}
                autoFocus
              />
            </div>
          )}
        </div>

        <div style={styles.footer}>
          {cancelText && (
            <button type="button" style={styles.secondaryButton} onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button type="button" style={styles.primaryButton} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 1000,
  },
  modal: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '1.1rem 1.25rem',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  title: {
    margin: 0,
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  closeButton: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: '1.6rem',
    lineHeight: 1,
    cursor: 'pointer',
    padding: 0,
  },
  body: {
    padding: '1.25rem',
  },
  message: {
    margin: 0,
    color: '#334155',
    fontSize: '0.96rem',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#475569',
  },
  input: {
    width: '100%',
    padding: '0.7rem 0.8rem',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    padding: '0 1.25rem 1.25rem',
  },
  primaryButton: {
    border: 'none',
    borderRadius: '10px',
    padding: '0.7rem 1rem',
    background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.25)',
  },
  secondaryButton: {
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '0.7rem 1rem',
    backgroundColor: '#ffffff',
    color: '#334155',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
