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
import FormField from "./FormField";
import { getCssProps } from "../common/field";

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

    const formSubmitCssProps = getCssProps(formSubmit.section);

    return (
        <Stack
            {...formSubmitCssProps.cClassesProps}
            {...formSubmitCssProps.cElemProps}
        >
            <Box
                component={'p'}
                {...formSubmitCssProps.lClassesProps}
                {...formSubmitCssProps.lElemProps}
            >
                {formSubmit.section.desc}
            </Box>
            <Stack
                component={ButtonGroup}
                gap={2}
                direction={'row'}
                justifyContent={'space-between'}
                spacing="1.25rem"
                {...formSubmitCssProps.iClassesProps}
                {...formSubmitCssProps.iElemProps}
            >
                {
                    isMultiStepForm ? (
                        <FormField
                            {...props}
                            cssProps={getCssProps(formSubmit.prevBtn)}
                            fieldConfig={formSubmit.prevBtn}
                            disabled={!showPrevBtn}
                            onClickEvent={() => onPrevBtnClick(postUIContext, props, formProps)}
                        />

                    ) : null
                }
                {
                    isMultiStepForm && showNextBtn && (
                        <FormField
                            {...props}
                            cssProps={getCssProps(formSubmit.nextBtn)}
                            fieldConfig={formSubmit.nextBtn}
                            onClickEvent={() => onNextBtnClick(postUIContext, props, formProps)}
                        />
                    )
                }
                {
                    showSubmitBtn && (
                        <FormField
                            {...props}
                            cssProps={getCssProps(formSubmit.submitBtn)}
                            fieldConfig={formSubmit.submitBtn}
                        />
                    )
                }
            </Stack>
        </Stack>
    );
}

export default BtnGroup;