import React, {createContext, useState, PropsWithChildren, useEffect, useContext } from "react";

interface ModalActionProps {
  modalName: string,
  isModalOpen: boolean,
  entry?: any,
}

const DEFAULT_MODAL_ACTION : ModalActionProps = {
  modalName: '',
  isModalOpen: false,
  entry: null
}

interface ModalContext {
  modalAction: ModalActionProps,
  setModalAction:  (modalAction: ModalActionProps) => void,
}

export const MODAL_BTN_SAVE = 'save';
export const MODAL_BTN_SAVE_AND_NEW = 'save_and_new';

const DEFAULT_CONTEXT : ModalContext = {
  modalAction: DEFAULT_MODAL_ACTION,
  setModalAction: (modalAction: ModalActionProps) => null,
}

const ModalContext = createContext<ModalContext>(DEFAULT_CONTEXT);

export function useModalContext() {
  return useContext(ModalContext);
}


const ConfigProvider: React.FC<PropsWithChildren> = ({children}) => {

  const [modalAction, setModalAction] = useState< ModalActionProps >(DEFAULT_MODAL_ACTION);
  const [currentBtnType, setCurrentBtnType] = useState <string>(MODAL_BTN_SAVE)
  const [firstFieldRef, setFirstFieldRef] = useState <any>()


  const value = {
    modalAction,
    setModalAction,
    currentBtnType,
    setCurrentBtnType,
    resetCurrentBtnType: () => setCurrentBtnType(MODAL_BTN_SAVE),
    firstFieldRef,
    setFirstFieldRef
  }

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

export default ConfigProvider;
