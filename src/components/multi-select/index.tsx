import {
    Box,
    Chip,
    Option,
    Select,
} from "@mui/joy";

import TChoice from "../../common/TChoice";
import TFormFieldProps from "../../common/TFormFieldProps";

export const MultiSelect = (props: TFormFieldProps) => {
    const {
        formProps,
        fieldConfig,
        input,
        cssProps
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
            defaultValue={input?.value ? input.value : []}
            onChange={(e, value) => {
                formProps?.form.mutators.setFieldValue(fieldConfig.name, value)
            }}
            {...placeholderProps}
            {...cssProps?.inputClasses}
            {...cssProps?.inputProps}
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
    );
}

export default MultiSelect;