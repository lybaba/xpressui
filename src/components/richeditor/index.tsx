import { useRef } from 'react';
import Textarea from '@mui/joy/Textarea';
import TFormFieldProps from '../../common/TFormFieldProps';



export const RichEditor = (props: TFormFieldProps) => {
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
    cssProps
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
      {...cssProps?.inputClasses}
      {...cssProps?.inputProps}
    />
  )
}

export default RichEditor;