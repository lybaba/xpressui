

import { Box } from '@mui/joy';
import TFieldConfig from '../../common/TFieldConfig';
import TMediaFile from '../../common/TMediaFile';
import TPostConfig from '../../common/TPostConfig';


type Props = {
    postConfig: TPostConfig;
    fieldConfig: TFieldConfig;
    mediaFile: TMediaFile; 
    isLivePreview: boolean;
};


const MediaFileDetails = (props: Props) => {
    return (
        <Box>
            Details...
        </Box>
    );
}

export default MediaFileDetails;