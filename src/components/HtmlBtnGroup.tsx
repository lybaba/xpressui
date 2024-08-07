import { Box, Button, ButtonGroup, Stack, Typography } from "@mui/joy";

import { FormRenderProps } from "react-final-form";
import TPostUIProps from '../common/TPostUIProps';
import { usePostUIContext } from "./ui/PostUIProvider";
import { MAIN_SECTION } from "../common/Constants";
import { MULTI_STEP_FORM_TYPE } from "../common/TFormConfig";
import TComponentType from "../common/TComponentType";
import { onNextBtnClick, onPrevBtnClick } from "./ui/Actions";

type OwnProps = {
    componentType: string;
    reactNode: React.ReactNode;
    elemProps: any;
    formProps?: FormRenderProps<any, any>;
}

type Props = OwnProps & TPostUIProps

function HtmlBtnGroup(props: Props) {
    const {
        elemProps,
        reactNode,
        componentType,
        formProps,
        formConfig,
    } = props;


    const postUIContext = usePostUIContext();
    const {
        currentStepIndex,
    } = postUIContext

    const steps = formConfig.sections[MAIN_SECTION];
    const nbSteps = steps.length;

    const isMultiStepForm = formConfig.type === MULTI_STEP_FORM_TYPE;
    const currentStepNum = currentStepIndex + 1;

    const showNextBtn = isMultiStepForm && currentStepNum < nbSteps;

    const showPrevBtn = isMultiStepForm && currentStepNum > 1;

    const showSubmitBtn = !isMultiStepForm || currentStepNum === nbSteps;



    switch (componentType) {
        case TComponentType.NEXT_BTN_INPUT_TYPE:
            return isMultiStepForm && showNextBtn && (
                <Button
                    color="primary"
                    {
                    ...elemProps
                    }
                    onClick={(e) => {
                        e.preventDefault();
                        onNextBtnClick(postUIContext, props, formProps)
                    }}                >
                    {
                        (reactNode as any).props.children
                    }
                </Button>
            );

        case TComponentType.PREV_BTN_INPUT_TYPE:
            return isMultiStepForm ? (
                <Button
                    {
                    ...elemProps
                    }
                    disabled={!showPrevBtn}
                    onClick={(e) => {
                        e.preventDefault();
                        onPrevBtnClick(postUIContext, props, formProps)
                    }}
                >
                    {
                        (reactNode as any).props.children
                    }
                </Button>
            ) : null;


        case TComponentType.SUBMIT_BTN_INPUT_TYPE:
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


        case TComponentType.NEXT_BTN_LABEL_TYPE:
            return (
                <Box
                    {...elemProps}
                >
                    {
                        formConfig.nextBtnLabel
                    }
                    {
                        (reactNode as any).props.children
                    }
                </Box>
            );

        case TComponentType.PREV_BTN_LABEL_TYPE:
            return (
                <Box
                    {...elemProps}
                >
                    {
                        formConfig.prevBtnLabel
                    }
                    {
                        (reactNode as any).props.children
                    }
                </Box>
            );

        case TComponentType.SUBMIT_BTN_LABEL_TYPE:
            return (
                <Box
                    {...elemProps}
                >
                    {
                        formConfig.submitBtnLabel
                    }
                    {
                        (reactNode as any).props.children
                    }
                </Box>
            );

        case TComponentType.BTN_GROUP_TYPE:
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

export default HtmlBtnGroup;