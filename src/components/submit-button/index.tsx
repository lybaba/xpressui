import {
    Button,
} from "@mui/joy";

import TFormFieldProps from "../../common/TFormFieldProps";


export const SubmitBtn = (props: TFormFieldProps) => {
    return (
        <Button
            type="submit"
            {...props.cssProps?.iClassesProps}
            {...props.cssProps?.iElemProps}
        >
           {
             props.children
           }
        </Button>
    );

}

export default SubmitBtn;