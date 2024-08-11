import {
    Box,
    Stack,
} from "@mui/joy";

import FormFieldTitle from "./FormFieldTitle";
import {
    IMAGE_TYPE,
    OUTPUT_TYPE,
    SUBMIT_TYPE,
} from "../common/field";
import TFormFieldProps from "../common/TFormFieldProps";
import FieldTemplate from "./CustomField";
import FieldLabelTemplate from "./CustomFieldLabel";
import FieldInputTemplate from "./CustomFieldInput";
import { shouldRenderField } from "../common/post";

export const FormField = (props: TFormFieldProps) => {
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
                return (
                    <FieldTemplate
                       {...props}
                    >
                         <FieldInputTemplate {...props}>
                            <FieldLabelTemplate {...props} />
                        </FieldInputTemplate>
                    </FieldTemplate>
                );


        default:
            return (
                <FieldTemplate
                   {...props}
                >
                     <FieldLabelTemplate {...props} />
                     <FieldInputTemplate {...props} />
                </FieldTemplate>
            );
    }

}


export default FormField;