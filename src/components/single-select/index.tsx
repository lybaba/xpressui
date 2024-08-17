import {
    Option,
    Radio,
    RadioGroup,
    Select,
} from "@mui/joy";

import TChoice from "../../common/TChoice";
import { SINGLE_SELECT_TYPE } from "../../common/field";
import TFormFieldProps from "../../common/TFormFieldProps";



export const SingleSelect = (props: TFormFieldProps) => {
    const {
        fieldConfig,
        formProps,
        cssProps
    } = props;

    const placeholderProps = fieldConfig.placeholder ? { placeholder: fieldConfig.placeholder } : {};


    const values = formProps && formProps.values ? formProps.values : {};

    const valueProps = values.hasOwnProperty(fieldConfig.name) ?
        { value: values[fieldConfig.name] } : {};


    return (
        fieldConfig.type === SINGLE_SELECT_TYPE ? (
            <Select
                sx={{
                    minWidth: '15rem',
                }}
                slotProps={{
                    listbox: {
                        sx: {
                            width: '100%',
                        },
                    },
                }}
                {...valueProps}
                onChange={(e, value) => {
                    formProps?.form.mutators.setFieldValue(fieldConfig.name, value)
                }}
                {...placeholderProps}
                {...cssProps?.iClassesProps}
                {...cssProps?.iElemProps}
            >
                {
                    fieldConfig.choices?.map((opt: TChoice, index: number) => {
                        const id = opt?.id ? opt.id : `${index}`;
                        return (
                            <Option key={id} value={id}>{opt.name}</Option>
                        )
                    })
                }
            </Select>
        ) : (
            <RadioGroup
                {...valueProps}
                {...cssProps?.iClassesProps}
                {...cssProps?.iElemProps}
            >
                {
                    fieldConfig.choices?.map((opt: TChoice, index: number) => {
                        const id = opt?.id ? opt.id : `${index}`;
                        return (
                            <Radio
                                key={index}
                                value={id}
                                label={opt.name}
                                color="primary"
                                onChange={() => formProps?.form.mutators.setFieldValue(fieldConfig.name, id)}
                            />
                        );
                    })
                }
            </RadioGroup>
        )
    );
}

export default SingleSelect;