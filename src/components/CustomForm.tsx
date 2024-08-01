import { usePostUIContext } from './postui/PostUIProvider';
import { FormRenderProps } from 'react-final-form';
import parse, { attributesToProps, HTMLReactParserOptions } from 'html-react-parser';
import { getFieldConfigByIndex, getSectionByIndex } from '../common/post';
import CustomSection from './CustomSection';
import CustomField from './CustomField';
import {
    FIELD_TYPE,
    BTN_GROUP_TYPE,
    INPUT_TYPE,
    LABEL_TYPE,
    NEXT_BTN_INPUT_TYPE,
    NEXT_BTN_LABEL_TYPE,
    PREV_BTN_INPUT_TYPE,
    PREV_BTN_LABEL_TYPE,
    SECTION_TYPE,
    SUBMIT_BTN_INPUT_TYPE,
    SUBMIT_BTN_LABEL_TYPE,
    STEPPER_TYPE,
    BUILDER_TAB_FORMS,
} from '../common/Constants';
import CustomFieldInput from './CustomFieldInput';
import CustomFieldLabel from './CustomFieldLabel';
import CustomBtnGroup from './CustomBtnGroup';
import React from 'react';
import CustomStepper from './CustomStepper';
import { isEmpty } from 'lodash';
import TFieldConfig from '../common/TFieldConfig';
import { Stack } from '@mui/joy';
import Section from './Section';
import { ButtonGroup } from '@mui/material';
import BtnGroup from './BtnGroup';


type CustomFormProps = {
    formProps: FormRenderProps<any, any>;
}

const FORM_BTN_TYPES = [
    BTN_GROUP_TYPE,
    PREV_BTN_INPUT_TYPE,
    PREV_BTN_LABEL_TYPE,
    NEXT_BTN_INPUT_TYPE,
    NEXT_BTN_LABEL_TYPE,
    SUBMIT_BTN_INPUT_TYPE,
    SUBMIT_BTN_LABEL_TYPE
];


function CustomForm(props: CustomFormProps) {
    const {
        formProps,
    } = props;

    const postUIContext = usePostUIContext();

    const {
        postConfig,
        template = '',
        mediaFilesMap
    } = postUIContext;



    if (!isEmpty(template)) {
        const options: HTMLReactParserOptions = {
            transform(reactNode, domNode, index) {
                if (reactNode && typeof reactNode === 'object') {
                    const elem = reactNode as any;
                    if (elem.props) {
                        const elemProps = attributesToProps(elem.props);

                        const dataType = elemProps.hasOwnProperty('data-type') ? elemProps['data-type'] : null;
                        if (dataType) {
                            if (FORM_BTN_TYPES.includes(`${dataType}`)) {
                                return (
                                    <CustomBtnGroup
                                        key={index}
                                        dataType={`${dataType}`}
                                        reactNode={elem}
                                        elemProps={elemProps}
                                        formProps={formProps}
                                    />
                                );
                            } else if (dataType === STEPPER_TYPE) {
                                return (
                                    <CustomStepper
                                        key={index}
                                        dataType={`${dataType}`}
                                        reactNode={elem}
                                        elemProps={elemProps}
                                        formProps={formProps}
                                    />
                                );
                            } else if (dataType === SECTION_TYPE) {
                                const dataIndex = Number(elem.props['data-index'] ?? '0');

                                const fieldConfig = getSectionByIndex(postConfig, dataIndex);

                                if (fieldConfig) {

                                    return (
                                        <CustomSection
                                            key={index}
                                            dataType={dataType}
                                            postConfig={postConfig}
                                            fieldConfig={fieldConfig}
                                            reactNode={elem}
                                            formProps={formProps}
                                            options={options}
                                            elemProps={elemProps}
                                            mediaFilesMap={mediaFilesMap}
                                            parentFieldConfig={postConfig}
                                            fieldIndex={dataIndex}
                                        />
                                    )
                                }
                            } else {
                                const sectionIndex = Number(elemProps['data-section-index']);
                                const fieldIndex = Number(elemProps['data-index']);
                                //console.log("elem.props['data-index'] = ", elem.props['data-index'])

                                const fieldConfig = getFieldConfigByIndex(postConfig, sectionIndex, fieldIndex);

                                if (fieldConfig) {

                                    switch (dataType) {
                                        case FIELD_TYPE:
                                            return (
                                                <CustomField
                                                    key={index}
                                                    postConfig={postConfig}
                                                    fieldConfig={fieldConfig}
                                                    formProps={formProps}
                                                    elemProps={elemProps}
                                                    mediaFilesMap={mediaFilesMap}
                                                    parentFieldConfig={postConfig}
                                                    fieldIndex={fieldIndex}
                                                >
                                                    {elem.props.children}
                                                </CustomField>
                                            );

                                        case INPUT_TYPE:
                                            return (
                                                <CustomFieldInput
                                                    key={index}
                                                    postConfig={postConfig}
                                                    fieldConfig={fieldConfig}
                                                    formProps={formProps}
                                                    elemProps={elemProps}
                                                    mediaFilesMap={mediaFilesMap}
                                                    parentFieldConfig={postConfig}
                                                    fieldIndex={fieldIndex}
                                                >
                                                    {elem.props.children}
                                                </CustomFieldInput>
                                            );

                                        case LABEL_TYPE:
                                            return (
                                                <CustomFieldLabel
                                                    key={index}
                                                    postConfig={postConfig}
                                                    fieldConfig={fieldConfig}
                                                    formProps={formProps}
                                                    elemProps={elemProps}
                                                    mediaFilesMap={mediaFilesMap}
                                                    parentFieldConfig={postConfig}
                                                    fieldIndex={fieldIndex}
                                                >
                                                    {elem.props.children}
                                                </CustomFieldLabel>
                                            );

                                        default:
                                            break;
                                    }
                                }
                            }
                        }
                    }
                }

                return (
                    <React.Fragment
                        key={index}
                    >
                        {
                            reactNode
                        }
                    </React.Fragment>
                )
            },
        };

        const reactNodes = parse(template, options)

        return (
            <>
                {
                    reactNodes
                }
            </>
        );
    } else {
        const sections = postConfig.fields[BUILDER_TAB_FORMS];

        return (
            <Stack
                spacing={2}
                gap={2}
            >
                {
                    sections.map((fieldConfig: TFieldConfig, fieldIndex) => (
                        <Section
                            key={fieldIndex}
                            formProps={formProps}
                            postConfig={postConfig}
                            formName={fieldConfig.name}
                            fieldConfig={fieldConfig}
                            fieldIndex={fieldIndex}
                            parentFieldConfig={postConfig}
                            mediaFilesMap={mediaFilesMap}
                        />
                    ))
                }
                <BtnGroup
                    formProps={formProps}
                />
            </Stack>
        )
    }
}

export default CustomForm