import { Box, FormLabel, Typography } from '@mui/joy';
import { BTN_TYPE, SUBMIT_TYPE } from '../common/field';
import TFormFieldProps from '../common/TFormFieldProps';
import { getHideLabel } from '../common/post';


export const CustomFieldLabel = (props: TFormFieldProps) => {
    const {
        fieldConfig,
        cssProps
    } = props;


    if (getHideLabel(props))
        return null;


    switch (fieldConfig.type) {
        case SUBMIT_TYPE:
        case BTN_TYPE:
            return (
                <Box
                    {...cssProps?.labelClasses}
                    {...cssProps?.labelProps}
                >
                    {
                        fieldConfig.label
                    }
                    {
                        props.children
                    }
                </Box>
            );

        default:
            return (
                <Typography
                    component={FormLabel}
                    {...cssProps?.labelClasses}
                    {...cssProps?.labelProps}
                >
                    {
                        props.children
                    }
                    {
                        fieldConfig.label
                    }
                </Typography>
            );
    }
}

export default CustomFieldLabel;