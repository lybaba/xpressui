import {
    Box,
    Chip,
    Option,
    Select,
    SelectOption,
} from "@mui/joy";

import { FormRenderProps } from 'react-final-form'

import TChoice from "../../common/TChoice";
import TFormFieldProps from "../../common/TFormFieldProps";

type FormProps = {
    formProps: FormRenderProps<any, any>;
}

type Props = TFormFieldProps & FormProps;

export const MultiSelect = (props: Props) => {
    const {
        formProps,
        fieldConfig,
        input,
        elemProps
    } = props;

    /*const {
        maxNumOfChoices
    } = fieldConfig;

    const isMultiple = !(maxNumOfChoices && Number(maxNumOfChoices) == 1);*/

    const placeholderProps = fieldConfig.placeholder ? { placeholder: fieldConfig.placeholder } : {};

    return (
        <Select
            multiple
            renderValue={(selected : any) => (
                <Box sx={{ display: 'flex', gap: '0.25rem' }}>
                    {selected.map((selectedOption : any, index: number) => (
                        <Chip key={index} variant="soft" color="primary">
                            {selectedOption.label}
                        </Chip>
                    ))}
                </Box>
            )}
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
            defaultValue={input.value ? input.value : []}
            onChange={(e, value) => {
                formProps.form.mutators.setFieldValue(fieldConfig.name, value)
            }}
            {...placeholderProps}
            {...elemProps}
        >
            {
                fieldConfig.choices.map((opt: TChoice, index: number) => {
                    const id = opt?.name ? opt.name : `${index}`;
                    return (
                        <Option key={id} value={id}>{opt.label}</Option>
                    )
                })
            }
        </Select>
    );
}

export default MultiSelect;