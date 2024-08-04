import { Button, ButtonGroup, Stack, Typography } from "@mui/joy";

import {
    MAIN_SECTION,
} from '../common/Constants';
import { usePostUIContext } from "./postui/PostUIProvider";
import { FormRenderProps } from "react-final-form";
import { onNextBtnClick, onPrevBtnClick } from "./postui/Actions";
import { MULTI_STEP_FORM_TYPE } from "../common/TPostConfig";
import TPostUIProps from "../common/TPostUIProps";

type OwnProps = {
    formProps?: FormRenderProps<any, any>;
}

type Props = OwnProps & TPostUIProps;
function BtnGroup(props: Props) {
    const {
        formProps,
        postConfig,
    } = props;

    const postUIContext = usePostUIContext();
    const {
        currentStepIndex,
    } = postUIContext

    const steps = postConfig.sections[MAIN_SECTION];
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
                                onPrevBtnClick(postUIContext, props, formProps)
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
                                onNextBtnClick(postUIContext, props,formProps)
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
            {
                isMultiStepForm && (
                    <Typography level="body-sm">
                        {
                            `${currentStepNum} / ${nbSteps}`
                        }
                    </Typography>
                )
            }
        </Stack>
    );
}

export default BtnGroup;