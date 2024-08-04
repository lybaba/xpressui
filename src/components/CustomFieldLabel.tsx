import { FormLabel } from '@mui/joy';
import { SUBMIT_TYPE } from '../common/field';
import TPostFieldProps from '../common/TPostFieldProps';

export const CustomFieldLabel = (props: TPostFieldProps) => {
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