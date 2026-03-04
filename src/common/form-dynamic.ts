import slugify from "slugify";
import TChoice from "./TChoice";
import TFieldConfig from "./TFieldConfig";

export type TFormRemoteOptionsDetail = {
  field: string;
  options: TChoice[];
  sourceField?: string;
};

export type TFormRuleAppliedDetail = {
  id?: string;
  logic?: "AND" | "OR";
  conditions: Array<{
    field: string;
    operator?: "equals" | "not_equals" | "contains" | "in" | "gt" | "lt";
    value?: any;
  }>;
  actions: Array<{
    type:
      | "show"
      | "hide"
      | "enable"
      | "disable"
      | "clear-value"
      | "set-value"
      | "fetch-options";
    field: string;
    value?: any;
    sourceField?: string;
    template?: string;
    transform?: "copy" | "trim" | "lowercase" | "uppercase" | "slugify";
  }>;
};

export type TFormRuleTemplateMissingFieldDetail = {
  ruleId?: string;
  field: string;
  template: string;
  missingField: string;
};

export type TFormRuleTemplateWarningClearedDetail = {
  ruleId?: string;
  field: string;
  template: string;
  previousMissingField: string;
};

type TFormDynamicRuntimeOptions = {
  getFieldConfigs(): TFieldConfig[];
  getRules(): Array<{
    id?: string;
    logic?: "AND" | "OR";
    conditions: Array<{
      field: string;
      operator?: "equals" | "not_equals" | "contains" | "in" | "gt" | "lt";
      value?: any;
    }>;
    actions: Array<{
      type:
        | "show"
        | "hide"
        | "enable"
        | "disable"
        | "clear-value"
        | "set-value"
        | "fetch-options";
      field: string;
      value?: any;
      sourceField?: string;
      template?: string;
      transform?: "copy" | "trim" | "lowercase" | "uppercase" | "slugify";
    }>;
  }>;
  getFieldContainer(
    fieldName: string,
  ): HTMLElement | null;
  getFieldElement(
    fieldName: string,
  ): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  setFieldDisabled(fieldName: string, disabled: boolean): void;
  getFieldValue(fieldName: string): any;
  clearFieldValue(fieldName: string): void;
  setFieldValue(fieldName: string, value: any): void;
  getFormValues(): Record<string, any>;
  emitEvent(eventName: string, detail: Record<string, any>): boolean;
  getEventContext(): { formConfig: any; submit?: any };
};

type TDynamicRule = ReturnType<TFormDynamicRuntimeOptions["getRules"]>[number];

export class FormDynamicRuntime {
  options: TFormDynamicRuntimeOptions;
  loadingOptions: Record<string, boolean>;
  lastTemplateWarnings: Record<string, string>;

  constructor(options: TFormDynamicRuntimeOptions) {
    this.options = options;
    this.loadingOptions = {};
    this.lastTemplateWarnings = {};
  }

  transformRuleValue(
    value: any,
    transform?: "copy" | "trim" | "lowercase" | "uppercase" | "slugify",
  ): any {
    const nextTransform = transform || "copy";
    if (nextTransform === "copy" || value === undefined || value === null) {
      return value;
    }

    const normalizedValue = String(value);
    if (nextTransform === "trim") {
      return normalizedValue.trim();
    }

    if (nextTransform === "lowercase") {
      return normalizedValue.toLowerCase();
    }

    if (nextTransform === "uppercase") {
      return normalizedValue.toUpperCase();
    }

    if (nextTransform === "slugify") {
      return slugify(normalizedValue, {
        lower: true,
        strict: true,
        trim: true,
      });
    }

    return value;
  }

