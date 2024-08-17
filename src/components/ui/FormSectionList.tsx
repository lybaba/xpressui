import { MAIN_SECTION } from '../../common/Constants';
import TPostUIProps from '../../common/TPostUIProps';
import { Stack } from '@mui/joy';
import TFieldConfig, { TCssProps } from '../../common/TFieldConfig';
import Section from '../Section';
import BtnGroup from '../BtnGroup';
import { FormRenderProps } from 'react-final-form';
import React from 'react';
import { PRODUCTFORM_TYPE } from '../../common/TFormConfig';
import ProductSection from '../ProductSection';

import { TFormSubmit } from '../../common/formsubmit';
import { TFormStyling } from '../../common/formstyling';

type OwnProps = {
    formProps?: FormRenderProps<any, any>;
    formSubmit: TFormSubmit
    formStyling: TFormStyling;
    cssProps: TCssProps;
}

type Props = OwnProps & TPostUIProps;

export default function FormSectionList(props: Props) {
    const {
        formConfig,
        formStyling,
        cssProps
    } = props;


    const sections = formConfig.sections[MAIN_SECTION];


    return (
        <Stack
            spacing={2}
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
                <BtnGroup
                    {...props}
                />
            }
        </Stack>
    )

}
