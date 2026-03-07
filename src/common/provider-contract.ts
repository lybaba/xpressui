export type TFormProviderTransition =
  | {
      type: "step";
      target: string | number;
    }
  | {
      type: "workflow";
      state: string;
    };

export type TNormalizedProviderResult = {
  status: string | null;
  transition: TFormProviderTransition | null;
  messages: string[];
  errors: any[];
  nextActions?: any[];
  data: any;
};

export type TProviderResponseEnvelopeV2 = {
  status?: string;
  transition?: TFormProviderTransition;
  messages?: string[];
  errors?: any[];
  nextActions?: any[];
  data?: any;
};
