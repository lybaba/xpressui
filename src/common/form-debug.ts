import type {
  TFormActiveTemplateWarning,
  TFormRuleAppliedDetail,
} from "./form-dynamic";

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

export type TFormDebugTemplateDiagnosticRecord = TFormDebugEventRecord & {
  type: "form-ui:rule-template-missing-field" | "form-ui:rule-template-warning-cleared";
};

export type TFormDebugRuleStateRecord = TFormDebugEventRecord & {
  type: "form-ui:rule-state";
  detail: {
    result?: {
      rules?: TFormRuleAppliedDetail[];
    };
    [key: string]: any;
  };
};

export type TFormDebugTemplateWarningStateRecord = TFormDebugEventRecord & {
  type: "form-ui:rule-template-warning-state";
  detail: {
    result?: {
      warnings?: TFormActiveTemplateWarning[];
    };
    [key: string]: any;
  };
};

export type TFormDebugSnapshot = {
  recentAppliedRules: TFormRuleAppliedDetail[];
  lastRuleState: TFormDebugRuleStateRecord | null;
  activeTemplateWarnings: TFormActiveTemplateWarning[];
  lastTemplateWarningState: TFormDebugTemplateWarningStateRecord | null;
};

export type TFormDebugObserver = {
  getEvents(): TFormDebugEventRecord[];
  getRuleHistory(): TFormDebugRuleRecord[];
  getRecentAppliedRules(): TFormRuleAppliedDetail[];
  getLastRuleState(): TFormDebugRuleStateRecord | null;
  getTemplateDiagnostics(): TFormDebugTemplateDiagnosticRecord[];
  getActiveTemplateWarnings(): TFormActiveTemplateWarning[];
  getLastTemplateWarningState(): TFormDebugTemplateWarningStateRecord | null;
  getSnapshot(): TFormDebugSnapshot;
  clear(): void;
  clearSnapshot(): void;
  clearRuleHistory(): void;
  clearRecentAppliedRules(): void;
  clearLastRuleState(): void;
  clearTemplateDiagnostics(): void;
  clearActiveTemplateWarnings(): void;
  clearLastTemplateWarningState(): void;
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
  "form-ui:rule-state",
  "form-ui:rule-template-missing-field",
  "form-ui:rule-template-warning-cleared",
  "form-ui:rule-template-warning-state",
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
  "form-ui:step-change",
  "form-ui:step-blocked",
  "form-ui:step-skipped",
  "form-ui:step-jumped",
  "form-ui:workflow-state",
  "form-ui:workflow-step",
];

export function attachFormDebugObserver(
  target: EventTarget,
  options: TFormDebugOptions = {},
): TFormDebugObserver {
  const maxEvents = options.maxEvents ?? 100;
  const events: TFormDebugEventRecord[] = [];
  const ruleEvents: TFormDebugRuleRecord[] = [];
  let recentAppliedRules: TFormRuleAppliedDetail[] = [];
  let lastRuleState: TFormDebugRuleStateRecord | null = null;
  const templateDiagnostics: TFormDebugTemplateDiagnosticRecord[] = [];
  let activeTemplateWarnings: TFormActiveTemplateWarning[] = [];
  let lastTemplateWarningState: TFormDebugTemplateWarningStateRecord | null = null;
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

      if (record.type === "form-ui:rule-state") {
        recentAppliedRules = Array.isArray(record.detail?.result?.rules)
          ? [...record.detail.result.rules]
          : [];
        lastRuleState = record as TFormDebugRuleStateRecord;
      }

      if (
        record.type === "form-ui:rule-template-missing-field" ||
        record.type === "form-ui:rule-template-warning-cleared"
      ) {
        templateDiagnostics.push(record as TFormDebugTemplateDiagnosticRecord);
        if (templateDiagnostics.length > maxEvents) {
          templateDiagnostics.splice(0, templateDiagnostics.length - maxEvents);
        }
      }

      if (record.type === "form-ui:rule-template-warning-state") {
        activeTemplateWarnings = Array.isArray(record.detail?.result?.warnings)
          ? [...record.detail.result.warnings]
          : [];
        lastTemplateWarningState = record as TFormDebugTemplateWarningStateRecord;
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
    getRecentAppliedRules() {
      return [...recentAppliedRules];
    },
    getLastRuleState() {
      return lastRuleState ? { ...lastRuleState } : null;
    },
    getTemplateDiagnostics() {
      return [...templateDiagnostics];
    },
    getActiveTemplateWarnings() {
      return [...activeTemplateWarnings];
    },
    getLastTemplateWarningState() {
      return lastTemplateWarningState ? { ...lastTemplateWarningState } : null;
    },
    getSnapshot() {
      return {
        recentAppliedRules: [...recentAppliedRules],
        lastRuleState: lastRuleState ? { ...lastRuleState } : null,
        activeTemplateWarnings: [...activeTemplateWarnings],
        lastTemplateWarningState: lastTemplateWarningState ? { ...lastTemplateWarningState } : null,
      };
    },
    clear() {
      events.splice(0, events.length);
      ruleEvents.splice(0, ruleEvents.length);
      recentAppliedRules = [];
      lastRuleState = null;
      templateDiagnostics.splice(0, templateDiagnostics.length);
      activeTemplateWarnings = [];
      lastTemplateWarningState = null;
    },
    clearSnapshot() {
      recentAppliedRules = [];
      lastRuleState = null;
      activeTemplateWarnings = [];
      lastTemplateWarningState = null;
    },
    clearRuleHistory() {
      ruleEvents.splice(0, ruleEvents.length);
    },
    clearRecentAppliedRules() {
      recentAppliedRules = [];
    },
    clearLastRuleState() {
      lastRuleState = null;
    },
    clearTemplateDiagnostics() {
      templateDiagnostics.splice(0, templateDiagnostics.length);
    },
    clearActiveTemplateWarnings() {
      activeTemplateWarnings = [];
    },
    clearLastTemplateWarningState() {
      lastTemplateWarningState = null;
    },
    detach() {
      listeners.forEach(({ eventName, listener }) => {
        target.removeEventListener(eventName, listener as EventListener);
      });
    },
  };
}
