import { getBodyFormConfig } from 'src/common/post';
import { strToSxProps } from '../../common/field';
import { usePostUIContext } from './PostUIProvider';
import { submitForm } from './Actions';
import { Form } from 'react-final-form';
import { FormApi } from 'final-form';
import { useCallback, useEffect, useState } from 'react';
import { ajv } from '../../common/frontend';
import validate from './Validator';
import { buildSchema } from '../../common/post';
import { isEmpty, isFunction } from 'lodash';
import { ValidateFunction } from 'ajv';
import { TFooterConfig } from '../../common/footer';
import { THeadingConfig } from '../../common/heading';

import { Box } from '@mui/joy';
import getFooterConfig from '../../common/footer';
import getHeadingConfig from '../../common/heading';
import FormSectionList from './FormSectionList';
import TPostUIProps from '../../common/TPostUIProps';


type OwnProps = {
    footerConfig: TFooterConfig
    headingConfig: THeadingConfig;
}

type Props = OwnProps & TPostUIProps

function FormUI(props: Props) {
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


export default function PostUI(props: TPostUIProps) {
    const formConfig = getBodyFormConfig(props.formConfig);
    const footerConfig = getFooterConfig(props.formConfig);
    const headingConfig = getHeadingConfig(props.formConfig);

    return  (
        <Box
            {...formConfig.bClassesProps}
            {...formConfig.bSxPropsProps}
        >
            <FormUI 
                {...props}
                formConfig={formConfig}
                footerConfig={footerConfig}
                headingConfig={headingConfig}
            />
        </Box>
    );
}
