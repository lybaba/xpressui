import { strToSxProps } from '../../common/field';
import TPostUIProps from '../../common/TPostUIProps';
import FormUI from './FormUI';
import { Box } from '@mui/joy';

export default function PostUI(props: TPostUIProps) {
    const {
        formConfig,
    } = props;

    const { 
        bClasses = null,
        bSxProps = null
    } = formConfig;

    const cssClassesProps = bClasses ? {className: bClasses} : {};
    const cSxProps = strToSxProps(bSxProps);


    return  (
        <Box
            {...cssClassesProps}
            {...cSxProps}
        >
            <FormUI {...props} />
        </Box>
    );
}
