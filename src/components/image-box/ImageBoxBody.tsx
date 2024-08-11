import {
    Box,
} from "@mui/joy";

import { Image } from "@mui/icons-material";
import { isEmpty } from "lodash";
import { getMediumImageUrl, getThumbImageUrl } from "../../common/post";
import { usePostUIContext } from "../ui/PostUIProvider";
import TFormFieldProps from "../../common/TFormFieldProps";
import { TMediaInfo } from "../../common/TMediaFile";

export const ImageBoxBody = (props: TFormFieldProps) => {
    const {
        fieldConfig,
        isLivePreview = false
    } = props;


    const postUIContext = usePostUIContext();


    if (isEmpty(fieldConfig.mediaInfo) && isEmpty(fieldConfig.mediaId))
        return (
            <>
                <Image/>
                {
                    props.children
                }
            </>
        )
    
    const mediaInfo : TMediaInfo = isEmpty(fieldConfig.mediaInfo)
                                    ? {filePath: fieldConfig.mediaId} : fieldConfig.mediaInfo;

    const photoURL = isLivePreview ? getThumbImageUrl(postUIContext, mediaInfo) :
        getMediumImageUrl(postUIContext, mediaInfo);

    return (
        <>
            <>
                {
                    !isEmpty(photoURL) ? (
                        <Box
                            component={'img'}
                            src={`${photoURL}`}
                            loading="lazy"
                            alt={fieldConfig.label}

                            sx={{
                                maxWidth: '100%',
                                height: 'auto'
                            }}

                        />
                    ) : (
                        <Image/>
                    )
                }
            </>
            {
                props.children
            }
        </>
    );
}

export default ImageBoxBody;