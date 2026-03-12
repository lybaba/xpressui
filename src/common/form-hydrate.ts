import TFormConfig from './TFormConfig';
import { validatePublicFormConfig } from './public-schema';
import { createFormConfig, TSimpleFormInput } from './form-config-factory';

export type THydratableFormInput = TSimpleFormInput | TFormConfig;

export function hydrateForm(
  container: Element,
  input: THydratableFormInput,
): HTMLElement | null {
  const config = 'fields' in input ? createFormConfig(input) : validatePublicFormConfig(input);
  const existingForm = container.querySelector('form') as HTMLFormElement | null;

  if (!existingForm) {
    return null;
  }

  const element = document.createElement('form-ui') as HTMLElement & {
    initialize?: () => void;
    initialized?: boolean;
    __xpressuiHydrationConfig?: TFormConfig;
  };

  if (config.mode) {
    element.setAttribute('mode', config.mode);
  }
  element.setAttribute('hydrate-existing', 'true');
  element.__xpressuiHydrationConfig = config;
  existingForm.replaceWith(element);
  element.appendChild(existingForm);

  if (
    'initialize' in element &&
    typeof element.initialize === 'function' &&
    !element.initialized
  ) {
    element.initialize();
  }

  return element;
}
