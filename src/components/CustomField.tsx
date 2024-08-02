
import TPostFieldProps from 'src/common/TPostFieldProps';
import {
    IMAGE_TYPE,
    SUBMIT_TYPE
} from '../common/field';

import { Box, FormControl, Stack } from '@mui/joy';

export const CustomField = (props: TPostFieldProps) => {
    const {
        fieldConfig,
        elemProps,
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

        case SUBMIT_TYPE:
            return (
                <Box
                    {...elemProps}
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
                    {...elemProps}
                >
                    {props.children}
                </Stack>
            );

        default:
            return (
                <FormControl
                    {...elemProps}
                >
                    {props.children}
                </FormControl>
            );
    }

}

export default CustomField;