import { usePostUIContext } from './PostUIProvider';
import { submitForm } from './Actions';
import { Form } from 'react-final-form';
import { FormApi } from 'final-form';
import { PropsWithChildren, useCallback } from 'react';
import { ajv } from '../../common/frontend';
import validate from './Validator';
import { buildSchema } from '../../common/post';
import { isEmpty, isFunction } from 'lodash';
import { TFormButtons } from '../../common/formsubmit';

import FormSectionList from './FormSectionList';
import TPostUIProps from '../../common/TPostUIProps';
import { TCssProps } from '../../common/TFieldConfig';
import { TNavBar } from '../../common/navbar';
import { Box } from '@mui/joy';


type OwnProps = {
    formButtons: TFormButtons
    navBar?: TNavBar;
}

type FormUIProps = OwnProps & TPostUIProps

function FormUI(props: FormUIProps) {
    const postUIContext = usePostUIContext();

    const {
        currentStepIndex
    } = postUIContext;

    const {
        formConfig,
        entry = {},
        restartForm = true
    } = props;

    const getValidator = useCallback(() => {
        const schema = buildSchema(formConfig, currentStepIndex);
        const validator = ajv.compile(schema);
        return validator;
    }, [currentStepIndex])

    return (
        <Form
            onSubmit={(formValues: any, form: FormApi<any, any>) => {
                console.log("submitForm : ", formValues);
                submitForm(postUIContext, props, formValues).then((data) => {
                    console.log("Form Submitted Successfully....");
                    if (restartForm) {
                        form.restart();
                    }
                })
            }}
            validate={(values: any) => {
                // internal validation
                const res = validate(
                    postUIContext,
                    formConfig,
                    getValidator(),
                    currentStepIndex,
                    values
                )

                // custom validation
                if (isEmpty(res) && isFunction(props.validate)) {
                    return props.validate(values);
                }

                return res;
            }}
            mutators={{
                setFieldValue: ([fieldName, fieldVal], state, { changeValue }) => {
                    changeValue(state, fieldName, () => fieldVal)
                }
            }}
            render={(formProps) => (
                <Box
                sx={{
                    p: 2,
                    alignItems: 'center',
                }}
            >
                <form
                    onSubmit={formProps.handleSubmit}
                    noValidate
                >
                    <FormSectionList {...props} formProps={formProps} />
                </form>
                </Box>
            )}
            initialValues={entry}
        />
    );
}

type Props = OwnProps & TPostUIProps & PropsWithChildren;

export default function FormContent(props: Props) {
    return props.children ? (
        props.children
    ) : (
        <FormUI
            {...props}
        />
    );
}
