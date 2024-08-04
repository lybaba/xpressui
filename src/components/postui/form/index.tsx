import { Container } from '@mui/joy';
import { usePostUIContext } from '../PostUIProvider';
import { submitForm } from '../Actions';
import { Form } from 'react-final-form';
import { useCallback } from 'react';
import { ajv } from '../../../common/frontend';
import validate from '../Validator';
import { buildSchema } from '../../../common/post';
import TPostUIProps from '../../../common/TPostUIProps';
import FormSectionList from '../FormSectionList';



function PostUIForm(props: TPostUIProps) {
    const postUIContext = usePostUIContext();

    const {
        currentStepIndex
    } = postUIContext;

    const {
        postConfig
    } = props;


    const getValidator = useCallback(() => {
        const schema = buildSchema(postConfig, currentStepIndex);
        console.log("___validator______schema ", schema);

        const validator = ajv.compile(schema);
        return validator;
    },[currentStepIndex])

    return (
        <Container>
            <Form
                onSubmit={(formValues: any) => {
                    console.log("submitForm : ", formValues);
                    submitForm(postUIContext, props, formValues).then((data) => {
                        console.log("Form Submitted Successfully....");
                    })
                }}
                validate={(values: any) => validate(
                    postUIContext,
                    postConfig,
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
                       <FormSectionList {...props} formProps={formProps} />
                    </form>
                )}
            />
        </Container>
    );
}

export default PostUIForm;