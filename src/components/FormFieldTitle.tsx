import { FormLabel, Typography } from "@mui/joy";
import { SECTION_TYPE } from "../common/field";
import TFormFieldProps from "../common/TFormFieldProps";


const FormFieldTitle = (props: TFormFieldProps) => {
  const {
    fieldConfig,
    cssProps
  } = props;

  switch(fieldConfig.type) {
    case SECTION_TYPE:
      return (
        <Typography
          level="title-sm"
          {...cssProps?.lClassesProps}
          {...cssProps?.lElemProps}
        >
          {
            fieldConfig.label
          }
        </Typography>
      );


    default:
      return (
        <FormLabel
        {...cssProps?.lClassesProps}
        {...cssProps?.lElemProps}
        >
          {
            fieldConfig.label
          }
        </FormLabel>
      );
  }
}

export default FormFieldTitle;