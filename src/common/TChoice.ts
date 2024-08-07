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
}

export type TAdvancedChoice = {
    id: string;
} & TChoice;

export default TChoice;