import {
    Button,
} from "@mui/joy";

import TFormFieldProps from "../../common/TFormFieldProps";


export const SubmitBtn = (props: TFormFieldProps) => {
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