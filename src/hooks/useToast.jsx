import { useState } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const ToastComponent = () => (
    toast.show ? (
      <div className={`toast toast-${toast.type}`}>
        {toast.message}
      </div>
    ) : null
  );

  return { showToast, ToastComponent };
};
