import TPostFieldProps from "../../common/TPostFieldProps";
import ImageBoxBody from "./ImageBoxBody";


export const ImageBox = (props: TPostFieldProps) => {
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