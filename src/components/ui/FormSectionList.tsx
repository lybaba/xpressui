import { CUSTOM_SECTION } from '../../common/Constants';
import TPostUIProps from '../../common/TPostUIProps';
import { Container, Stack } from '@mui/joy';
import TFieldConfig, { TCssProps } from '../../common/TFieldConfig';
import Section from '../Section';
import { FormRenderProps } from 'react-final-form';
import React from 'react';
import { PRODUCTFORM_TYPE } from '../../common/TFormConfig';
import ProductSection from '../ProductSection';

import { TFormButtons } from '../../common/formsubmit';
import FormField from '../FormField';
import { strToClasses, strToSxProps } from '../../common/field';

type OwnProps = {
    formProps?: FormRenderProps<any, any>;
    formButtons: TFormButtons
}

type Props = OwnProps & TPostUIProps;

export default function FormSectionList(props: Props) {
    const {
        formConfig,
    } = props;

    const bClassesProp = strToClasses(formConfig.bClasses);
    const bSxProps = strToSxProps(formConfig.bSxProps);


    const sections = formConfig.sections[CUSTOM_SECTION];


    return (
        <Stack
            component={Container}
            spacing={1}
            gap={2}
            {...bClassesProp}
            {...bSxProps}
        >
            {/*
                Stepper
                <Box></Box>
            */}
            {
                sections.map((fieldConfig: TFieldConfig, fieldIndex) => {
                    return (
                        formConfig.type === PRODUCTFORM_TYPE ? (
                            <ProductSection
                                key={fieldIndex}
                                {...props}
                                formName={fieldConfig.name}
                                fieldConfig={fieldConfig}
                                fieldIndex={fieldIndex}
                            />
                        ) : (
                            <Section
                                key={fieldIndex}
                                {...props}
                                formName={fieldConfig.name}
                                fieldConfig={fieldConfig}
                                fieldIndex={fieldIndex}
                            />
                        )
                    )
                })
            }
            {
                <FormField
                    {...props}
                    fieldConfig={props.formButtons.btnGroup}
                />
            }
        </Stack>
    )

}
