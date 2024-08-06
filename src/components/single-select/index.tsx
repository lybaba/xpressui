import {
    Option,
    Radio,
    RadioGroup,
    Select,
} from "@mui/joy";

import TChoice from "../../common/TChoice";
import { SINGLE_SELECT_TYPE } from "../../common/field";
import TPostFieldProps from "../../common/TPostFieldProps";



export const SingleSelect = (props: TPostFieldProps) => {
    const {
        fieldConfig,
        formProps,
        elemProps
    } = props;

    const placeholderProps = fieldConfig.placeholder ? { placeholder: fieldConfig.placeholder } : {};


    const values = formProps ? formProps.values : {};

    const valueProps = values.hasOwnProperty(fieldConfig.name) ?
        { value: values[fieldConfig.name] } : { value: '' };

    
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
                {...elemProps}
            >
                <Option value={''}>{' '}</Option>
                {
                    fieldConfig.choices?.map((opt: TChoice, index: number) => {
                        const id = opt?.name ? opt.name : `${index}`;
                        return (
                            <Option key={id} value={id}>{opt.label}</Option>
                        )
                    })
                }
            </Select>
        ) : (
            <RadioGroup 
                {...valueProps}
                {...elemProps}    
            >
                {
                    fieldConfig.choices?.map((opt: TChoice, index: number) => {
                        const id = opt?.name ? opt.name : `${index}`;
                        return (
                            <Radio
                                key={index}
                                value={id}
                                label={opt.label}
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