type ToastType = 'info' | 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let nextId = 1;

export const useToast = () => {
  const toasts = useState<Toast[]>('toasts', () => []);

  const push = (message: string, type: ToastType = 'info', durationMs = 4000) => {
    const id = nextId++;
    toasts.value = [...toasts.value, { id, message, type }];
    if (import.meta.client) {
      setTimeout(() => {
        toasts.value = toasts.value.filter((t) => t.id !== id);
      }, durationMs);
    }
  };

  const dismiss = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  return { toasts, push, dismiss };
};
