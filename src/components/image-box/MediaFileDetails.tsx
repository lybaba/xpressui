

import { Box } from '@mui/joy';
import TFieldConfig from '../../common/TFieldConfig';
import TMediaFile from '../../common/TMediaFile';
import TFormConfig from '../../common/TFormConfig';


type Props = {
    formConfig: TFormConfig;
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