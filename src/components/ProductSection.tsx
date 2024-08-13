import TFieldConfig from '../common/TFieldConfig';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/joy';
import { usePostUIContext } from './ui/PostUIProvider';
import { MULTI_STEP_FORM_TYPE } from '../common/TFormConfig';
import FormField from './FormField';
import TFormFieldProps from '../common/TFormFieldProps';
import { isFunction } from 'lodash';
import React from 'react';
import { getFieldConfigWithCssProps } from '../common/field';


function ProductSection(props: TFormFieldProps) {
    const {
        fieldConfig,
        fieldIndex,
        formConfig,
        renderSection,
        renderField
    } = props;

    const sectionConfig = fieldConfig;
    const sectionIndex = fieldIndex;

    const postUIContext = usePostUIContext();
    const {
        currentStepIndex,
    } = postUIContext

    const isMultiStepForm = formConfig.type === MULTI_STEP_FORM_TYPE;

    const showSection = !isMultiStepForm || currentStepIndex === sectionIndex;

    if (!formConfig.sections || !formConfig.sections[sectionConfig.name])
        return null;

    const fields = formConfig.sections[sectionConfig.name];

    return showSection && (
        isFunction(renderSection) ? (
            renderSection(props, fields)
        ) : (

            <Card>
                <Typography
                    component={'h6'}
                    level='title-md'
                >
                    {sectionConfig.label}
                </Typography>
                <Divider />
                <CardContent
                    sx={{
                        p: 1
                    }}
                >
                    <Stack
                        spacing={2}
                        gap={2}

                    >
                        {
                            fields.map((tmpFieldConfig: TFieldConfig, index) => {
                                const fieldConfig = getFieldConfigWithCssProps(tmpFieldConfig);

                                return (
                                    isFunction(renderField) ? (
                                        <React.Fragment key={fieldIndex}>
                                            {
                                                renderField(
                                                    {
                                                        ...props,
                                                        formName: sectionConfig.name,
                                                        fieldConfig,
                                                        fieldIndex: index
                                                    })
                                            }
                                        </React.Fragment>
                                    ) : (
                                        <FormField
                                            key={index}
                                            {...props}
                                            formName={sectionConfig.name}
                                            fieldConfig={fieldConfig}
                                            fieldIndex={index}
                                        />
                                    )
                                )
                            })
                        }
                    </Stack>
                </CardContent>
            </Card>
        )
    )
}

export default ProductSection;