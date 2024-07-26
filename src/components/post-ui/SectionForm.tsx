import { FormRenderProps } from 'react-final-form'
import { Stack } from '@mui/joy';
import TFieldConfig from '../../types/TFieldConfig';
import PostField from '../PostField';
import { getSectionFields } from '../../api/post';
import { usePostUIContext } from './PostUIProvider';
import { PathProps, withRouter } from '../../common/router';

type OwnProps = {
    section: TFieldConfig;
    formProps: FormRenderProps<any, any>
}

type Props = OwnProps & PathProps;


function SectionFormBody(props: Props) {
    const postUIContext = usePostUIContext();

    const {
        postConfig,
        mediaFilesMap
    } = postUIContext;

    const {
        section,
        formProps
    } = props;


    /*const getValidator = useCallback(() => {
        const schema = buildSchema(postConfig, groupName);
        console.log("___validator______schema ", schema);

        const validator = ajv.compile(schema);
        return validator;
    }, [groupName])*/


    if (!section)
        return null;

    const fields = getSectionFields(postConfig, section.name)

    return (
        <Stack
            spacing={2}
            gap={2}
        >
            <Stack
                spacing={2}
                gap={2}
                sx={{
                    p: 3,
                }}
            >
                {
                    fields.map((fieldConfig: TFieldConfig, index: number) => (
                        <PostField
                            key={index}
                            formProps={formProps}
                            postConfig={postConfig}
                            formName={section.name}
                            fieldConfig={fieldConfig}
                            parentFieldConfig={section}
                            mediaFilesMap={mediaFilesMap}
                            fieldIndex={index}
                        />
                    ))
                }
            </Stack>
        </Stack>
    );
}

const SectionForm = withRouter(SectionFormBody);

export default SectionForm;