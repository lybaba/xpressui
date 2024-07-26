import {
    Button,
} from "@mui/joy";

import { FormRenderProps } from 'react-final-form'

import PostFieldProps from "../PostFieldProps";

type FormProps = {
    formProps: FormRenderProps<any, any>;
}

type Props = PostFieldProps & FormProps;

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