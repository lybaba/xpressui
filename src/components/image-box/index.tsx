import { FormRenderProps } from 'react-final-form'
import TPostFieldProps from "../../common/TPostFieldProps";
import ImageBoxBody from "./ImageBoxBody";

type FormProps = {
    formProps: FormRenderProps<any, any>;
}

type Props = TPostFieldProps & FormProps;

export const ImageBox = (props: Props) => {
    const {
        fieldConfig,
        postConfig,
    } = props;

    return (
        <ImageBoxBody
            {...props}
            postConfig={postConfig}
            fieldConfig={fieldConfig}
        />            
    );
}

export default ImageBox;