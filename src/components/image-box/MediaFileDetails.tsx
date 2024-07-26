

import { Box } from '@mui/joy';
import TFieldConfig from '../../types/TFieldConfig';
import TMediaFile from '../../types/TMediaFile';
import TPostConfig from '../../types/TPostConfig';


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