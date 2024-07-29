import { FormRenderProps } from 'react-final-form'
import { isEmpty } from "lodash";
import PostFieldProps from "../PostFieldProps";
import ImageBoxBody from "./ImageBoxBody";
import { Image } from "@mui/icons-material";

type FormProps = {
    formProps: FormRenderProps<any, any>;
}

type Props = PostFieldProps & FormProps;

export const ImageBox = (props: Props) => {
    const {
        fieldConfig,
        mediaFilesMap,
        postConfig,
        isLivePreview = false,
    } = props;

    const {
        mediaId = ''
    } = fieldConfig;

    const mediaFile = !isEmpty(mediaId) && mediaFilesMap.hasOwnProperty(mediaId) ? mediaFilesMap[mediaId] : null;
    
    if (!mediaFile) {
        return (
            <Image />
        )
    }

    return (
        <ImageBoxBody
            {...props}
            postConfig={postConfig}
            fieldConfig={fieldConfig}
            mediaFile={mediaFile}
            isLivePreview={isLivePreview}
        />            
    );
}

export default ImageBox;