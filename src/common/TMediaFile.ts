
export const MEDIA_FILE_PREFIX = "iak://";

export type TMediaFileMetadata = {
    width?: number;
    height?: number;
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
    small?: TMediaFileMetadata;
    thumb?: TMediaFileMetadata;
    medium?: TMediaFileMetadata; 
    large?: TMediaFileMetadata; 
}

type TMediaFile = TMediaInfo & {
    id: string;
    label: string;
    desc?: string;
}


export default TMediaFile;
