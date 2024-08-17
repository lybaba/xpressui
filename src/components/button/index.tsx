import {
    Button,
} from "@mui/joy";

import TFormFieldProps from "../../common/TFormFieldProps";
import { isFunction } from "lodash";


export const SubmitBtn = (props: TFormFieldProps) => {
    const {
        disabled = false
    } = props;

    return (
        <Button
            {...props.cssProps?.iClassesProps}
            {...props.cssProps?.iElemProps}
            onClick={(e) => {
                e.preventDefault();
                if (isFunction(props.onClickEvent)) {
                    props.onClickEvent();
                }
            }}
            disabled={disabled}
        >
           {
             props.children
           }
        </Button>
    );

}

export default SubmitBtn;