import { inject, onScopeDispose, provide, ref } from 'vue';

type ValidateFn = () => Promise<{ valid: boolean }>;

interface ValidationRegistry {
  register: (id: string, fn: ValidateFn) => void;
  unregister: (id: string) => void;
}

const VALIDATION_KEY = '$validationRegistry';

// Provider (parent) - like vee-validate's useForm
export function useValidationProvider() {
  const validators = ref(new Map<string, ValidateFn>());

  const registry: ValidationRegistry = {
    register: (id, fn) => validators.value.set(id, fn),
    unregister: (id) => validators.value.delete(id),
  };

  provide(VALIDATION_KEY, registry);

  const validate = async () => {
    const results = await Promise.all(
      [...validators.value.values()].map((fn) => fn()),
    );
    return { valid: results.every((r) => r.valid) };
  };

  return { validate };
}

export function useValidation(id: string, validateFn: ValidateFn) {
  const registry = inject<ValidationRegistry | null>(VALIDATION_KEY, null);
  if (!registry) return;
  registry.register(id, validateFn);
  onScopeDispose(() => registry.unregister(id));
}
