import type { TFormRuleAppliedDetail } from "./form-dynamic";

export type TFormDebugEventRecord = {
  type: string;
  timestamp: number;
  detail: any;
};

export type TFormDebugRuleRecord = Omit<TFormDebugEventRecord, "type" | "detail"> & {
  type: "form-ui:rule-applied";
  detail: {
    result?: TFormRuleAppliedDetail;
    [key: string]: any;
  };
};

export type TFormDebugObserver = {
  getEvents(): TFormDebugEventRecord[];
  getRuleHistory(): TFormDebugRuleRecord[];
  clear(): void;
  clearRuleHistory(): void;
  detach(): void;
};

export type TFormDebugOptions = {
  maxEvents?: number;
  onEvent?: (event: TFormDebugEventRecord) => void;
};

const DEFAULT_DEBUG_EVENTS = [
  "form-ui:submit",
  "form-ui:submit-success",
  "form-ui:submit-error",
  "form-ui:options-loaded",
  "form-ui:rule-applied",
  "form-ui:draft-saved",
  "form-ui:draft-restored",
  "form-ui:draft-cleared",
  "form-ui:queued",
  "form-ui:queue-state",
  "form-ui:sync-success",
  "form-ui:sync-error",
  "form-ui:dead-lettered",
  "form-ui:dead-letter-cleared",
  "form-ui:dead-letter-requeued",
  "form-ui:dead-letter-replayed-success",
  "form-ui:dead-letter-replayed-error",
  "form-ui:reservation-success",
  "form-ui:payment-success",
  "form-ui:payment-error",
  "form-ui:payment-stripe-success",
  "form-ui:payment-stripe-error",
  "form-ui:webhook-success",
  "form-ui:webhook-error",
  "form-ui:booking-availability-success",
  "form-ui:booking-availability-error",
];

export function attachFormDebugObserver(
  target: EventTarget,
  options: TFormDebugOptions = {},
): TFormDebugObserver {
  const maxEvents = options.maxEvents ?? 100;
  const events: TFormDebugEventRecord[] = [];
  const ruleEvents: TFormDebugRuleRecord[] = [];
  const listeners = DEFAULT_DEBUG_EVENTS.map((eventName) => {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<any>;
      const record: TFormDebugEventRecord = {
        type: customEvent.type,
        timestamp: Date.now(),
        detail: customEvent.detail,
      };

      events.push(record);
      if (events.length > maxEvents) {
        events.splice(0, events.length - maxEvents);
      }

      if (record.type === "form-ui:rule-applied") {
        ruleEvents.push(record as TFormDebugRuleRecord);
        if (ruleEvents.length > maxEvents) {
          ruleEvents.splice(0, ruleEvents.length - maxEvents);
        }
      }

      options.onEvent?.(record);
    };

    target.addEventListener(eventName, listener as EventListener);
    return {
      eventName,
      listener,
    };
  });

  return {
    getEvents() {
      return [...events];
    },
    getRuleHistory() {
      return [...ruleEvents];
    },
    clear() {
      events.splice(0, events.length);
      ruleEvents.splice(0, ruleEvents.length);
    },
    clearRuleHistory() {
      ruleEvents.splice(0, ruleEvents.length);
    },
    detach() {
      listeners.forEach(({ eventName, listener }) => {
        target.removeEventListener(eventName, listener as EventListener);
      });
    },
  };
}
