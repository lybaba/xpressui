import { Stack } from '@mui/joy';
import TPostUIProps from 'src/common/TPostUIProps';

export default function CustomPost(props: TPostUIProps) {
    const {
        postConfig
    } = props;
    

    return (
        <Stack
            sx={{ flexGrow: 1 }}
        >
            Custom Post
        </Stack>
    );
}

