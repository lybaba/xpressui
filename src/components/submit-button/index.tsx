import {
    Button,
} from "@mui/joy";

import { FormRenderProps } from 'react-final-form'
import TPostFieldProps from "../../common/TPostFieldProps";


type FormProps = {
    formProps: FormRenderProps<any, any>;
}

type Props = TPostFieldProps & FormProps;

export const SubmitBtn = (props: Props) => {
    const {
        elemProps = {},
    } = props;

    return (
        <Button
            {
                ...elemProps
            }
            type="submit"
        >
           {
             props.children
           }
        </Button>
    );

}

export default SubmitBtn;