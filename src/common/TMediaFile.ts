import { StoreMallDirectory } from "@mui/icons-material";

export type TMediaFileMetadata = {
    width: number;
    height: number;
    filePath: string;
    label?: string;
};

export enum MediaSizeType {
    Small,
    Thumb,
    Medium,
    Large
}

export type TMediaInfo = {
    filePath?: string;
    label?: string;
    smallMeta?: TMediaFileMetadata;
    thumbMeta?: TMediaFileMetadata;
    mediumMeta?: TMediaFileMetadata; 
    largeMeta?: TMediaFileMetadata; 
}

type TMediaFile = TMediaInfo & {
    id: string;
    label: string;
    desc?: string;
}


export default TMediaFile;
