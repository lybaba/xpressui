import { Stack } from '@mui/joy';
import { PathProps, withRouter } from '../../router';


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