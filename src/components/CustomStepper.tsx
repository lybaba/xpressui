import { Step, StepIndicator, Stepper } from "@mui/joy";

import { FormRenderProps } from "react-final-form";
import { usePostUIContext } from "./postui/PostUIProvider";
import { BUILDER_TAB_FORMS } from "../common/Constants";
import TFieldConfig from "../common/TFieldConfig";
import { CheckRounded } from "@mui/icons-material";

type CustomStepperProps = {
    dataType: string;
    reactNode: React.ReactNode;
    elemProps: any;
    formProps: FormRenderProps<any, any>;
}

function CustomStepper(props: CustomStepperProps) {
    const {
        elemProps,
        formProps: {
            valid
        }
    } = props;

    const postUIContext = usePostUIContext();
    const {
        postConfig,
        currentStepIndex
    } = postUIContext;

    const fields = postConfig.fields[BUILDER_TAB_FORMS];

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

export default CustomStepper;