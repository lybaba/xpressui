import { TMediaInfo } from "./TMediaFile";

type TChoice = {
    value: string;
    label: string;
    desc?: string;
    mediaId?: string;
    mediaInfo?: TMediaInfo;
    mediaInfoList?: TMediaInfo[];
    permalink?: string;
    regularPrice?: number;
    salePrice?: number;
    disabled?: boolean;
}

export default TChoice;