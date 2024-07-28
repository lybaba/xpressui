import TFieldConfig from '../types/TFieldConfig';
import { Stack } from '@mui/joy';
import PostFieldProps from './PostFieldProps';
import { usePostUIContext } from './post-ui/PostUIProvider';
import { MULTI_STEP_FORM_TYPE } from '../api/post';
import PostField from './PostField';


function Section(props: PostFieldProps) {
    const {
        fieldConfig,
        fieldIndex,
        formProps
    } = props;

    const sectionConfig = fieldConfig;
    const sectionIndex = fieldIndex;

    const postUIContext = usePostUIContext();
    const {
        postConfig,
        currentStepIndex,
        mediaFilesMap
    } = postUIContext

    const isMultiStepForm = postConfig.type === MULTI_STEP_FORM_TYPE;

    const showSection = !isMultiStepForm || currentStepIndex === sectionIndex;

    if (! postConfig.fields || ! postConfig.fields[sectionConfig.name])
        return null;
    
    const fields = postConfig.fields[sectionConfig.name];

    return showSection && (
        <Stack
            spacing={2}
            gap={2}
        >
            {
                fields.map((fieldConfig: TFieldConfig, index) => (
                    <PostField
                        key={index}
                        formProps={formProps}
                        postConfig={postConfig}
                        formName={sectionConfig.name}
                        fieldConfig={fieldConfig}
                        fieldIndex={index}
                        parentFieldConfig={sectionConfig}
                        mediaFilesMap={mediaFilesMap}
                    />
                ))
            }
        </Stack>
    )
}

export default Section;