import { Typography } from "@mui/joy";
import TFormFieldProps from "../common/TFormFieldProps";


const FormFieldTitle = (props: TFormFieldProps) => {
  const {
    fieldConfig,
    cssProps
  } = props;

  return (
    <Typography
      level="title-sm"
      {...cssProps?.lClassesProps}
      {...cssProps?.lElemProps}
    >
      {
        fieldConfig.adminLabel ? fieldConfig.adminLabel : fieldConfig.label

      }
    </Typography>
  );
}

export default FormFieldTitle;