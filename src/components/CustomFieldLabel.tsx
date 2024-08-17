import { Box, FormLabel } from '@mui/joy';
import { SUBMIT_TYPE } from '../common/field';
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
            return (
                <Box
                    {...cssProps?.lClassesProps}
                    {...cssProps?.lElemProps}
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
                <FormLabel
                    {...cssProps?.lClassesProps}
                    {...cssProps?.lElemProps}
                >
                    {
                        props.children
                    }
                    <span>
                        {
                            fieldConfig.label
                        }
                    </span>
                </FormLabel>
            );
    }
}

export default CustomFieldLabel;