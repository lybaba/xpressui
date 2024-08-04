import {
    Button,
} from "@mui/joy";

import TPostFieldProps from "../../common/TPostFieldProps";


export const SubmitBtn = (props: TPostFieldProps) => {
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