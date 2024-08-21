import { usePostUIContext } from './PostUIProvider';
import { PropsWithChildren } from 'react';

import { Box } from '@mui/joy';
import getFormButtonsConfig from '../../common/formsubmit';
import TPostUIProps from '../../common/TPostUIProps';
import FormContent from './FormContent';
import getNavBarConfig from '../../common/navbar';
import { WEBAPP_TYPE } from '../../common/TFormConfig';
import WebAppUI from './WebAppUI';


type Props = TPostUIProps & PropsWithChildren;

export default function PostUI(props: Props) {
    const {
        formConfig
    } = props;

    const formButtons = getFormButtonsConfig(props.formConfig);
    const navBar = getNavBarConfig(props.formConfig);


    const postUIContext = usePostUIContext();


    const bgMediaUrl = null;
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
            {
                formConfig.type === WEBAPP_TYPE ? (
                    <WebAppUI
                        {...props} 
                        formButtons={formButtons}
                        navBar={navBar}
                    />
                ) : (
                    <FormContent
                    {...props}
                        formButtons={formButtons}
                        navBar={navBar}
                    />
                )
            }
           
        </Box>
    );
}
