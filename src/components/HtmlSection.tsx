import { HTMLReactParserOptions } from 'html-react-parser';
import React from 'react';
import { Stack } from '@mui/joy';
import TFormFieldProps from '../common/TFormFieldProps';
import { usePostUIContext } from './ui/PostUIProvider';
import { MULTI_STEP_FORM_TYPE } from '../common/TFormConfig';
import TPostUIProps from '../common/TPostUIProps';


type OwnProps = {
    componentType: string;
    reactNode: React.ReactNode;
    options: HTMLReactParserOptions;
    elemProps: any;
}

type Props = TFormFieldProps & TPostUIProps & OwnProps;

function HtmlSection(props: Props) {
    const {
        reactNode,
        elemProps,
        fieldIndex,
        formConfig,
    } = props;

    const elem = reactNode as any;

    const postUIContext = usePostUIContext();
    const {
        currentStepIndex,
    } = postUIContext

    const isMultiStepForm = formConfig.type === MULTI_STEP_FORM_TYPE;

    const showSection = !isMultiStepForm || currentStepIndex === fieldIndex;

    return showSection && (
        <Stack
            spacing={2}
            gap={2}
            {...elemProps}
        >
            {
                typeof elem === 'object' && elem.props ? (
                    elem.props.children
                ) : (
                    elem
                )
            }
        </Stack>
    )
}

export default HtmlSection;