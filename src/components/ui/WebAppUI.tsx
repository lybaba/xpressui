import { usePostUIContext } from './PostUIProvider';
import { PropsWithChildren, useCallback, useState } from 'react';
import { TFormButtons } from '../../common/formsubmit';

import TPostUIProps from '../../common/TPostUIProps';
import TFieldConfig, { TCssProps } from '../../common/TFieldConfig';
import { TNavBar } from '../../common/navbar';
import { Box, Typography } from '@mui/joy';
import { IMAGE_TYPE } from '../../common/field';
import TFormConfig from '../../common/TFormConfig';
import { CUSTOM_SECTION } from '../../common/Constants';
import { getMediaUrlByMediaId } from '../../common/post';
import { MediaSizeType } from '../../common/TMediaFile';


type OwnProps = {
    formButtons: TFormButtons
    navBar?: TNavBar;
}


type Props = OwnProps & TPostUIProps & PropsWithChildren;


// ==========================================================
/*export function getHeroImageUrl(formConfig: TFormConfig): string | null {
    const postUIContext = usePostUIContext();

    if (formConfig.sections[CUSTOM_SECTION] && formConfig.sections[CUSTOM_SECTION].length) {
        const mainSection: TFieldConfig = formConfig.sections[CUSTOM_SECTION][0];
        if (mainSection.hero) {
            const heroFieldConfig = {
                type: IMAGE_TYPE,
                name: HERO_FIELD_NAME,
                label: HERO_FIELD_LABEL,
                mediaId: mainSection.hero
            }

            return getMediaUrlByMediaId(postUIContext, formConfig, heroFieldConfig, MediaSizeType.Large);
        }
    }

    return null;
}*/


export default function WebAppUI(props: Props) {
    const {
        formConfig,
    } = props;

    const heroImageUrl =''
    console.log(444444444444, heroImageUrl, " ", formConfig.sections[CUSTOM_SECTION][0])


    if (heroImageUrl) {
        return (
            <Box
                sx={{
                    width: '100vw',
                    height: '100vh',
                    backgroundImage: `url(${heroImageUrl})`,
                    backgroundPosition: 'center center',
                    backgroundSize: 'cover'
                }}
            >
                <Box
                    sx={{
                        p: 2,
                    }}
                >
                    <Typography component={'h1'} level='h1' textColor="#fff">Welcome</Typography>
                    <Typography component={'h2'} level='h4' textColor="#fff">Are you ready to see Toronto in a entirely new way ?</Typography>
                </Box>
            </Box>
        )
    } else {
        return (
            <Box>Hello World....</Box>
        )
    }
}
