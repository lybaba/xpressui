import { MAIN_SECTION } from '../../common/Constants';
import TPostUIProps from '../../common/TPostUIProps';
import { Stack } from '@mui/joy';
import TFieldConfig from '../../common/TFieldConfig';
import Section from '../Section';
import BtnGroup from '../BtnGroup';
import { FormRenderProps } from 'react-final-form';
import React from 'react';
import { PRODUCTFORM_TYPE } from '../../common/TFormConfig';
import ProductSection from '../ProductSection';
import { getFieldConfigWithCssProps } from '../../common/field';

import { TFooterConfig } from '../../common/footer';
import { THeadingConfig } from '../../common/heading';

type OwnProps = {
    formProps?: FormRenderProps<any, any>;
    footerConfig: TFooterConfig
    headingConfig: THeadingConfig;
}

type Props = OwnProps & TPostUIProps;

export default function FormSectionList(props: Props) {
    const {
        formConfig,
    } = props;


    const sections = formConfig.sections[MAIN_SECTION];


    return (
        <Stack
            spacing={2}
            gap={2}
            {...formConfig.fClassesProps}
            {...formConfig.fSxPropsProps}
        >
            {/*
                Stepper
                <Box></Box>
            */}
            {
                sections.map((tmpFieldConfig: TFieldConfig, fieldIndex) => {
                    const fieldConfig = getFieldConfigWithCssProps(tmpFieldConfig);

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
