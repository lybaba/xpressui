import {
    Button,
} from "@mui/joy";

import TFormFieldProps from "../../common/TFormFieldProps";


export const SubmitBtn = (props: TFormFieldProps) => {
    return (
        <Button
            type="submit"
            {...props.cssProps?.inputClasses}
            {...props.cssProps?.inputProps}
        >
           {
             props.children
           }
        </Button>
    );

}

export default SubmitBtn;