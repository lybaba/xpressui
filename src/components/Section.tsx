import TFieldConfig from '../common/TFieldConfig';
import { Stack } from '@mui/joy';
import { usePostUIContext } from './ui/PostUIProvider';
import { MULTI_STEP_FORM_TYPE } from '../common/TFormConfig';
import FormField from './FormField';
import TFormFieldProps from '../common/TFormFieldProps';


function Section(props: TFormFieldProps) {
    const {
        fieldConfig,
        fieldIndex,
        formConfig,
    } = props;

    const sectionConfig = fieldConfig;
    const sectionIndex = fieldIndex;

    const postUIContext = usePostUIContext();
    const {
        currentStepIndex,
    } = postUIContext

    const isMultiStepForm = formConfig.type === MULTI_STEP_FORM_TYPE;

    const showSection = !isMultiStepForm || currentStepIndex === sectionIndex;

    if (! formConfig.sections || ! formConfig.sections[sectionConfig.name])
        return null;
    
    const fields = formConfig.sections[sectionConfig.name];

    return showSection && (
        <Stack
            spacing={2}
            gap={2}
        >
            {
                fields.map((fieldConfig: TFieldConfig, index) => (
                    <FormField
                        key={index}
                        {...props}
                        formName={sectionConfig.name}
                        fieldConfig={fieldConfig}
                        fieldIndex={index}
                    />
                ))
            }
        </Stack>
    )
}

export default Section;