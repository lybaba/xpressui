import {
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
    } = props;

    const postUIContext = usePostUIContext();

    const photoURL = isLivePreview ? getThumbImageUrl(postUIContext, postConfig, mediaFile) :
        getMediumImageUrl(postUIContext, postConfig, mediaFile);

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
                        <Image

                        />
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