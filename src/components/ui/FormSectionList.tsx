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
import { getBodyFormConfig } from '../../common/post';
import { getFieldConfigWithCssProps, strToClasses, strToSxProps } from '../../common/field';

import getFooterConfig from '../../common/footer';

type OwnProps = {
    formProps?: FormRenderProps<any, any>;
}

type Props = OwnProps & TPostUIProps;

export default function FormSectionList(props: Props) {
    const {
        formConfig,
    } = props;

    const {
        fClasses = null,
        fSxProps = null
    } = formConfig;

    const cssClassesProps = strToClasses(fClasses);
    const cSxProps = strToSxProps(fSxProps);

    const bodyFormConfig = getBodyFormConfig(formConfig);

    const footerConfig = getFooterConfig(formConfig);

    const sections = bodyFormConfig.sections[MAIN_SECTION];


    return (
        <Stack
            spacing={2}
            gap={2}
            {...cssClassesProps}
            {...cSxProps}
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
                                rootFormConfig={formConfig}
                                formConfig={bodyFormConfig}
                                formName={fieldConfig.name}
                                fieldConfig={fieldConfig}
                                fieldIndex={fieldIndex}
                            />
                        ) : (
                            <Section
                                key={fieldIndex}
                                {...props}
                                rootFormConfig={formConfig}
                                formConfig={bodyFormConfig}
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
                    footerConfig={footerConfig}
                />
            }
        </Stack>
    )

}
