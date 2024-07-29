import styled from "@emotion/styled";
import  Button, { ButtonProps }  from "@mui/joy/Button";

const CustomButton = styled(Button)<ButtonProps>(( { theme }) => ({
    height: 38,
    padding: "8.5px 14px",
    textTransform: "none"
}))

export default CustomButton;