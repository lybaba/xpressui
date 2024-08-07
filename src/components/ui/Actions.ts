import TFormConfig from "../../common/TFormConfig";
import TPostConfigState,
{
    TPostUIContext,
} from "./TPostUIState";
import TPostUIEvent, { TPostUIEventType } from "../../common/TPostUIEvent";
import { MAIN_SECTION, SERVER_REQUEST, SERVER_RESPONSE } from "../../common/Constants";
import { FormRenderProps } from "react-final-form";
import { TPostUIConfig } from "../../common/TPostUIConfigProps";
import TPostUIProps from "../../common/TPostUIProps";
import TServerResponse from "../../common/TServerResponse";


export const SET_CURRENT_STEP_INDEX = 'set_step';
export const SET_CONFIG = 'set_config';

export type EventHandlerType =  (
    event: TPostUIEvent, 
    onSuccess: (data : any) => void,
    onError: (data: any) => void,
   ) => void;

export function init(state: TPostConfigState): TPostConfigState {
    return state;
}

// ====================================================================
function dispatchUnknownError(context: TPostUIContext, data: any) : TServerResponse {
    const res = {
        success: false,
        message: '"An unknown error has occured."',
        data
    }
    context.dispatch({
        type: SERVER_RESPONSE,
        payload: res
    });

    return res;
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

export async function setCurrentPostUITemplate(postUIContext: TPostUIContext, template: string) {
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

export async function setCurrentPostConfig(postUIContext: TPostUIContext, currentFormConfig: TFormConfig) {
    const {
        dispatch,
    } = postUIContext;

    dispatch({
        type: SET_CONFIG,
        payload: {
            currentStepIndex: 0,
            currentFormConfig,
        }
    });
}

// ====================================================================

export async function initPostUI(postUIContext: TPostUIContext, config: TPostUIConfig) {
    const {
        dispatch,
    } = postUIContext;

    dispatch({
        type: SET_CONFIG,
        payload: config
    });
}

// ====================================================================

// default onPostUIEvent handler
async function handlePostUIEvent(event: TPostUIEvent): Promise<TServerResponse> {
    console.log("handlePostUIEvent event : ", event)
    return {
        success: true,
        message: ''
    }
}

// ====================================================================

export async function submitForm(context: TPostUIContext, postProps: TPostUIProps, formData: Record<string, any>) {
    const {
        frontend,
    } = context;

    const eventType = TPostUIEventType.SubmitFormEvent;
    const event : TPostUIEvent = {
        frontend,
        eventType,
        data: {
            formData
        },
    }

    context.dispatch({
        type: SERVER_REQUEST,
    });

    try {
        const {
            onPostUIEvent = handlePostUIEvent
        } = postProps;

        const res = await onPostUIEvent(event);

        context.dispatch({
            type: SERVER_RESPONSE,
        });

        if (!res.success)
            return res;

    } catch (reason: any) {
        return dispatchUnknownError(context, reason);
    }
}

// ====================================================================

export async function onNextBtnClick(context: TPostUIContext, postProps: TPostUIProps, formProps?: FormRenderProps<any, any>) {
    const valid = formProps ? formProps.valid : true;
    const values = formProps ? formProps.values : {}

    const {
        currentStepIndex,
        frontend
    } = context

    const {
        formConfig,
    } = postProps;

    const steps = formConfig.sections[MAIN_SECTION];
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

        context.dispatch({
            type: SERVER_REQUEST,
        });
    
        try {
            const {
                onPostUIEvent = handlePostUIEvent
            } = postProps;
    
            const res = await onPostUIEvent(event);
    
            context.dispatch({
                type: SERVER_RESPONSE,
            });
    
            if (!res.success)
                return res;


            setCurrentStepIndex(context, currentStepIndex + 1);
        } catch (reason: any) {
            return dispatchUnknownError(context, reason);
        }
    }
}

// ====================================================================

export async function onPrevBtnClick(context: TPostUIContext, postProps: TPostUIProps,  formProps?: FormRenderProps<any, any>) {
    const values = formProps ? formProps.values : {}

    const {
        currentStepIndex,
        frontend
    } = context;

    const {
        formConfig,
    } = postProps;

    const steps = formConfig.sections[MAIN_SECTION];

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

        context.dispatch({
            type: SERVER_REQUEST,
        });
    
        try {
            const {
                onPostUIEvent = handlePostUIEvent
            } = postProps;
    
            const res = await onPostUIEvent(event);
    
            context.dispatch({
                type: SERVER_RESPONSE,
            });
    
            if (!res.success)
                return res;


            setCurrentStepIndex(context, currentStepIndex - 1);
        } catch (reason: any) {
            return dispatchUnknownError(context, reason);
        }
    }
}
