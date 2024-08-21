
import TFormFieldProps from '../common/TFormFieldProps';
import {
    BTN_TYPE,
    IMAGE_TYPE,
    SUBMIT_TYPE,
    UPLOAD_IMAGE_TYPE
} from '../common/field';

import { Box, FormControl, Stack } from '@mui/joy';

export const CustomField = (props: TFormFieldProps) => {
    const {
        fieldConfig,
        cssProps
    } = props;



    switch (fieldConfig.type) {

        /*case OUTPUT_TYPE:
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

        case OUTPUT_TYPE:
            return (
                <Stack
                    direction={'row'}
                    justifyContent={"flex-start"}
                    alignItems={"flex-start"}
                    gap={3}
                    {...fieldElementProps}
                >
                    <FormFieldTitle {...props} />
                    <Box>Blabala...</Box>
                </Stack>
            );*/

        case BTN_TYPE:    
        case SUBMIT_TYPE:
            return (
                <Box
                    {...cssProps?.fieldClasses}
                    {...cssProps?.fieldProps}
                >
                   {props.children}
                </Box>
            );

        case IMAGE_TYPE:
            return (
                <Stack
                    gap={1}
                    spacing={1}
                    sx={{
                        alignItems: 'center',
                    }}
                    {...cssProps?.fieldClasses}
                    {...cssProps?.fieldProps}
                >
                    {props.children}
                </Stack>
            );

        default:
            return (
                <FormControl
                    {...cssProps?.fieldClasses}
                    {...cssProps?.fieldProps}
                >
                    {props.children}
                </FormControl>
            );
    }

}

export default CustomField;