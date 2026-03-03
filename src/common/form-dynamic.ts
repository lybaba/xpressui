import TChoice from "./TChoice";
import TFieldConfig from "./TFieldConfig";

export type TFormRemoteOptionsDetail = {
  field: string;
  options: TChoice[];
  sourceField?: string;
};

type TFormDynamicRuntimeOptions = {
  getFieldConfigs(): TFieldConfig[];
  getRules(): Array<{
    logic?: "AND" | "OR";
    conditions: Array<{
      field: string;
      operator?: "equals" | "not_equals";
      value?: any;
    }>;
    actions: Array<{
      type: "show" | "hide" | "clear-value";
      field: string;
    }>;
  }>;
  getFieldContainer(
    fieldName: string,
  ): HTMLElement | null;
  getFieldElement(
    fieldName: string,
  ): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  getFieldValue(fieldName: string): any;
  clearFieldValue(fieldName: string): void;
  getFormValues(): Record<string, any>;
  emitEvent(eventName: string, detail: Record<string, any>): boolean;
  getEventContext(): { formConfig: any; submit?: any };
};

export class FormDynamicRuntime {
  options: TFormDynamicRuntimeOptions;
  loadingOptions: Record<string, boolean>;

  constructor(options: TFormDynamicRuntimeOptions) {
    this.options = options;
    this.loadingOptions = {};
  }

  matchesCondition(
    condition: { field: string; operator?: "equals" | "not_equals"; value?: any },
  ): boolean {
    const currentValue = this.options.getFieldValue(condition.field);
    const operator = condition.operator || "equals";

    if (operator === "not_equals") {
      return String(currentValue ?? "") !== String(condition.value ?? "");
    }

    return String(currentValue ?? "") === String(condition.value ?? "");
  }

  matchesRule(
    rule: {
      logic?: "AND" | "OR";
      conditions: Array<{ field: string; operator?: "equals" | "not_equals"; value?: any }>;
    },
  ): boolean {
    const logic = rule.logic || "AND";
    const matches = rule.conditions.map((condition) => this.matchesCondition(condition));
    return logic === "OR" ? matches.some(Boolean) : matches.every(Boolean);
  }

  updateConditionalFields(): void {
    const visibilityOverrides: Record<string, boolean> = {};

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

      rule.actions.forEach((action) => {
        if (action.type === "show") {
          visibilityOverrides[action.field] = true;
        } else if (action.type === "hide") {
          visibilityOverrides[action.field] = false;
        } else if (action.type === "clear-value") {
          this.options.clearFieldValue(action.field);
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
      if (isVisible === undefined) {
        return;
      }

      container.style.display = isVisible ? "" : "none";
      fieldElement.disabled = !isVisible;
      if (!isVisible) {
        this.options.clearFieldValue(fieldConfig.name);
      }
    });
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

  async refreshRemoteOptions(sourceFieldName?: string): Promise<void> {
    const fieldConfigs = this.options.getFieldConfigs().filter(
      (fieldConfig) =>
        Boolean(fieldConfig.optionsEndpoint) &&
        (!sourceFieldName || fieldConfig.optionsDependsOn === sourceFieldName),
    );

    await Promise.all(fieldConfigs.map(async (fieldConfig) => {
      if (this.loadingOptions[fieldConfig.name]) {
        return;
      }

      const dependencyValue = fieldConfig.optionsDependsOn
        ? this.options.getFieldValue(fieldConfig.optionsDependsOn)
        : undefined;

      if (fieldConfig.optionsDependsOn && !dependencyValue) {
        this.populateSelectOptions(fieldConfig.name, [], fieldConfig.optionsDependsOn);
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
    }));
  }
}
