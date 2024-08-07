import {
    Box,
} from "@mui/joy";

import { Image } from "@mui/icons-material";
import { isEmpty } from "lodash";
import { getMediumImageUrl, getThumbImageUrl } from "../../common/post";
import { usePostUIContext } from "../ui/PostUIProvider";
import TFormFieldProps from "../../common/TFormFieldProps";

export const ImageBoxBody = (props: TFormFieldProps) => {
    const {
        fieldConfig,
    } = props;

    const {
        mediaInfo
    } = fieldConfig;

    const postUIContext = usePostUIContext();

    const {
        isLivePreview
    } = postUIContext;

    if (!mediaInfo)
        return (
            <>
                <Image/>
                {
                    props.children
                }
            </>
        )

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