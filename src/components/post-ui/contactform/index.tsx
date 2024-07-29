import { Container } from '@mui/joy';
import { usePostUIContext } from '../PostUIProvider';
import { PathProps, withRouter } from '../../router';
import { FormApi } from 'final-form';
import { submitForm } from '../Actions';
import CustomForm from '../../CustomForm';
import { Form } from 'react-final-form';
import { useCallback } from 'react';
import { buildSchema } from '../../../utils/post-validate';
import { ajv } from '../../../utils/frontend';
import validate from '../Validator';


type ContactFormProps = {
    isLivePreview: boolean
}

type Props = ContactFormProps & PathProps;
function ContactForm(props: Props) {
    const postUIContext = usePostUIContext();

    const {
        postConfig,
        currentStepIndex
    } = postUIContext;

    const {
        isLivePreview = false
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
                onSubmit={(formValues: any, form: FormApi<string, any>) => {
                    console.log("submitForm : ", formValues);

                    if (!isLivePreview) {
                        submitForm(postUIContext, currentStepIndex, formValues).then((data) => {
                            console.log("Form Submitted Successfully....");
                        })
                    } else {
                        console.log("submitForm : ", formValues);
                    }

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
                       <CustomForm {...props} formProps={formProps} />
                    </form>
                )}
            />
        </Container>
    );
}

export default withRouter(ContactForm)