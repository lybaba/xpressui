import IAction from "../../types/IAction";


import {
    SET_CONFIG,
    SET_CURRENT_STEP_INDEX,
} from './Actions';


import TPostUIState, { DEFAULT_POSTUI_CONTEXT, TDispatchFieldGroupProps } from "./TPostUIState";

export const INITIAL_STATE: TPostUIState = DEFAULT_POSTUI_CONTEXT;


export default function reducer(state: TPostUIState, action: IAction): TPostUIState {
    switch (action.type) {

        case SET_CURRENT_STEP_INDEX:
        case SET_CONFIG:
                return {
                    ...state,
                    ...action.payload
                }

        default:
            return state;
    }
}