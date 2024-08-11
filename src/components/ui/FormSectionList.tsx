import { MAIN_SECTION } from '../../common/Constants';
import TPostUIProps from '../../common/TPostUIProps';
import { Box, Stack } from '@mui/joy';
import TFieldConfig from '../../common/TFieldConfig';
import Section from '../Section';
import BtnGroup from '../BtnGroup';
import { FormRenderProps } from 'react-final-form';
import { isFunction } from 'lodash';
import React from 'react';
import { PRODUCTFORM_TYPE } from '../../common/TFormConfig';
import ProductSection from '../ProductSection';

type OwnProps = {
    formProps?: FormRenderProps<any, any>;
}

type Props = OwnProps & TPostUIProps;
export default function FormSectionList(props: Props) {
    const {
        formConfig,
        renderBtnGroup,
        renderStepper
    } = props;

    const sections = formConfig.sections[MAIN_SECTION];

    return (
        <Stack
            spacing={2}
            gap={2}
        >
            {
                isFunction(renderStepper) ? (
                    renderStepper(props)
                ) : (
                    <Box></Box>
                )
            }
            {
                sections.map((fieldConfig: TFieldConfig, fieldIndex) => (
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
                ))
            }
            {
                isFunction(renderBtnGroup) ? (
                    renderBtnGroup(props)
                ) : (
                    <BtnGroup
                        {...props}
                    />
                )
            }
        </Stack>
    )

}
