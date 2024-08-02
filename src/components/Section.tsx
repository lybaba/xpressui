import TFieldConfig from '../common/TFieldConfig';
import { Stack } from '@mui/joy';
import { usePostUIContext } from './postui/PostUIProvider';
import { MULTI_STEP_FORM_TYPE } from '../common/TPostConfig';
import PostField from './PostField';
import TPostFieldProps from 'src/common/TPostFieldProps';


function Section(props: TPostFieldProps) {
    const {
        fieldConfig,
        fieldIndex,
        postConfig,
    } = props;

    const sectionConfig = fieldConfig;
    const sectionIndex = fieldIndex;

    const postUIContext = usePostUIContext();
    const {
        currentStepIndex,
    } = postUIContext

    const isMultiStepForm = postConfig.type === MULTI_STEP_FORM_TYPE;

    console.log("_____sectionConfig ", sectionConfig)
    console.log("_____sectionConfig-postConfig.fields ", postConfig.fields)

    const showSection = !isMultiStepForm || currentStepIndex === sectionIndex;

    if (! postConfig.fields || ! postConfig.fields[sectionConfig.name])
        return null;
    
    const fields = postConfig.fields[sectionConfig.name];
    console.log("_____sectionConfig-currentStepIndex ", currentStepIndex, sectionIndex, showSection)

    return showSection && (
        <Stack
            spacing={2}
            gap={2}
        >
            {
                fields.map((fieldConfig: TFieldConfig, index) => (
                    <PostField
                        key={index}
                        {...props}
                        formName={sectionConfig.name}
                        fieldConfig={fieldConfig}
                        fieldIndex={index}
                        parentFieldConfig={sectionConfig}
                    />
                ))
            }
        </Stack>
    )
}

export default Section;