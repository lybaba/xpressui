import ISubFieldType from "./ISubFieldType";

interface IFieldType {
    id: number,
    name: string,
    subTypes: Array<ISubFieldType>,
    settingRefs: Array<string>
}

export default IFieldType;