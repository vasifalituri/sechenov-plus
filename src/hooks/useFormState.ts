import { useState, useCallback } from 'react';

interface UseFormStateOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useFormState<T extends Record<string, any>>(
  initialValues: T,
  options: UseFormStateOptions = {}
) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setFormData(initialValues);
    setError('');
    setSuccess(false);
    setIsLoading(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (
    submitFn: (data: T) => Promise<any>
  ) => {
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await submitFn(formData);
      setSuccess(true);
      options.onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formData, options]);

  return {
    formData,
    isLoading,
    error,
    success,
    updateField,
    updateFields,
    reset,
    handleSubmit,
    setError,
    setSuccess,
  };
}
