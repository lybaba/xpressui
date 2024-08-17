import { getBodyFormConfig, getMediaUrlByMediaId } from '../../common/post';
import { usePostUIContext } from './PostUIProvider';
import { PropsWithChildren } from 'react';

import { Box, Stack } from '@mui/joy';
import getFormButtonsConfig from '../../common/formsubmit';
import getFormStylingConfig from '../../common/formstyling';
import TPostUIProps from '../../common/TPostUIProps';
import PostContent from './PostContent';
import { MediaSizeType } from '../../common/TMediaFile';
import { getCssProps } from '../../common/field';


type Props = TPostUIProps & PropsWithChildren;

export default function PostUI(props: Props) {
    const formButtons = getFormButtonsConfig(props.formConfig);
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

    const cssProps = getCssProps(formStyling.section);

    return (
        <Box
            {...bgProps}
        >
            <Box
                {...cssProps.cClassesProps}
                sx={{
                    p: 2,
                    alignItems: 'center',
                }}
                {...cssProps?.cElemProps}
            >
                <PostContent
                    {...props}
                    formConfig={formConfig}
                    formStyling={formStyling}
                    formButtons={formButtons}
                    cssProps={cssProps}
                />
            </Box>
        </Box>
    );
}
