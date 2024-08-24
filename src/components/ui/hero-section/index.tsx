import TPostUIProps from '../../../common/TPostUIProps';
import { Box } from '@mui/joy';
import { TPageConfig } from '../../../common/page';

type OwnProps = {
    pageConfig: TPageConfig;
}
type Props = OwnProps& TPostUIProps;


export default function HeroSection(props: Props) {
    const {
        formConfig,
        pageConfig
    } = props;

    const heroImageUrl = pageConfig?.heroSectionConfig?.hero;
    console.log(444444444444, " ", pageConfig)

    const heroImageProps = heroImageUrl ? {
        sx: {
            width: '100vw',
            height: '100vh',
            backgroundImage: `url(${heroImageUrl})`,
            backgroundPosition: 'center center',
            backgroundSize: 'cover'
        }

    } : {}


    return (
       <Box>
        Header
       </Box>
    )
}
