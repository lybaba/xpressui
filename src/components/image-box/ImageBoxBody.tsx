import {
    AspectRatio,
    Box,
} from "@mui/joy";

import { Image } from "@mui/icons-material";
import { isEmpty } from "lodash";
import { getMediumImageUrl, getThumbImageUrl } from "../../common/post";
import { usePostUIContext } from "../postui/PostUIProvider";
import TMediaFile from "../../common/TMediaFile";
import TPostFieldProps from "../../common/TPostFieldProps";

type OwnProps = {
    mediaFile: TMediaFile; 
}

type Props = OwnProps & TPostFieldProps;

export const ImageBoxBody = (props: Props) => {
    const {
        postConfig,
        fieldConfig,
        mediaFile,
        isLivePreview,
        user = null,
        elemProps,
    } = props;

    const postUIContext = usePostUIContext();

    const photoURL = isLivePreview ? getThumbImageUrl(postUIContext, postConfig, mediaFile, user) :
                                     getMediumImageUrl(postUIContext, postConfig, mediaFile, user);

    const metadata = isLivePreview ? mediaFile.metadata.thumb : mediaFile.metadata.medium;

    return (
        <>
        <AspectRatio
            ratio={`${metadata.width}/${metadata.height}`}
            sx={{
                borderRadius: 'md',
                maxWidth: Number(metadata.width),
                maxHeight: Number(metadata.height),
                width: '100%'
            }}
            {...elemProps}
        >
            {
                !isEmpty(photoURL) ? (
                    <Box
                        component={'img'}
                        src={`${photoURL}`}
                        loading="lazy"
                        alt={fieldConfig.label}

                    />
                ) : (
                    <Image />
                )
            }
        </AspectRatio>
        {
             props.children
        }
        </>
    );
}

export default ImageBoxBody;