  renderRuleTemplate(template: string, ruleId?: string, targetField?: string): string {
    const templateWarningKey = `${ruleId || ""}:${targetField || ""}`;
    let hasMissingField = false;
    const renderedValue = template.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, fieldName: string) => {
      const hasField = this.options.getFieldConfigs().some((fieldConfig) => fieldConfig.name === fieldName);
      if (!hasField) {
        hasMissingField = true;
        const warningSignature = `${template}:${fieldName}`;
        if (this.lastTemplateWarnings[templateWarningKey] !== warningSignature) {
          this.lastTemplateWarnings[templateWarningKey] = warningSignature;
          const context = this.options.getEventContext();
          this.options.emitEvent("form-ui:rule-template-missing-field", {
            values: this.options.getFormValues(),
            formConfig: context.formConfig,
            submit: context.submit,
            result: {
              ruleId,
              field: targetField || "",
              template,
              missingField: fieldName,
            } satisfies TFormRuleTemplateMissingFieldDetail,
          });
        }
        return "";
      }

      const value = this.options.getFieldValue(fieldName);
      return value === undefined || value === null ? "" : String(value);
    });

    if (!hasMissingField) {
      const previousWarningSignature = this.lastTemplateWarnings[templateWarningKey];
      if (previousWarningSignature) {
        delete this.lastTemplateWarnings[templateWarningKey];
        const separatorIndex = previousWarningSignature.indexOf(":");
        const previousMissingField = separatorIndex >= 0
          ? previousWarningSignature.slice(separatorIndex + 1)
          : previousWarningSignature;
        const context = this.options.getEventContext();
        this.options.emitEvent("form-ui:rule-template-warning-cleared", {
          values: this.options.getFormValues(),
          formConfig: context.formConfig,
          submit: context.submit,
          result: {
            ruleId,
            field: targetField || "",
            template,
            previousMissingField,
          } satisfies TFormRuleTemplateWarningClearedDetail,
        });
      }
    }

    return renderedValue;
  }

  matchesCondition(
    condition: {
      field: string;
      operator?: "equals" | "not_equals" | "contains" | "in" | "gt" | "lt";
      value?: any;
    },
  ): boolean {
    const currentValue = this.options.getFieldValue(condition.field);
    const operator = condition.operator || "equals";

    if (operator === "contains") {
      return String(currentValue ?? "")
        .toLowerCase()
        .includes(String(condition.value ?? "").toLowerCase());
    }

    if (operator === "in") {
      const allowedValues = Array.isArray(condition.value)
        ? condition.value
        : [condition.value];
      return allowedValues.map((value) => String(value ?? "")).includes(String(currentValue ?? ""));
    }

    if (operator === "gt") {
      return Number(currentValue) > Number(condition.value);
    }

    if (operator === "lt") {
      return Number(currentValue) < Number(condition.value);
    }

    if (operator === "not_equals") {
      return String(currentValue ?? "") !== String(condition.value ?? "");
    }

    return String(currentValue ?? "") === String(condition.value ?? "");
  }

  matchesRule(
    rule: {
      logic?: "AND" | "OR";
      conditions: Array<{
        field: string;
        operator?: "equals" | "not_equals" | "contains" | "in" | "gt" | "lt";
        value?: any;
      }>;
    },
  ): boolean {
    const logic = rule.logic || "AND";
    const matches = rule.conditions.map((condition) => this.matchesCondition(condition));
    return logic === "OR" ? matches.some(Boolean) : matches.every(Boolean);
  }

  emitRuleApplied(rule: TDynamicRule): void {
    const context = this.options.getEventContext();
    this.options.emitEvent("form-ui:rule-applied", {
      values: this.options.getFormValues(),
      formConfig: context.formConfig,
      submit: context.submit,
      result: {
        id: rule.id,
        logic: rule.logic,
        conditions: rule.conditions,
        actions: rule.actions,
      } satisfies TFormRuleAppliedDetail,
    });
  }

  updateConditionalFields(): void {
    const visibilityOverrides: Record<string, boolean> = {};
    const disabledOverrides: Record<string, boolean> = {};
    const visibilityRuleByField: Record<string, TDynamicRule> = {};
    const disabledRuleByField: Record<string, TDynamicRule> = {};
    const matchedRules: Array<{ rule: TDynamicRule; changed: boolean }> = [];

    this.options.getFieldConfigs().forEach((fieldConfig) => {
      if (!fieldConfig.visibleWhenField) {
        return;
      }

      const container = this.options.getFieldContainer(fieldConfig.name);
      const fieldElement = this.options.getFieldElement(fieldConfig.name);
      if (!container || !fieldElement) {
        return;
      }

      const currentValue = this.options.getFieldValue(fieldConfig.visibleWhenField);
      const expectedValue = fieldConfig.visibleWhenEquals;
      const isVisible = expectedValue === undefined
        ? Boolean(currentValue)
        : String(currentValue ?? "") === String(expectedValue);
      visibilityOverrides[fieldConfig.name] = isVisible;
    });

    this.options.getRules().forEach((rule) => {
      if (!rule.conditions.length || !rule.actions.length || !this.matchesRule(rule)) {
        return;
      }

      const matchedRule = { rule, changed: false };
      matchedRules.push(matchedRule);

      rule.actions.forEach((action) => {
        if (action.type === "show") {
          visibilityOverrides[action.field] = true;
          visibilityRuleByField[action.field] = rule;
        } else if (action.type === "hide") {
          visibilityOverrides[action.field] = false;
          visibilityRuleByField[action.field] = rule;
        } else if (action.type === "enable") {
          disabledOverrides[action.field] = false;
          disabledRuleByField[action.field] = rule;
        } else if (action.type === "disable") {
          disabledOverrides[action.field] = true;
          disabledRuleByField[action.field] = rule;
        } else if (action.type === "clear-value") {
          if (this.options.getFieldValue(action.field) !== undefined) {
            matchedRule.changed = true;
          }
          this.options.clearFieldValue(action.field);
        } else if (action.type === "set-value") {
          const nextValue = action.template !== undefined
            ? this.renderRuleTemplate(action.template, rule.id, action.field)
            : action.sourceField
              ? this.options.getFieldValue(action.sourceField)
              : action.value;
          const transformedValue = this.transformRuleValue(nextValue, action.transform);
          if (!Object.is(this.options.getFieldValue(action.field), transformedValue)) {
            matchedRule.changed = true;
          }
          this.options.setFieldValue(
            action.field,
            transformedValue,
          );
        } else if (action.type === "fetch-options") {
          const fieldConfig = this.options
            .getFieldConfigs()
            .find((candidate) => candidate.name === action.field && Boolean(candidate.optionsEndpoint));
          if (fieldConfig && !this.loadingOptions[fieldConfig.name]) {
            matchedRule.changed = true;
            void this.fetchOptionsForField(action.field);
          }
        }
      });
    });

    this.options.getFieldConfigs().forEach((fieldConfig) => {
      const container = this.options.getFieldContainer(fieldConfig.name);
      const fieldElement = this.options.getFieldElement(fieldConfig.name);
      if (!container || !fieldElement) {
        return;
      }

      const isVisible = visibilityOverrides[fieldConfig.name];
      if (isVisible !== undefined) {
        const wasVisible = container.style.display !== "none";
        const hadValue = this.options.getFieldValue(fieldConfig.name) !== undefined;
        container.style.display = isVisible ? "" : "none";
        fieldElement.disabled = !isVisible;
        if (!isVisible) {
          this.options.clearFieldValue(fieldConfig.name);
        }
        if (wasVisible !== isVisible || (!isVisible && hadValue)) {
          const matchedRule = matchedRules.find(
            (candidate) => candidate.rule === visibilityRuleByField[fieldConfig.name],
          );
          if (matchedRule) {
            matchedRule.changed = true;
          }
        }
      }

      if (disabledOverrides[fieldConfig.name] !== undefined) {
        const nextDisabled = disabledOverrides[fieldConfig.name];
        if (!Object.is(fieldElement.disabled, nextDisabled)) {
          const matchedRule = matchedRules.find(
            (candidate) => candidate.rule === disabledRuleByField[fieldConfig.name],
          );
          if (matchedRule) {
            matchedRule.changed = true;
          }
        }
        this.options.setFieldDisabled(fieldConfig.name, nextDisabled);
      }
    });

    matchedRules
      .filter((matchedRule) => matchedRule.changed)
      .forEach((matchedRule) => this.emitRuleApplied(matchedRule.rule));
  }

  normalizeRemoteChoices(payload: any, fieldConfig: TFieldConfig): TChoice[] {
    const optionList = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.options)
          ? payload.options
          : [];
    const labelKey = fieldConfig.optionsLabelKey || "label";
    const valueKey = fieldConfig.optionsValueKey || "value";

    return optionList
      .map((item: any) => {
        if (typeof item === "string") {
          return { value: item, label: item };
        }

        return {
          value: String(item?.[valueKey] ?? item?.value ?? ""),
          label: String(item?.[labelKey] ?? item?.label ?? item?.[valueKey] ?? ""),
        };
      })
      .filter((choice: TChoice) => Boolean(choice.value));
  }

  populateSelectOptions(fieldName: string, options: TChoice[], sourceField?: string): void {
    const fieldElement = this.options.getFieldElement(fieldName);
    if (!(fieldElement instanceof HTMLSelectElement)) {
      return;
    }

    const currentValue = fieldElement.value;
    fieldElement.innerHTML = "";

    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "";
    fieldElement.appendChild(emptyOption);

    options.forEach((choice) => {
      const option = document.createElement("option");
      option.value = choice.value;
      option.textContent = choice.label;
      fieldElement.appendChild(option);
    });

    if (currentValue && options.some((choice) => choice.value === currentValue)) {
      fieldElement.value = currentValue;
    }

    const context = this.options.getEventContext();
    this.options.emitEvent("form-ui:options-loaded", {
      values: this.options.getFormValues(),
      formConfig: context.formConfig,
      submit: context.submit,
      result: {
        field: fieldName,
        options,
        sourceField,
      } satisfies TFormRemoteOptionsDetail,
    });
  }

  async fetchOptionsForField(fieldName: string, sourceFieldName?: string): Promise<void> {
    const fieldConfig = this.options
      .getFieldConfigs()
      .find((candidate) => candidate.name === fieldName && Boolean(candidate.optionsEndpoint));
    if (!fieldConfig) {
      return;
    }

    if (this.loadingOptions[fieldConfig.name]) {
      return;
    }

    const dependencyValue = fieldConfig.optionsDependsOn
      ? this.options.getFieldValue(fieldConfig.optionsDependsOn)
      : undefined;

    if (fieldConfig.optionsDependsOn && !dependencyValue) {
      this.populateSelectOptions(fieldConfig.name, [], sourceFieldName || fieldConfig.optionsDependsOn);
      return;
    }

    this.loadingOptions[fieldConfig.name] = true;
    try {
      let url = fieldConfig.optionsEndpoint as string;
      if (fieldConfig.optionsDependsOn) {
        const query = new URLSearchParams({
          [fieldConfig.optionsDependsOn]: String(dependencyValue),
        }).toString();
        url += (url.includes("?") ? "&" : "?") + query;
      }

      const response = await fetch(url);
      const payload = await response.json();
      const options = this.normalizeRemoteChoices(payload, fieldConfig);
      this.populateSelectOptions(fieldConfig.name, options, sourceFieldName);
    } catch {
      this.populateSelectOptions(fieldConfig.name, [], sourceFieldName);
    } finally {
      this.loadingOptions[fieldConfig.name] = false;
    }
  }

  async refreshRemoteOptions(sourceFieldName?: string): Promise<void> {
    const fieldConfigs = this.options.getFieldConfigs().filter(
      (fieldConfig) =>
        Boolean(fieldConfig.optionsEndpoint) &&
        (!sourceFieldName || fieldConfig.optionsDependsOn === sourceFieldName),
    );

    await Promise.all(
      fieldConfigs.map((fieldConfig) => this.fetchOptionsForField(fieldConfig.name, sourceFieldName))
    );
  }
}
