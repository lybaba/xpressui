import { Stack } from '@mui/joy';
import { usePostUIContext } from '../PostUIProvider';
import { PathProps, withRouter } from '../../../common/router';



function CustomPost(props: PathProps) {
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

export default withRouter(CustomPost)