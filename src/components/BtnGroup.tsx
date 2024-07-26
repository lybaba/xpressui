import { Button, ButtonGroup, Stack, Typography } from "@mui/joy";

import {
    BUILDER_TAB_FORMS,
} from '../types/Constants';
import { usePostUIContext } from "./post-ui/PostUIProvider";
import { FormRenderProps } from "react-final-form";
import { MULTI_STEP_FORM_TYPE } from "../api/post";
import { onNextBtnClick, onPrevBtnClick } from "./post-ui/Actions";

type BtnGroupProps = {
    formProps: FormRenderProps<any, any>;
}

function BtnGroup(props: BtnGroupProps) {
    const {
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

    return (
        <Stack
            spacing={2}
            gap={2}
            direction={'row'}
            justifyContent={'space-between'}
        >
            <ButtonGroup
                spacing="1.25rem"
            >
                {
                    isMultiStepForm ? (
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                onPrevBtnClick(postUIContext, formProps)
                            }}
                            disabled={!showPrevBtn}
                        >
                            {
                                postConfig.prevBtnLabel
                            }
                        </Button>
                    ) : null
                }
                {
                    isMultiStepForm && showNextBtn && (
                        <Button
                            color="primary"
                            onClick={(e) => {
                                e.preventDefault();
                                onNextBtnClick(postUIContext, formProps)
                            }}
                        >
                            {
                                postConfig.nextBtnLabel
                            }
                        </Button>
                    )
                }
                {
                    showSubmitBtn && (
                        <Button
                            type="submit"
                            color="primary"
                            variant="solid"
                        >
                            {
                                postConfig.submitBtnLabel
                            }
                        </Button>
                    )
                }
            </ButtonGroup>
            <Typography level="body-sm">
                {
                    `${currentStepNum} / ${nbSteps}`
                }
            </Typography>
        </Stack>
    );
}

export default BtnGroup;