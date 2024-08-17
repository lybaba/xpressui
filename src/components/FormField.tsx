import {
    Box,
    Stack,
} from "@mui/joy";

import FormFieldTitle from "./FormFieldTitle";
import {
    BTN_TYPE,
    getCssProps,
    IMAGE_TYPE,
    OUTPUT_TYPE,
    SUBMIT_TYPE,
} from "../common/field";
import TFormFieldProps from "../common/TFormFieldProps";
import CustomField from "./CustomField";
import CustomFieldLabel from "./CustomFieldLabel";
import CustomFieldInput from "./CustomFieldInput";
import { shouldRenderField } from "../common/post";

export const FormFieldBody = (props: TFormFieldProps) => {
    const {
        fieldConfig,
        formConfig
    } = props;

    if (!shouldRenderField(formConfig, fieldConfig))
        return null;


    switch (fieldConfig.type) {
        case OUTPUT_TYPE:
            return (
                <Stack
                    direction={'row'}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    gap={3}
                >
                    <FormFieldTitle {...props} />
                    <Box>Blabala...</Box>
                </Stack>
            )

    
            case IMAGE_TYPE:
            case SUBMIT_TYPE:
            case BTN_TYPE:
                return (
                    <CustomField
                       {...props}
                    >
                         <CustomFieldInput {...props}>
                            <CustomFieldLabel {...props} />
                        </CustomFieldInput>
                    </CustomField>
                );


        default:
            return (
                <CustomField
                   {...props}
                >
                     <CustomFieldLabel {...props} />
                     <CustomFieldInput {...props} />
                </CustomField>
            );
    }

}

export const FormField = (props: TFormFieldProps) => {
    const cssProps = getCssProps(props.fieldConfig);

    console.log("FormField....... ", props.fieldConfig.name, "   ", cssProps)

    return (
        <FormFieldBody {...props} cssProps={cssProps}/>
    )
}
export default FormField;