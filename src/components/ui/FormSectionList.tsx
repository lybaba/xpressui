import { CUSTOM_SECTION } from '../../common/Constants';
import TPostUIProps from '../../common/TPostUIProps';
import { Container, Stack } from '@mui/joy';
import TFieldConfig, { TCssProps } from '../../common/TFieldConfig';
import Section from '../Section';
import BtnGroup from '../button-group';
import { FormRenderProps } from 'react-final-form';
import React from 'react';
import { PRODUCTFORM_TYPE } from '../../common/TFormConfig';
import ProductSection from '../ProductSection';

import { TFormButtons } from '../../common/formsubmit';
import { TFormStyling } from '../../common/formstyling';
import FormField from '../FormField';
import { TNavBar } from '../../common/navbar';

type OwnProps = {
    formProps?: FormRenderProps<any, any>;
    formButtons: TFormButtons
    formStyling: TFormStyling;
    navBar?: TNavBar;
    cssProps: TCssProps;
}

type Props = OwnProps & TPostUIProps;

export default function FormSectionList(props: Props) {
    const {
        formConfig,
        cssProps
    } = props;


    const sections = formConfig.sections[CUSTOM_SECTION];


    return (
        <Stack
            component={Container}
            spacing={1}
            gap={2}
            {...cssProps.iClassesProps}
            {...cssProps.iElemProps}
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
