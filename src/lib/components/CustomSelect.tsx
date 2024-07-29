import ISelectOption from '../types/ISelectOption';
import { Autocomplete, Box, Input } from '@mui/joy';
import { FormApi } from "final-form";
import ISelectData from "../types/ISelectData";

interface PropsType {
    form: FormApi<Record<string, any>>;
    selectData: ISelectData,
    input: any,
    label: string | undefined,
    error: boolean,
    disabled?: boolean,
    helperText: string,
    defaultValue?: string
}


export const CustomSelect = (props : PropsType) => {
    const {
        input,
        selectData
    } = props;

    const valueProp = input.value && selectData.itemMap.hasOwnProperty(input.value) ?
                        {value: selectData.itemMap[input.value]} : {}
    return (
        <div></div>
    );
}

export default CustomSelect;