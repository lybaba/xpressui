import { Stack } from '@mui/joy';
import { usePostUIContext } from '../PostUIProvider';

export default function CustomPost(props: any) {
    const postUIContext = usePostUIContext();

    const {
        postConfig
    } = postUIContext;
    

    return (
        <Stack
            sx={{ flexGrow: 1 }}
        >
            Custom Post
        </Stack>
    );
}

