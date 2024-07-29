import { HTMLReactParserOptions } from 'html-react-parser';
import React from 'react';
import { Stack } from '@mui/joy';
import PostFieldProps from './PostFieldProps';
import { usePostUIContext } from './post-ui/PostUIProvider';
import { MULTI_STEP_FORM_TYPE } from '../common/TPostConfig';

type CustomSectionProps = {
    dataType: string;
    reactNode: React.ReactNode;
    options: HTMLReactParserOptions;
    elemProps: any;
}

type Props = PostFieldProps & CustomSectionProps;

function CustomSection(props: Props) {
    const {
        reactNode,
        elemProps,
        fieldIndex
    } = props;

    const elem = reactNode as any;

    const postUIContext = usePostUIContext();
    const {
        postConfig,
        currentStepIndex,
    } = postUIContext

    const isMultiStepForm = postConfig.type === MULTI_STEP_FORM_TYPE;

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

export default CustomSection;