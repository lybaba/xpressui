import TMediaFile from "../../types/TMediaFile";
import TPostConfig from "../../types/TPostConfig";
import TPostConfigState,
{
    TPostUIContext,
} from "./TPostUIState";
import TPostUIEvent, { TPostUIEventType } from "../../types/TPostUIEvent";
import { BUILDER_TAB_FORMS, IAK_POST_UI_EVENT } from "../../types/Constants";
import { FormRenderProps } from "react-final-form";


export const SET_CURRENT_STEP_INDEX = 'set_step';
export const SET_CONFIG = 'set_config';

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

export async function setPostUIConfig(postUIContext: TPostUIContext, 
                                      postConfig: TPostConfig,
                                      mediaFiles: TMediaFile[], 
                                      mediaFilesMap: Record<string, TMediaFile>,
                                      template: string = '') {
    const {
        dispatch,
    } = postUIContext;

    dispatch({
        type: SET_CONFIG,
        payload: {
            postConfig,
            mediaFiles,
            mediaFilesMap,
            template
        }
    });
}

export async function onSuccess(context: TPostUIContext, eventType: TPostUIEventType, data: any) {
    console.log("onSuccess ", eventType, " ", data);
}

export async function onError(context: TPostUIContext, eventType: TPostUIEventType, data: any) {
    console.log("onError ", eventType, " ", data);
}


export async function submitForm(context: TPostUIContext, sectionIndex: number, values: Record<string, any>) {
    const {
        frontend
    } = context;


    const eventType = TPostUIEventType.SubmitFormEvent;
    const eventData : TPostUIEvent = {
        frontend,
        eventType,
        data: {
            formData: values
        },
        onSuccess:  (data: any) => onSuccess(context, eventType, data),
        onError: (data: any) => onError(context, eventType, data),
    }

    const event = new CustomEvent(IAK_POST_UI_EVENT, {detail: eventData});
    document.dispatchEvent(event);
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

        const eventData: TPostUIEvent = {
            frontend,
            eventType,
            data: {
                currentStepIndex,
                formData: values,
                targetStepIndex: currentStepIndex + 1,
                steps
            },
            onSuccess: (data: any) => setCurrentStepIndex(context, currentStepIndex + 1),
            onError: (data: any) => onError(context, eventType, data)
        };

        const event = new CustomEvent(IAK_POST_UI_EVENT, { detail: eventData });
        document.dispatchEvent(event);
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

        const eventData: TPostUIEvent = {
            frontend,
            eventType,
            data: {
                currentStepIndex,
                formData: values,
                targetStepIndex: currentStepIndex - 1,
                steps
            },
            onSuccess: (data: any) => setCurrentStepIndex(context, currentStepIndex - 1),
            onError: (data: any) => onError(context, eventType, data)
        };

        const event = new CustomEvent(IAK_POST_UI_EVENT, { detail: eventData });
        document.dispatchEvent(event);
    }
}