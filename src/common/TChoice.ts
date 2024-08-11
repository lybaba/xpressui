import { TMediaInfo } from "./TMediaFile";

type TChoice = {
    id: string;
    name: string;
    desc?: string;
    mediaId?: string;
    mediaInfo?: TMediaInfo;
    mediaInfoList?: TMediaInfo[];
    permalink?: string;
    regularPrice?: number;
    salePrice?: number;
    disabled?: boolean;
    formConfigId?: string;
    createdAt?: number;
    updatedAt?: number;
}

export default TChoice;