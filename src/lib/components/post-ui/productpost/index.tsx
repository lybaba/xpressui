import { Stack } from '@mui/joy';
import { usePostUIContext } from '../PostUIProvider';
import { PathProps, withRouter } from '../../../common/router';



function ProductPost(props: PathProps) {
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

export default withRouter(ProductPost)