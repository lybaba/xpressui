import { FormLabel, Typography } from "@mui/joy";
import { SECTION_TYPE } from "../common/field";
import TFormFieldProps from "../common/TFormFieldProps";


const FormFieldTitle = (props: TFormFieldProps) => {
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