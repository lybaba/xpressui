import React, { createContext, PropsWithChildren, useContext, useReducer } from "react";
import { DEFAULT_POSTUI_CONTEXT, TPostUIContext } from "./TPostUIState";

import reducer, { INITIAL_STATE } from './Reducers';
import { init } from './Actions';
import TPostUIState, { TPostUIReducer } from "./TPostUIState";

const PostUIContext = createContext<TPostUIContext>(DEFAULT_POSTUI_CONTEXT);

export function usePostUIContext() {
  return useContext(PostUIContext);
}

type OwnProps = {
  initialState?: TPostUIState;
}

type Props = OwnProps & PropsWithChildren;

const PostUIProvider: React.FC<Props> = (props: Props) => {
  const {
    children,
    initialState = INITIAL_STATE
  } = props;

  const [state, dispatch] = useReducer<TPostUIReducer, TPostUIState>(reducer, initialState, init);

  const value = {
    ...state,
    dispatch,
  }


  return (
    <PostUIContext.Provider value={value}>
      {children}
    </PostUIContext.Provider>
  );
}

export default PostUIProvider;
