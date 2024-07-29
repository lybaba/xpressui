import {
    Box,
    Stack,
} from "@mui/joy";

import { FormRenderProps } from 'react-final-form'

import FormFieldTitle from "./FormFieldTitle";
import {
    IMAGE_TYPE,
    OUTPUT_TYPE,
    SUBMIT_TYPE,
} from "../common/field";
import PostFieldProps from "./PostFieldProps";
import FieldTemplate from "./CustomField";
import FieldLabelTemplate from "./CustomFieldLabel";
import FieldInputTemplate from "./CustomFieldInput";


type FormProps = {
    formProps: FormRenderProps<any, any>;
}
type Props = PostFieldProps & FormProps;

export const PostField = (props: Props) => {
    const {
        fieldConfig,
    } = props;



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


export default PostField;