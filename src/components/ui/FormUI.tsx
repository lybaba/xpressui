import { usePostUIContext } from './PostUIProvider';
import { submitForm } from './Actions';
import { Form } from 'react-final-form';
import { useCallback } from 'react';
import { ajv } from '../../common/frontend';
import validate from './Validator';
import { buildSchema } from '../../common/post';
import TPostUIProps from '../../common/TPostUIProps';
import BodyContent from './BodyContent';
import { isEmpty, isFunction } from 'lodash';


function FormUI(props: TPostUIProps) {
    const postUIContext = usePostUIContext();

    const {
        currentStepIndex
    } = postUIContext;

    const {
        formConfig,
        template = '',
        entry = {}
    } = props;


    const getValidator = useCallback(() => {
        const schema = buildSchema(formConfig, currentStepIndex);
        console.log("___validator______schema ", schema);

        const validator = ajv.compile(schema);
        return validator;
    },[currentStepIndex])

    return (
        <Form
            onSubmit={(formValues: any) => {
                console.log("submitForm : ", formValues);
                submitForm(postUIContext, props, formValues).then((data) => {
                    console.log("Form Submitted Successfully....");
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
                    <BodyContent {...props} formProps={formProps} template={template} />
                </form>
            )}
            initialValues={entry}
        />
    );
}

export default FormUI;