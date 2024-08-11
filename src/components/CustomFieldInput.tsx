import { Field, FieldInputProps, FieldMetaState } from 'react-final-form';
import { useEffect, useRef } from 'react';
import {
    CHECKBOXES_TYPE,
    CHECKBOX_TYPE,
    IMAGE_TYPE,
    MULTI_SELECT_TYPE,
    RADIO_BUTTONS_TYPE,
    SINGLE_SELECT_TYPE,
    SUBMIT_TYPE,
    SWITCH_TYPE,
    TEXTAREA_TYPE,
    UPLOAD_IMAGE_TYPE,
    doNormalizeFieldValue
} from '../common/field';

import { FormHelperText, Input } from '@mui/joy';
import SingleSelect from './single-select';
import MultiSelect from './multi-select';
import RichEditor from './richeditor';
import CustomCheckbox from './checkbox';
import { getErrorText, getHasError } from '../common/validation-errors';
import { isEmpty } from 'lodash';
import SubmitBtn from './submit-button';
import ImageBox from './image-box';
import TFormFieldProps from '../common/TFormFieldProps';
import { getHideLabel } from '../common/post';
import UploadImage from './upload-image';

type InputTemplateProps = {
    input: FieldInputProps<any, HTMLElement>;
    meta: FieldMetaState<any>;
    hasError: boolean;
};


type FormInputControlProps = TFormFieldProps & InputTemplateProps;
type CustomFieldInputProps = TFormFieldProps;

export const FormInputControl = (props: FormInputControlProps) => {
    const inputRef: any = useRef(null);

    const {
        elemProps,
        fieldConfig,
        input,
        hasError,
        isFirstInputfield,
        formProps
    } = props;

    const submitting = formProps ? formProps.submitting : false;

    const {
        type
    } = fieldConfig;

    const inputProps = input ? input : {};

    let placeholderProps = {};
    if (fieldConfig.placeholder)
        placeholderProps = { placeholder: fieldConfig.placeholder }
    else if (getHideLabel(props)) 
        placeholderProps = { placeholder: fieldConfig.label }


    useEffect(() => {
        if (isFirstInputfield && inputRef.current) {
            inputRef.current.focus();
        }
    }, [fieldConfig.name, submitting])


    switch (fieldConfig.type) {
        case SINGLE_SELECT_TYPE:
        case RADIO_BUTTONS_TYPE:
            return (
                <SingleSelect
                    {...props}
                />
            );

        case MULTI_SELECT_TYPE:
        case CHECKBOXES_TYPE:
            return (
                <MultiSelect
                    {...props}
                />
            );

        case TEXTAREA_TYPE:
            return (
                <RichEditor
                    {...props}
                />
            );

        case CHECKBOX_TYPE:
        case SWITCH_TYPE:
            return (
                <CustomCheckbox
                    {...props}
                />
            );

        case UPLOAD_IMAGE_TYPE:
            return (
                <UploadImage
                    {...props}
                />
            );
            
        default:
            return (
                <Input
                    type={type}
                    {...inputProps}
                    slotProps={{
                        input: {
                            ref: inputRef,
                        }
                    }}
                    error={hasError}
                    {...placeholderProps}
                    {...elemProps}
                >
                    {
                        props.children
                    }
                </Input>
            );
    }
}


export const CustomFieldInput = (props: CustomFieldInputProps) => {
    const {
        fieldConfig,
        normalizeFieldValue = doNormalizeFieldValue,
    } = props;

    const {
        helpText = null
    } = fieldConfig;

    switch (fieldConfig.type) {
        case SUBMIT_TYPE:
            return (
                <SubmitBtn
                    {...props}
                />
            )

        case IMAGE_TYPE:
            return (
                <ImageBox
                    {...props}
                />
            )

        default:
            return (
                <Field
                    name={fieldConfig.name}
                    parse={(value) => normalizeFieldValue(fieldConfig, value)}
                >
                    {({ input, meta }) => {

                        const hasError = getHasError(meta);
                        const errorText = hasError ? getErrorText(meta) : '';
                        return (
                            <>
                                <FormInputControl
                                    {...props}
                                    input={input}
                                    meta={meta}
                                    hasError={hasError}
                                />
                                {
                                    hasError ? (
                                        <FormHelperText>
                                            {errorText}
                                        </FormHelperText>
                                    ) : (
                                        !isEmpty(helpText) ? (
                                            <FormHelperText>
                                                {helpText}
                                            </FormHelperText>
                                        ) : null
                                    )
                                }
                            </>
                        )
                    }}
                </Field>
            );
    }
}

export default CustomFieldInput;