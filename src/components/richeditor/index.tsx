import { useRef } from 'react';
import Textarea from '@mui/joy/Textarea';

import { FormRenderProps } from 'react-final-form';
import FormFieldProps from '../FormFieldProps';

type FormProps = {
  formProps: FormRenderProps<any, any>;
}

type Props = FormFieldProps & FormProps;

export const RichEditor = (props: Props) => {
  const textareaInput: any = useRef(null);


  /*const log = () => {
    if (textareaInput.current) {
      console.log(textareaInput.current);
      console.log("offset = " , textareaInput.current.selectionStart)

      const str = `<div>${textareaInput.current.value}</div>`;
      const node = new DOMParser().parseFromString(str, "text/html").body.childNodes[0]
      console.log(dom2Json(node))

      //textareaInput.current.value = "Hello World";
      //textareaInput.current.blur();
    }
  };*/

  const {
    fieldConfig,
    input,
    elemProps
  } = props;

  const {
    placeholder = '',
  } = fieldConfig;


  return (
    <Textarea
      size="sm"
      minRows={4}
      maxRows={8}
      slotProps={{
        textarea: { ref: textareaInput }
      }}
      {...input}
      placeholder={placeholder}
      {...elemProps}
    />
  )
}

export default RichEditor;