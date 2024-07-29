import TMediaFile from "../../types/TMediaFile";
import TPostConfig from "../../types/TPostConfig";
import TPostConfigState,
{
    TPostUIContext,
} from "./TPostUIState";
import TPostUIEvent, { TPostUIEventType } from "../../types/TPostUIEvent";
import { BUILDER_TAB_FORMS } from "../../types/Constants";
import { FormRenderProps } from "react-final-form";
import { TPostUIConfig } from "../../types/TPostUIConfigProps";


export const SET_CURRENT_STEP_INDEX = 'set_step';
export const SET_CONFIG = 'set_config';

export type EventHandlerType =  (
    event: TPostUIEvent, 
    onSuccess: (data : any) => void,
    onError: (data: any) => void,
   ) => void;

export const EVENT_HANDLERS: Array<EventHandlerType> = [];

export function init(state: TPostConfigState): TPostConfigState {
    return state;
}

export async function setCurrentStepIndex(postUIContext: TPostUIContext, currentStepIndex: number) {
    const {
        dispatch,
    } = postUIContext;

    dispatch({
        type: SET_CURRENT_STEP_INDEX,
        payload: {
            currentStepIndex
        }
    });
}

export async function setPostUITemplate(postUIContext: TPostUIContext, template: string) {
    const {
        dispatch,
    } = postUIContext;

    dispatch({
        type: SET_CONFIG,
        payload: {
            template
        }
    });
}

export async function setPostUIConfigAndTemplate(postUIContext: TPostUIContext, postConfig: TPostConfig, template: string) {
    const {
        dispatch,
    } = postUIContext;

    dispatch({
        type: SET_CONFIG,
        payload: {
            currentStepIndex: 0,
            postConfig,
            template
        }
    });
}


export async function setPostUIConfig(postUIContext: TPostUIContext, config: TPostUIConfig) {
    const {
        dispatch,
    } = postUIContext;

    dispatch({
        type: SET_CONFIG,
        payload: config
    });
}

export async function doOnSuccess(context: TPostUIContext, event: TPostUIEvent, data: any) {
    console.log("doOnSuccess event=", event, " response=", data);
}

export async function doOnError(context: TPostUIContext, event: TPostUIEvent, data: any) {
    console.log("doOnError event=", event, " response=", data);
}


export async function submitForm(context: TPostUIContext, sectionIndex: number, values: Record<string, any>) {
    const {
        frontend,
    } = context;


    const eventType = TPostUIEventType.SubmitFormEvent;
    const event : TPostUIEvent = {
        frontend,
        eventType,
        data: {
            formData: values
        },
    }

    const onSuccess =   (data: any) => doOnSuccess(context, event, data);

    const onError = (data: any) => doOnError(context, event, data);

    if (EVENT_HANDLERS.length) {
        EVENT_HANDLERS.forEach((eventHandler) => eventHandler(event, onSuccess, onError));
    } else {
        console.log("Please provide an eventHandler to submit your data to your backend (server)");
        onSuccess({});
    }
}


export async function onNextBtnClick(context: TPostUIContext, formProps: FormRenderProps<any, any>) {
    const {
        valid,
        values
    } = formProps;

    const {
        postConfig,
        currentStepIndex,
        frontend
    } = context

    const steps = postConfig.fields[BUILDER_TAB_FORMS];
    const nbSteps = steps.length;

    const currentStepNum = currentStepIndex + 1;

    if (currentStepNum < nbSteps && valid) {

        const eventType = TPostUIEventType.SelectStepEvent;

        const event: TPostUIEvent = {
            frontend,
            eventType,
            data: {
                currentStepIndex,
                formData: values,
                targetStepIndex: currentStepIndex + 1,
                steps
            },
        };

        const onSuccess =   (data: any) => setCurrentStepIndex(context, currentStepIndex + 1);
        const onError = (data: any) => doOnError(context, event, data);

        if (EVENT_HANDLERS.length) {
            EVENT_HANDLERS.forEach((eventHandler) => eventHandler(event, onSuccess, onError));
        } else {
            onSuccess({});
        }
    }
}

export async function onPrevBtnClick(context: TPostUIContext, formProps: FormRenderProps<any, any>) {
    const {
        values
    } = formProps;

    const {
        postConfig,
        currentStepIndex,
        frontend
    } = context

    const steps = postConfig.fields[BUILDER_TAB_FORMS];

    const currentStepNum = currentStepIndex + 1;

    if (currentStepNum > 1) {
        const eventType = TPostUIEventType.SelectStepEvent;

        const event: TPostUIEvent = {
            frontend,
            eventType,
            data: {
                currentStepIndex,
                formData: values,
                targetStepIndex: currentStepIndex - 1,
                steps
            },
        };

        const onSuccess =  (data: any) => setCurrentStepIndex(context, currentStepIndex - 1);
        const onError = (data: any) => doOnError(context, event, data);

        if (EVENT_HANDLERS.length) {
            EVENT_HANDLERS.forEach((eventHandler) => eventHandler(event, onSuccess, onError));
        } else {
            onSuccess({});
        }
    }
}