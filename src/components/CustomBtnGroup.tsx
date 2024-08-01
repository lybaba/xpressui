import { Box, Button, ButtonGroup, Stack, Typography } from "@mui/joy";

import {
    BUILDER_TAB_FORMS,
    BTN_GROUP_TYPE,
    NEXT_BTN_INPUT_TYPE,
    NEXT_BTN_LABEL_TYPE,
    PREV_BTN_INPUT_TYPE,
    PREV_BTN_LABEL_TYPE,
    SUBMIT_BTN_INPUT_TYPE,
    SUBMIT_BTN_LABEL_TYPE,
} from '../common/Constants';
import { usePostUIContext } from "./postui/PostUIProvider";
import { FormRenderProps } from "react-final-form";
import { MULTI_STEP_FORM_TYPE } from "../common/TPostConfig";
import { onNextBtnClick, onPrevBtnClick } from "./postui/Actions";

type CustomBtnGroupProps = {
    dataType: string;
    reactNode: React.ReactNode;
    elemProps: any;
    formProps: FormRenderProps<any, any>;
}

function CustomBtnGroup(props: CustomBtnGroupProps) {
    const {
        elemProps,
        reactNode,
        dataType,
        formProps
    } = props;


    const postUIContext = usePostUIContext();
    const {
        postConfig,
        currentStepIndex,
    } = postUIContext

    const steps = postConfig.fields[BUILDER_TAB_FORMS];
    const nbSteps = steps.length;

    const isMultiStepForm = postConfig.type === MULTI_STEP_FORM_TYPE;
    const currentStepNum = currentStepIndex + 1;

    const showNextBtn = isMultiStepForm && currentStepNum < nbSteps;

    const showPrevBtn = isMultiStepForm && currentStepNum > 1;

    const showSubmitBtn = !isMultiStepForm || currentStepNum === nbSteps;



    switch (dataType) {
        case NEXT_BTN_INPUT_TYPE:
            return isMultiStepForm && showNextBtn && (
                <Button
                    color="primary"
                    {
                    ...elemProps
                    }
                    onClick={(e) => {
                        e.preventDefault();
                        onNextBtnClick(postUIContext, formProps)
                    }}                >
                    {
                        (reactNode as any).props.children
                    }
                </Button>
            );

        case PREV_BTN_INPUT_TYPE:
            return isMultiStepForm ? (
                <Button
                    {
                    ...elemProps
                    }
                    disabled={!showPrevBtn}
                    onClick={(e) => {
                        e.preventDefault();
                        onPrevBtnClick(postUIContext, formProps)
                    }}
                >
                    {
                        (reactNode as any).props.children
                    }
                </Button>
            ) : null;


        case SUBMIT_BTN_INPUT_TYPE:
            return showSubmitBtn && (
                <Button
                    type="submit"
                    color="primary"
                    variant="solid"
                    {
                    ...elemProps
                    }
                >
                    {
                        (reactNode as any).props.children
                    }
                </Button>
            );


        case NEXT_BTN_LABEL_TYPE:
            return (
                <Box
                    {...elemProps}
                >
                    {
                        postConfig.nextBtnLabel
                    }
                    {
                        (reactNode as any).props.children
                    }
                </Box>
            );

        case PREV_BTN_LABEL_TYPE:
            return (
                <Box
                    {...elemProps}
                >
                    {
                        postConfig.prevBtnLabel
                    }
                    {
                        (reactNode as any).props.children
                    }
                </Box>
            );

        case SUBMIT_BTN_LABEL_TYPE:
            return (
                <Box
                    {...elemProps}
                >
                    {
                        postConfig.submitBtnLabel
                    }
                    {
                        (reactNode as any).props.children
                    }
                </Box>
            );

        case BTN_GROUP_TYPE:
            return (
                <Stack
                    spacing={2}
                    gap={2}
                    direction={'row'}
                    justifyContent={'space-between'}
                >
                    <ButtonGroup
                        spacing="1.25rem"
                        sx={{
                            mt: 3
                        }}
                        {...elemProps}
                    >
                        {
                            (reactNode as any).props.children
                        }
                    </ButtonGroup>
                    <Typography level="title-sm">
                        {
                            `${currentStepNum} / ${nbSteps}`
                        }
                    </Typography>
                </Stack>

            )
        default:
            return null;
    }

}

export default CustomBtnGroup;