import { usePostUIContext } from './PostUIProvider';
import { submitForm } from './Actions';
import { Form } from 'react-final-form';
import { FormApi } from 'final-form';
import { useCallback, useEffect, useState } from 'react';
import { ajv } from '../../common/frontend';
import validate from './Validator';
import { buildSchema } from '../../common/post';
import TPostUIProps from '../../common/TPostUIProps';
import { isEmpty, isFunction } from 'lodash';
import { ValidateFunction } from 'ajv';
import FormSectionList from './FormSectionList';


function FormUI(props: TPostUIProps) {
    const [validators, setValidators] = useState<Record<string, ValidateFunction<unknown>>>({})
    const postUIContext = usePostUIContext();

    const {
        currentStepIndex
    } = postUIContext;

    const {
        formConfig,
        template = '',
        entry = {},
        restartForm = true
    } = props;

    const getValidator = useCallback(() => {
        const schema = buildSchema(formConfig, currentStepIndex);
        const validator = ajv.compile(schema);
        return validator;
    },[currentStepIndex])

    return (
        <Form
            onSubmit={(formValues: any,  form: FormApi<any, any>) => {
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
                <form
                    onSubmit={formProps.handleSubmit}
                    noValidate
                >
                    <FormSectionList {...props} formProps={formProps} />
                </form>
            )}
            initialValues={entry}
        />
    );
}

export default FormUI;