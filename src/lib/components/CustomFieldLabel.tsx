import { FormLabel } from '@mui/joy';
import PostFieldProps from './PostFieldProps';
import { SUBMIT_TYPE } from '../utils/field';

export const CustomFieldLabel = (props: PostFieldProps) => {
    const {
        elemProps,
        fieldConfig,
    } = props;


    switch (fieldConfig.type) {
        case SUBMIT_TYPE:
            return (
                <>
                    {
                        fieldConfig.label
                    }
                    {
                        props.children
                    }
                </>
            );

        default:
            return (
                <FormLabel
                    {...elemProps}
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