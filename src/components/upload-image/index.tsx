import {
    Button,
    Tooltip,
    AspectRatio,
    Input,
    Box,
} from "@mui/joy";

import { FileUploadRounded, Image } from "@mui/icons-material";
import { isEmpty } from "lodash";
import TFormFieldProps from '../../common/TFormFieldProps';
import { usePostUIContext } from "../ui/PostUIProvider";
import { getMediaUrlByMediaId } from "../../common/post";
import MESSAGES from "../../common/messages";


export const UploadImage = (props: TFormFieldProps) => {
    const {
        fieldConfig,
        input = null,
    } = props;

    const inputProps = input ? input : {};

    const postUIContext = usePostUIContext();

    const url = getMediaUrlByMediaId(postUIContext, { ...fieldConfig, mediaId: input?.value });


    return (
        <Box
            sx={{
                width: '100%'
            }}
        >
            <Input
                type={'text'}
                variant="outlined"
                {...inputProps}
                placeholder={MESSAGES.imageInputHelp}
                startDecorator={
                    <AspectRatio
                        sx={{
                            minWidth: 60,
                            maxWidth: 60,
                            maxHeight: 60
                        }}
                    >
                        {
                            isEmpty(url) ? (
                                <Image />
                            ) : (
                                <Box
                                    component={'img'}
                                    alt={fieldConfig.label}
                                    src={url}
                                    sx={{
                                        maxWidth: '100%',
                                        height: 'auto'
                                    }}
                                />
                            )
                        }

                    </AspectRatio>
                }
                endDecorator={
                        <Tooltip title={MESSAGES.uploadImage}>
                            <Button
                                variant="plain"
                                sx={{ gap: 2, p: 1 }}
                                onClick={(e) => {
                                }}
                            >
                                <AspectRatio
                                    sx={{
                                        minWidth: 60,
                                        maxWidth: 60,
                                        maxHeight: 60
                                    }}
                                >
                                    <FileUploadRounded />
                                </AspectRatio>
                            </Button>
                        </Tooltip>
                }
            />
        </Box>
    )

}



export default UploadImage;