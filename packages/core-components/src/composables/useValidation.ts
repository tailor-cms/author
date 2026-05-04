import { inject, onScopeDispose, provide, ref } from 'vue';

type ValidateFn = () => Promise<{ valid: boolean }>;
type ResetFn = () => void;

interface RegisteredValidator {
  validate: ValidateFn;
  reset?: ResetFn;
}

interface ValidationRegistry {
  register: (id: string, validator: RegisteredValidator) => void;
  unregister: (id: string) => void;
}

const VALIDATION_KEY = '$validationRegistry';

// Provider (parent) - like vee-validate's useForm
export function useValidationProvider() {
  const validators = ref(new Map<string, RegisteredValidator>());

  const registry: ValidationRegistry = {
    register: (id, validator) => validators.value.set(id, validator),
    unregister: (id) => validators.value.delete(id),
  };

  provide(VALIDATION_KEY, registry);

  const validate = async () => {
    const results = await Promise.all(
      [...validators.value.values()].map(({ validate }) => validate()),
    );
    return { valid: results.every((r) => r.valid) };
  };

  const reset = () => {
    validators.value.forEach(({ reset }) => reset?.());
  };

  return { validate, reset };
}

export function useValidation(
  id: string,
  validateFn: ValidateFn,
  resetFn?: ResetFn,
) {
  const registry = inject<ValidationRegistry | null>(VALIDATION_KEY, null);
  if (!registry) return;
  registry.register(id, { validate: validateFn, reset: resetFn });
  onScopeDispose(() => registry.unregister(id));
}
