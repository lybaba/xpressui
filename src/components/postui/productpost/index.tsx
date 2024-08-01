import { Stack } from '@mui/joy';
import { usePostUIContext } from '../PostUIProvider';



export default function ProductPost(props: any) {
    const postUIContext = usePostUIContext();

    const {
        postConfig
    } = postUIContext;
    

    return (
        <Stack
            sx={{ flexGrow: 1 }}
        >
            Product Post
        </Stack>
    );
}