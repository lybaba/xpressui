import TPostUIProps from '../../../common/TPostUIProps';
import { Box, Typography } from '@mui/joy';
import { getCssProps } from '../../../common/field';
import TFieldConfig from '../../../common/TFieldConfig';

type OwnProps = {
    headerTitleConfig: TFieldConfig;
}
type Props = OwnProps & TPostUIProps;


export default function HeaderTitle(props: Props) {
    const {
        formConfig,
        headerTitleConfig
    } = props;

    const cssProps = getCssProps(headerTitleConfig);


    return (
        <Box
            {...cssProps.blockClasses}
            {...cssProps.blockProps}
        >
            <Typography
                component={"h1"}
                level="h2"
                className="header-logo"
            >
                {
                    formConfig.label
                }
            </Typography>
        </Box>
    )
}
