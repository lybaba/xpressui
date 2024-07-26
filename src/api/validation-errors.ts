import { FieldMetaState } from "react-final-form";



export const getHasError = (meta : FieldMetaState<any>) => meta.touched && (meta.error || (meta.submitError &&  !meta.dirtySinceLastSubmit)) ? true : false;

export const getErrorText = (meta : FieldMetaState<any>) => {
    if (meta.touched && meta.error) {
        return meta.error;
    } else if (meta.touched && (meta.submitError &&  !meta.dirtySinceLastSubmit)) {
        return meta.submitError;
    }

    return ' ';
}
