import IFieldSettingOption from "./IFieldSettingOption";

interface IFieldSetting {
    name: string,
    type: string,
    editSection: string,
    choices: Array<IFieldSettingOption>
}

export default IFieldSetting;