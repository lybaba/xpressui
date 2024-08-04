import { AUTH_CHECKING, FETCH_USER, SERVER_REQUEST, SERVER_RESPONSE } from "../../common/Constants";
import IAction from "../../common/IAction";


import {
    SET_CONFIG,
    SET_CURRENT_STEP_INDEX,
} from './Actions';


import TPostUIState, { DEFAULT_POSTUI_CONTEXT, TDispatchFieldGroupProps } from "./TPostUIState";

export const INITIAL_STATE: TPostUIState = DEFAULT_POSTUI_CONTEXT;


export default function reducer(state: TPostUIState, action: IAction): TPostUIState {
    switch (action.type) {
        case AUTH_CHECKING:
            return {
                ...state,
                authChecking: action.payload
            }

        case SERVER_REQUEST:
            return {
                ...state,
                isLoading: true,
                serverResponse: { success: true, message: '' }
            }
    
        case SERVER_RESPONSE:
            return {
                ...state,
                isLoading: false,
                serverResponse: action.payload
            }
        
        case FETCH_USER:
            return {
                ...state,
                isLoading: false,
                authChecking: false,
                user: action.payload
            }

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