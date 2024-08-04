import ISelectOption from "./ISelectOption";

interface ISelectData {
  itemList: Array<ISelectOption>,
  itemMap: Record<string, ISelectOption>
}

export default ISelectData;