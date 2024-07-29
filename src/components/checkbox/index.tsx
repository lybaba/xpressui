import { FormRenderProps } from 'react-final-form';
import { Checkbox } from '@mui/joy';
import FormFieldTitle from '../FormFieldTitle';
import FormFieldProps from '../FormFieldProps';
import { getBooleanValue } from '../../utils/field';

type FormProps = {
  formProps: FormRenderProps<any, any>;
}

type Props = FormFieldProps & FormProps;

export const CustomCheckbox = (props: Props) => {
  const {
    fieldConfig,
    input,
    formProps,
    elemProps
  } = props;

  return (
    <Checkbox
      onChange={(event) => {
        formProps.form.mutators.setFieldValue(fieldConfig.name, event.target.checked);
      }}
      checked={getBooleanValue(input.value)}
      label={<FormFieldTitle {...props} />}
      {...elemProps}
    />
  )
}

export default CustomCheckbox;