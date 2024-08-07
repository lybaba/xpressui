import { usePostUIContext } from './PostUIProvider';
import { submitForm } from './Actions';
import { Form, FormRenderProps } from 'react-final-form';
import { useCallback } from 'react';
import { ajv } from '../../common/frontend';
import validate from './Validator';
import { buildSchema } from '../../common/post';
import TPostUIProps from '../../common/TPostUIProps';
import BodyContent from './BodyContent';


function FormUI(props: TPostUIProps) {
    const postUIContext = usePostUIContext();

    const {
        currentStepIndex
    } = postUIContext;

    const {
        formConfig,
        template = ''
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
            validate={(values: any) => validate(
                postUIContext,
                formConfig,
                getValidator(),
                currentStepIndex,
                values
            )}
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
        />
    );
}

export default FormUI;