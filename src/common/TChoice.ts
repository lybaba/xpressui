import { TMediaInfo } from "./TMediaFile";

type TChoice = {
    name: string;
    label: string;
    desc?: string;
    mediaId?: string;
    mediaInfo?: TMediaInfo;
    mediaInfoList?: TMediaInfo[];
    permalink?: string;
    regularPrice?: number;
    salePrice?: number;
    disabled?: boolean;
    meta?: Record<string, string>
}

export default TChoice;