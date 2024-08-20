import { getMediaUrlByMediaId } from '../../common/post';
import { usePostUIContext } from './PostUIProvider';
import { PropsWithChildren } from 'react';

import { Box } from '@mui/joy';
import getFormButtonsConfig from '../../common/formsubmit';
import getFormStylingConfig from '../../common/formstyling';
import TPostUIProps from '../../common/TPostUIProps';
import FormContent from './FormContent';
import { MediaSizeType } from '../../common/TMediaFile';
import { getCssProps } from '../../common/field';
import getNavBarConfig from '../../common/navbar';
import { WEBAPP_TYPE } from '../../common/TFormConfig';
import WebAppUI from './WebAppUI';


type Props = TPostUIProps & PropsWithChildren;

export default function PostUI(props: Props) {
    const {
        formConfig
    } = props;

    const formButtons = getFormButtonsConfig(props.formConfig);
    const formStyling = getFormStylingConfig(props.formConfig);
    const navBar = getNavBarConfig(props.formConfig);


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
            {
                formConfig.type === WEBAPP_TYPE ? (
                    <WebAppUI
                        {...props} 
                        formStyling={formStyling}
                        formButtons={formButtons}
                        navBar={navBar}
                        cssProps={cssProps}
                    />
                ) : (
                    <FormContent
                    {...props}
                        formStyling={formStyling}
                        formButtons={formButtons}
                        navBar={navBar}
                        cssProps={cssProps}
                    />
                )
            }
           
        </Box>
    );
}
