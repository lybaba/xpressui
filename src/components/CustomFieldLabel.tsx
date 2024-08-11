import { FormLabel } from '@mui/joy';
import { SUBMIT_TYPE } from '../common/field';
import TFormFieldProps from '../common/TFormFieldProps';
import { getHideLabel } from '../common/post';


export const CustomFieldLabel = (props: TFormFieldProps) => {
    const {
        elemProps,
        fieldConfig,
    } = props;


    if (getHideLabel(props))
        return null;


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