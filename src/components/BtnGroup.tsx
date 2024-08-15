import { Box, Button, ButtonGroup, Stack } from "@mui/joy";

import {
    MAIN_SECTION,
} from '../common/Constants';
import { usePostUIContext } from "./ui/PostUIProvider";
import { FormRenderProps } from "react-final-form";
import { onNextBtnClick, onPrevBtnClick } from "./ui/Actions";
import { MULTI_STEP_FORM_TYPE } from "../common/TFormConfig";
import TPostUIProps from "../common/TPostUIProps";
import { TFormSubmit } from "../common/formsubmit";
import { TFormStyling } from "../common/formstyling";

type OwnProps = {
    formProps?: FormRenderProps<any, any>;
    formSubmit: TFormSubmit;
    formStyling: TFormStyling;
}

type Props = OwnProps & TPostUIProps;
function BtnGroup(props: Props) {
    const {
        formProps,
        formConfig,
        formSubmit
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
            {...formSubmit.section.cClassesProps}
            {...formSubmit.section.cSxPropsProps}
        >
            <Box
                component={'p'}
                {...formSubmit.section.lClassesProps}
                {...formSubmit.section.lSxPropsProps}
            >
                { formSubmit.section.desc }
            </Box>
            <Stack
                component={ButtonGroup}
                gap={2}
                direction={'row'}
                justifyContent={'space-between'}
                spacing="1.25rem"
                {...formSubmit.section.iClassesProps}
                {...formSubmit.section.iSxPropsProps}
            >
                {
                    isMultiStepForm ? (
                        <Box
                            {...formSubmit.prevBtn.cClassesProps}
                            {...formSubmit.prevBtn.cSxPropsProps}
                        >
                            <Button
                                onClick={(e) => {
                                    e.preventDefault();
                                    onPrevBtnClick(postUIContext, props, formProps)
                                }}
                                disabled={!showPrevBtn}
                                {...formSubmit.prevBtn.iClassesProps}
                                {...formSubmit.prevBtn.iSxPropsProps}
                            >
                                <span
                                    {...formSubmit.prevBtn.lClassesProps}
                                    {...formSubmit.prevBtn.lSxPropsProps}
                                >
                                    {
                                        formSubmit.prevBtn.label
                                    }
                                </span>
                            </Button>
                        </Box>
                    ) : null
                }
                {
                    isMultiStepForm && showNextBtn && (
                        <Box
                            {...formSubmit.nextBtn.cClassesProps}
                            {...formSubmit.nextBtn.cSxPropsProps}
                        >
                            <Button
                                color="primary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onNextBtnClick(postUIContext, props, formProps)
                                }}
                                {...formSubmit.nextBtn.iClassesProps}
                                {...formSubmit.nextBtn.iSxPropsProps}
                            >
                                <span
                                    {...formSubmit.nextBtn.lClassesProps}
                                    {...formSubmit.nextBtn.lSxPropsProps}
                                >
                                    {
                                        formSubmit.nextBtn.label
                                    }
                                </span>
                            </Button>
                        </Box>
                    )
                }
                {
                    showSubmitBtn && (
                        <Box
                            {...formSubmit.submitBtn.cClassesProps}
                            {...formSubmit.submitBtn.cSxPropsProps}
                        >
                            <Button
                                type="submit"
                                color="primary"
                                variant="solid"
                                {...formSubmit.submitBtn.iClassesProps}
                                {...formSubmit.submitBtn.iSxPropsProps}
                            >
                                <span
                                    {...formSubmit.submitBtn.lClassesProps}
                                    {...formSubmit.submitBtn.lSxPropsProps}
                                >
                                    {
                                        formSubmit.submitBtn.label
                                    }
                                </span>
                            </Button>
                        </Box>
                    )
                }
            </Stack>
        </Stack>
    );
}

export default BtnGroup;