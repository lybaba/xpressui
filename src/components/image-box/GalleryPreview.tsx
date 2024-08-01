import {
    AspectRatio,
    Box,
    ButtonGroup,
    Divider,
    IconButton,
    Modal,
    ModalClose,
    ModalDialog,
    Stack,
    Typography,
} from '@mui/joy';
import { useModalContext } from '../ModalProvider';
import TMediaFile from '../../common/TMediaFile';
import MediaFileDetails from './MediaFileDetails';
import { ChevronLeftOutlined, ChevronRightRounded } from '@mui/icons-material';
import { usePostUIContext } from '../postui/PostUIProvider';
import { getLargeImageUrl } from '../../common/post';
import TPostConfig from '../../common/TPostConfig';
import TFieldConfig from '../../common/TFieldConfig';
import { useEffect, useState } from 'react';

type MediaPhotoProps = {
    postConfig: TPostConfig;
    fieldConfig: TFieldConfig;
    mediaFile: TMediaFile; 
    isLivePreview: boolean;
}
const MediaPhoto = (props: MediaPhotoProps) => {
    const {
        mediaFile,
        postConfig
    } = props;

    const postUIContext = usePostUIContext();

    const photoURL = getLargeImageUrl(postUIContext, postConfig, mediaFile);

    const metadata = mediaFile.metadata.large;

    return (
        <AspectRatio
            ratio={`${metadata.width}/${metadata.height}`}
            sx={{
                borderRadius: 'md',
                maxWidth: Number(metadata.width),
                maxHeight: Number(metadata.height),
                width: '100%'
            }}
        >
            <Box
                component={'img'}
                src={`${photoURL}`}
                alt={mediaFile.label}
                sx={{
                    backgroundColor: 'background.surface',
                }}
            />
        </AspectRatio>
    );
}


function GalleryPreview(props: any) {
    const [currentMediaFile, stCurrentMediaFile] = useState<TMediaFile> (props.mediaFile);

    const {
        fieldConfig,
    } = props;


    const modalContext = useModalContext();
    const {
        modalAction,
        setModalAction
    } = modalContext;


    const open = modalAction.modalName === fieldConfig.id ? modalAction.isModalOpen : false;

    useEffect(() => {
        stCurrentMediaFile(props.mediaFile);
    },[props.mediaFile.id])

    const onClose = () => {
        setModalAction({
            modalName: fieldConfig.id,
            isModalOpen: false
        })
    }

    const onPrevBtnClick = () => {

    }

    const onNextBtnClick = () => {

    }

    return (
        <Modal
            open={open}
            onClose={onClose}
        >
            <ModalDialog
                sx={{
                    border: '1px solid',
                    borderRadius: '8px 8px 0 0',
                    backgroundColor: 'background.popup',
                    borderColor: 'neutral.outlinedBorder',
                    boxShadow: 'lg',
                    height: '95vh',
                    width: '95vw',
                    m: 1
                }}

            >
                {
                    open && (
                        <>
                            <Box sx={{ mb: 2 }}>
                                <Stack
                                    direction={"row"}
                                    justifyContent={"space-between"}
                                    sx={{
                                        mr: 32
                                    }}
                                >
                                    <Typography level="title-lg">
                                        {
                                            currentMediaFile && currentMediaFile.label
                                        }
                                    </Typography>
                                    <ButtonGroup
                                        spacing={5}
                                    >
                                        <IconButton
                                            onClick={onPrevBtnClick}
                                        >
                                            <ChevronLeftOutlined />
                                        </IconButton>

                                        <IconButton
                                            onClick={onNextBtnClick}
                                        >
                                            <ChevronRightRounded />
                                        </IconButton>
                                    </ButtonGroup>
                                </Stack>
                                <ModalClose
                                    id="close-icon"
                                    onClick={onClose}
                                    variant='solid'
                                    sx={{
                                        m: 2
                                    }}
                                />
                            </Box>
                            <Divider inset="none" />
                            <Stack
                                justifyContent={"space-between"}
                                direction={{ xs: 'column', sm: 'row' }}
                                gap={2}
                                sx={{
                                    overflow: 'auto',
                                    p: 2
                                }}
                            >
                                <Box
                                    sx={{
                                        width: { sm: '100vw', md: '70vw' }
                                    }}
                                >
                                    {
                                        currentMediaFile && (
                                            <MediaPhoto  {...props} mediaFile={currentMediaFile} />
                                        )
                                    }
                                </Box>
                                <Box
                                    sx={{
                                        width: { sm: '100vw', md: '30vw' }
                                    }}
                                >
                                    <MediaFileDetails {...props} />
                                </Box>
                            </Stack>
                        </>
                    )
                }
            </ModalDialog>
        </Modal>
    );
}

export default GalleryPreview;