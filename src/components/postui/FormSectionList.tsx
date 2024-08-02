import { BUILDER_TAB_FORMS } from 'src/common/Constants';
import TPostUIProps from '../../common/TPostUIProps';
import { Stack } from '@mui/joy';
import TFieldConfig from 'src/common/TFieldConfig';
import Section from '../Section';
import BtnGroup from '../BtnGroup';
import { FormRenderProps } from 'react-final-form';
import { usePostUIContext } from './PostUIProvider';

type OwnProps = {
    formProps: FormRenderProps<any, any>;
}

type Props = OwnProps & TPostUIProps;
export default function FormSectionList(props: Props) {
    const {
        postConfig,
    } = props;

    const sections = postConfig.fields[BUILDER_TAB_FORMS];

    const {
        mediaFilesMap
    } = usePostUIContext();

    return (
        <Stack
            spacing={2}
            gap={2}
        >
            {
                sections.map((fieldConfig: TFieldConfig, fieldIndex) => (
                    <Section
                        key={fieldIndex}
                        {...props}
                        mediaFilesMap={mediaFilesMap}
                        formName={fieldConfig.name}
                        fieldConfig={fieldConfig}
                        fieldIndex={fieldIndex}
                        parentFieldConfig={postConfig}
                    />
                ))
            }
            <BtnGroup
                {...props}
            />
        </Stack>
    )
   
}
