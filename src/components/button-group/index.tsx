import { Box, ButtonGroup, Stack } from "@mui/joy";

import {
    CUSTOM_SECTION,
} from '../../common/Constants';
import { usePostUIContext } from "../ui/PostUIProvider";
import { onNextBtnClick, onPrevBtnClick } from "../ui/Actions";
import { MULTI_STEP_FORM_TYPE } from "../../common/TFormConfig";
import FormField from "../FormField";
import { getCssProps } from "../../common/field";
import TFormFieldProps from "../../common/TFormFieldProps";


function CustomButtonGroup(props: TFormFieldProps) {
    const {
        formProps,
        formConfig,
        formButtons,
        cssProps,
        isLivePreview = false
    } = props;

    if (!formButtons)
        return null;

    const postUIContext = usePostUIContext();
    const {
        currentStepIndex,
    } = postUIContext

    const steps = formConfig.sections[CUSTOM_SECTION];
    const nbSteps = steps.length;

    const isMultiStepForm = formConfig.type === MULTI_STEP_FORM_TYPE;
    const currentStepNum = currentStepIndex + 1;

    const showNextBtn = isLivePreview || isMultiStepForm && currentStepNum < nbSteps;

    const showPrevBtn = isLivePreview || isMultiStepForm && currentStepNum > 1;

    const showSubmitBtn = isLivePreview || !isMultiStepForm || currentStepNum === nbSteps;

   
    return (
        <Box
            {...cssProps?.cClassesProps}
            {...cssProps?.cElemProps}
        >
            <Stack
                component={ButtonGroup}
                gap={2}
                direction={'row'}
                justifyContent={'space-between'}
                spacing="1.25rem"
                {...cssProps?.iClassesProps}
                {...cssProps?.iElemProps}
            >
                {
                    isMultiStepForm ? (
                        <FormField
                            {...props}
                            cssProps={getCssProps(formButtons.prevBtn)}
                            fieldConfig={formButtons.prevBtn}
                            disabled={!showPrevBtn}
                            onClickEvent={() => onPrevBtnClick(postUIContext, props, formProps)}
                        />

                    ) : null
                }
                {
                    isMultiStepForm && showNextBtn && (
                        <FormField
                            {...props}
                            cssProps={getCssProps(formButtons.nextBtn)}
                            fieldConfig={formButtons.nextBtn}
                            onClickEvent={() => onNextBtnClick(postUIContext, props, formProps)}
                        />
                    )
                }
                {
                    showSubmitBtn && (
                        <FormField
                            {...props}
                            cssProps={getCssProps(formButtons.submitBtn)}
                            fieldConfig={formButtons.submitBtn}
                        />
                    )
                }
            </Stack>
        </Box>
    );
}

export default CustomButtonGroup;