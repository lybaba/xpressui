import { Button, ButtonGroup, Stack, Typography } from "@mui/joy";

import {
    MAIN_SECTION,
} from '../common/Constants';
import { usePostUIContext } from "./ui/PostUIProvider";
import { FormRenderProps } from "react-final-form";
import { onNextBtnClick, onPrevBtnClick } from "./ui/Actions";
import TFormConfig, { MULTI_STEP_FORM_TYPE } from "../common/TFormConfig";
import TPostUIProps from "../common/TPostUIProps";

type OwnProps = {
    formProps?: FormRenderProps<any, any>;
    rootFormConfig: TFormConfig;
}

type Props = OwnProps & TPostUIProps;
function BtnGroup(props: Props) {
    const {
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
                                formConfig.prevBtnLabel
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
                                formConfig.nextBtnLabel
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
                                formConfig.submitBtnLabel
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