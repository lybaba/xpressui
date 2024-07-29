import { FormLabel, Typography } from "@mui/joy";
import PostFieldProps from "./PostFieldProps";
import { SECTION_TYPE } from "../common/field";


const FormFieldTitle = (props: PostFieldProps) => {
  const {
    fieldConfig,
  } = props;

  switch(fieldConfig.type) {
    case SECTION_TYPE:
      return (
        <Typography level="title-sm">
          {
            fieldConfig.label
          }
        </Typography>
      );


    default:
      return (
        <FormLabel>
          {
            fieldConfig.label
          }
        </FormLabel>
      );
  }
}

export default FormFieldTitle;