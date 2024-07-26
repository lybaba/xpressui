import { Stack } from '@mui/joy';
import { PathProps, withRouter } from '../../../common/router';


function AdvancedForm(props: PathProps) {
    return (
        <Stack
            sx={{ flexGrow: 1 }}
        >
            Advanced Form
        </Stack>
    );
}

export default withRouter(AdvancedForm)