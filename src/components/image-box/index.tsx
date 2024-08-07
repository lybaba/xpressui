import TFormFieldProps from "../../common/TFormFieldProps";
import ImageBoxBody from "./ImageBoxBody";


export const ImageBox = (props: TFormFieldProps) => {
    const {
        fieldConfig,
        formConfig,
    } = props;

    return (
        <ImageBoxBody
            {...props}
            formConfig={formConfig}
            fieldConfig={fieldConfig}
        />            
    );
}

export default ImageBox;