import { Checkbox } from '@mui/joy';
import FormFieldTitle from '../FormFieldTitle';
import { getBooleanValue } from '../../common/field';
import TFormFieldProps from '../../common/TFormFieldProps';


export const CustomCheckbox = (props: TFormFieldProps) => {
  const {
    fieldConfig,
    input,
    formProps,
    cssProps
  } = props;

  return (
    <Checkbox
      onChange={(event) => {
        formProps?.form.mutators.setFieldValue(fieldConfig.name, event.target.checked);
      }}
      checked={getBooleanValue(input?.value)}
      label={<FormFieldTitle {...props} />}

      {...cssProps?.inputClasses}
      {...cssProps?.inputProps}
    />
  )
}

export default CustomCheckbox;