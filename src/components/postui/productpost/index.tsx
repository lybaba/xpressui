import { Stack } from '@mui/joy';
import { usePostUIContext } from '../PostUIProvider';
import TPostUIProps from 'src/common/TPostUIProps';



export default function ProductPost(props: TPostUIProps) {
    return (
        <Stack
            sx={{ flexGrow: 1 }}
        >
            Product Post
        </Stack>
    );
}