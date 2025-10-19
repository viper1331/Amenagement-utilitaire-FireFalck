import React from 'react';
import { IconCheck, IconWarning, IconAlert, IconInfo } from '@pkg/ui';
import { useEditorStore } from '../../state/useEditorStore';

const toneIcon = {
  success: <IconCheck />,
  info: <IconInfo />,
  warning: <IconWarning />,
  danger: <IconAlert />,
} as const;

export const ToastViewport: React.FC = () => {
  const toasts = useEditorStore((state) => state.toasts);
  const removeToast = useEditorStore((state) => state.removeToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-viewport" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tone}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span aria-hidden>{toneIcon[toast.tone]}</span>
            <span>{toast.message}</span>
            <button type="button" className="aui-icon-button" onClick={() => removeToast(toast.id)}>
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
