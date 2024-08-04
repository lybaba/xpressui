import { Step, StepIndicator, Stepper } from "@mui/joy";

import { FormRenderProps } from "react-final-form";
import { CheckRounded } from "@mui/icons-material";
import { usePostUIContext } from "./postui/PostUIProvider";
import TPostUIProps from "../common/TPostUIProps";
import { MAIN_SECTION } from "../common/Constants";
import TFieldConfig from "../common/TFieldConfig";

type OwnProps = {
    componentType: string;
    reactNode: React.ReactNode;
    elemProps: any;
    formProps?: FormRenderProps<any, any>;
}

type Props = OwnProps & TPostUIProps;

function HtmlFormStepper(props: Props) {
    const {
        elemProps,
        formProps,
        postConfig,
    } = props;

    const valid = formProps ? formProps.valid : true;

    const postUIContext = usePostUIContext();
    const {
        currentStepIndex
    } = postUIContext;

    const fields = postConfig.sections[MAIN_SECTION];

    return (
        <Stepper
            sx={{
                mb: 5,
            }}
            {...elemProps}
        >
            {
                fields.map((fieldConfig: TFieldConfig, fieldIndex) => {
                    const activeStepNum = currentStepIndex
                    const thisStepNum = fieldIndex

                    const isActive = thisStepNum === activeStepNum;

                    const stepNum = fieldIndex + 1;

                    const isCompleted = isActive ? valid : thisStepNum < activeStepNum;

                    return (
                        <Step
                            key={fieldIndex}
                            indicator={
                                <StepIndicator
                                    variant={thisStepNum <= activeStepNum ? 'solid' : 'soft'}
                                    color={thisStepNum <= activeStepNum ? 'primary' : 'neutral'}
                                    {...elemProps}
                                >
                                    {
                                        isCompleted ? <CheckRounded /> : stepNum
                                    }
                                </StepIndicator>
                            }
                        >
                            {
                                fieldConfig.label
                            }
                        </Step>
                    );
                })
            }
        </Stepper>
    );
}

export default HtmlFormStepper;