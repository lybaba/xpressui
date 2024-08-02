export type TMediaFileMetadata = {
    size: number;
    width: number;
    height: number;
};

type TMediaFile = {
    id: string;
    label: string;
    type: string;
    desc?: string;
    size?: number;
    metadata?: Record<string, TMediaFileMetadata>
}

export default TMediaFile;