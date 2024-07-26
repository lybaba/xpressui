import { isEmpty } from 'lodash';
import parseErrors from '../../api/parse-errors';
import { ValidateFunction } from 'ajv';
import { TPostUIContext } from './TPostUIState';
import { getSectionByIndex } from '../../api/post';
import TPostConfig from '../../types/TPostConfig';
import TFieldConfig from '../../types/TFieldConfig';
import { getBooleanValue } from '../../api/field';
import LABELS from '../../api/config/labels';


export default function validate(
                            context: TPostUIContext,
                            postConfig: TPostConfig,
                            validator: ValidateFunction<unknown>,
                            sectionIdex: number,
                            formValues: Record<string, any>) {
    validator(formValues);

    const errors = parseErrors(validator.errors);

    const currentSection = getSectionByIndex(postConfig, sectionIdex);
    
    const fields: TFieldConfig[] = currentSection && postConfig.fields.hasOwnProperty(currentSection.name) 
                                    ? postConfig.fields[currentSection.name] : [];

    fields.forEach((fieldConfig: TFieldConfig) => {
        const {
            required = false
        } = fieldConfig;

        const isRequired = getBooleanValue(required);

        if (
            isRequired
            && isEmpty(formValues[fieldConfig.name])    
            && !errors.hasOwnProperty(fieldConfig.name)) {
            errors[fieldConfig.name] = LABELS.requiredField;
        }
    })

    console.log(errors);

    return errors;
}
