import { FormRenderProps } from 'react-final-form';
import parse, { attributesToProps, HTMLReactParserOptions } from 'html-react-parser';
import CustomField from '../CustomField';

import CustomFieldInput from '../CustomFieldInput';
import CustomFieldLabel from '../CustomFieldLabel';
import React from 'react';
import { isEmpty } from 'lodash';
import TComponentType from '../../common/TComponentType';
import FormSectionList from './FormSectionList';
import TPostUIProps from '../../common/TPostUIProps';
import HtmlBtnGroup from '../HtmlBtnGroup';
import HtmlSection from '../HtmlSection';
import HtmlStepper from '../HtmlStepper';
import { getFieldConfigByIndex, getSectionByIndex } from '../../common/post';


type OwnProps = {
    formProps?: FormRenderProps<any, any>;
    template: string;
}

const FORM_BTN_TYPES = [
    TComponentType.BTN_GROUP_TYPE as string,
    TComponentType.PREV_BTN_INPUT_TYPE as string,
    TComponentType.PREV_BTN_LABEL_TYPE as string,
    TComponentType.NEXT_BTN_INPUT_TYPE as string,
    TComponentType.NEXT_BTN_LABEL_TYPE as string,
    TComponentType.SUBMIT_BTN_INPUT_TYPE as string,
    TComponentType.SUBMIT_BTN_LABEL_TYPE as string
];

type Props = OwnProps & TPostUIProps

function BodyContent(props: Props) {
    const {
        formProps,
        postConfig,
        template
    } = props;


    if (!isEmpty(template)) {
        const options: HTMLReactParserOptions = {
            transform(reactNode, domNode, index) {
                if (reactNode && typeof reactNode === 'object') {
                    const elem = reactNode as any;
                    if (elem.props) {
                        const elemProps = attributesToProps(elem.props);

                        const componentType = elemProps.hasOwnProperty('data-component') ? elemProps['data-component'] : null;
                        if (componentType) {
                            if (FORM_BTN_TYPES.includes(`${componentType}`)) {
                                return (
                                    <HtmlBtnGroup
                                        key={index}
                                        {...props}
                                        componentType={`${componentType}`}
                                        reactNode={elem}
                                        elemProps={elemProps}
                                        formProps={formProps}
                                    />
                                );
                            } else if (componentType === TComponentType.STEPPER_TYPE) {
                                return (
                                    <HtmlStepper
                                        key={index}
                                        {...props}
                                        componentType={`${componentType}`}
                                        reactNode={elem}
                                        elemProps={elemProps}
                                        formProps={formProps}
                                    />
                                );
                            } else if (componentType === TComponentType.SECTION_TYPE) {
                                const dataIndex = Number(elem.props['data-index'] ?? '0');

                                const fieldConfig = getSectionByIndex(postConfig, dataIndex);

                                if (fieldConfig) {

                                    return (
                                        <HtmlSection
                                            key={index}
                                            {...props}
                                            componentType={componentType}
                                            fieldConfig={fieldConfig}
                                            reactNode={elem}
                                            formProps={formProps}
                                            options={options}
                                            elemProps={elemProps}
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

                                    switch (componentType) {
                                        case TComponentType.FIELD_TYPE:
                                            return (
                                                <CustomField
                                                    key={index}
                                                    postConfig={postConfig}
                                                    fieldConfig={fieldConfig}
                                                    formProps={formProps}
                                                    elemProps={elemProps}
                                                    fieldIndex={fieldIndex}
                                                >
                                                    {elem.props.children}
                                                </CustomField>
                                            );

                                        case TComponentType.INPUT_TYPE:
                                            return (
                                                <CustomFieldInput
                                                    key={index}
                                                    postConfig={postConfig}
                                                    fieldConfig={fieldConfig}
                                                    formProps={formProps}
                                                    elemProps={elemProps}
                                                    fieldIndex={fieldIndex}
                                                >
                                                    {elem.props.children}
                                                </CustomFieldInput>
                                            );

                                        case TComponentType.LABEL_TYPE:
                                            return (
                                                <CustomFieldLabel
                                                    key={index}
                                                    postConfig={postConfig}
                                                    fieldConfig={fieldConfig}
                                                    formProps={formProps}
                                                    elemProps={elemProps}
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
        return (
            <FormSectionList {...props} formProps={formProps} />
        )
    }
}

export default BodyContent