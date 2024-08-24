import { PropsWithChildren, useCallback, useState } from 'react';
import TPostUIProps from '../../common/TPostUIProps';
import { Box, Typography } from '@mui/joy';
import getPageConfig from '../../common/page';
import { strToClasses, strToSxProps } from '../../common/field';
import HeaderSection from './header';

type Props = TPostUIProps & PropsWithChildren;


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


    const bClassesProp = strToClasses(formConfig.bClasses);
    const bSxProps = strToSxProps(formConfig.bSxProps);


    const pageConfig = getPageConfig(formConfig);




    return (
        <Box
            {...bClassesProp}
            {...bSxProps}
        >
          <HeaderSection {...props} pageConfig={pageConfig} />
        </Box>
    )
}
