import { FormRenderProps } from 'react-final-form'
import { Stack } from '@mui/joy';
import TFieldConfig from '../../common/TFieldConfig';
import PostField from '../PostField';
import { getSectionFields } from '../../common/post';
import { usePostUIContext } from './PostUIProvider';

type OwnProps = {
    section: TFieldConfig;
    formProps: FormRenderProps<any, any>
}

type Props = OwnProps;


export default function SectionForm(props: Props) {
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
