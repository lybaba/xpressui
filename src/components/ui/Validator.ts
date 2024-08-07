import { isEmpty } from 'lodash';
import parseErrors from '../../common/parse-errors';
import { ValidateFunction } from 'ajv';
import { TPostUIContext } from './TPostUIState';
import { getSectionByIndex, shouldRenderField } from '../../common/post';
import TFormConfig from '../../common/TFormConfig';
import TFieldConfig from '../../common/TFieldConfig';
import { getBooleanValue } from '../../common/field';

const REQUIRED_FIELD_MSG = 'This field is required';

export default function validate(
                            context: TPostUIContext,
                            formConfig: TFormConfig,
                            validator: ValidateFunction<unknown>,
                            sectionIdex: number,
                            formValues: Record<string, any>) {
    validator(formValues);

    const errors = parseErrors(validator.errors);

    const currentSection = getSectionByIndex(formConfig, sectionIdex);
    
    const fields: TFieldConfig[] = currentSection && formConfig.sections.hasOwnProperty(currentSection.name) 
                                    ? formConfig.sections[currentSection.name] : [];

    fields.forEach((fieldConfig: TFieldConfig) => {
        const {
            required = false
        } = fieldConfig;

        const isRequired = getBooleanValue(required);

        if (
            isRequired
            && shouldRenderField(formConfig, fieldConfig)
            && isEmpty(formValues[fieldConfig.name])    
            && !errors.hasOwnProperty(fieldConfig.name)) {
            errors[fieldConfig.name] = REQUIRED_FIELD_MSG;
        }
    })

    console.log(errors);

    return errors;
}
