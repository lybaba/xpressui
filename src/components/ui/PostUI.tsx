import { getBodyFormConfig, getMediaUrlByMediaId } from '../../common/post';
import { usePostUIContext } from './PostUIProvider';
import { PropsWithChildren } from 'react';

import { Box, Stack } from '@mui/joy';
import getFormSubmitConfig from '../../common/formsubmit';
import getFormStylingConfig from '../../common/formstyling';
import TPostUIProps from '../../common/TPostUIProps';
import PostContent from './PostContent';
import { MediaSizeType } from '../../common/TMediaFile';


type Props = TPostUIProps & PropsWithChildren;

export default function PostUI(props: Props) {
    const formSubmit = getFormSubmitConfig(props.formConfig);
    const formStyling = getFormStylingConfig(props.formConfig);
    const formConfig = getBodyFormConfig(props.formConfig);

    const postUIContext = usePostUIContext();
    const bgMediaUrl = getMediaUrlByMediaId(postUIContext, formConfig, formStyling.background, MediaSizeType.Large);
    const bgProps = bgMediaUrl ? {
        sx: {
            background: `url(${bgMediaUrl})`,
            backgroundAttachment: 'fixed',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            paddingBottom: '1em',
            maxWidth: '100vw',
            height: '100vh',
        }
    } : {}


    return (
        <Box
            {...bgProps}
        >
            <Stack
                {...formStyling.section.cClassesProps}
                sx={{
                    p: 2,
                    ...formStyling.section.cSxPropsProps?.sx,
                    alignItems: 'center',
                }}
            >
                <PostContent
                    {...props}
                    formConfig={formConfig}
                    formStyling={formStyling}
                    formSubmit={formSubmit}
                />
            </Stack>
        </Box>
    );
}
