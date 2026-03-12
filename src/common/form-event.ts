const LEGACY_FORM_EVENT_PREFIX = "form-ui:";
const HYDRATED_FORM_EVENT_PREFIX = "xpressui:";

export function getHydratedFormEventName(eventName: string): string {
  if (eventName.startsWith(HYDRATED_FORM_EVENT_PREFIX)) {
    return eventName;
  }
  if (eventName.startsWith(LEGACY_FORM_EVENT_PREFIX)) {
    return `${HYDRATED_FORM_EVENT_PREFIX}${eventName.slice(LEGACY_FORM_EVENT_PREFIX.length)}`;
  }

  return eventName;
}

export function emitAliasedFormEvent(
  emitEvent: (eventName: string, detail: Record<string, any>, cancelable?: boolean) => boolean,
  eventName: string,
  detail: Record<string, any>,
  cancelable: boolean = false,
): boolean {
  const legacyResult = emitEvent(eventName, detail, cancelable);
  const hydratedEventName = getHydratedFormEventName(eventName);

  if (hydratedEventName === eventName) {
    return legacyResult;
  }

  const hydratedResult = emitEvent(hydratedEventName, detail, cancelable);
  return legacyResult && hydratedResult;
}
