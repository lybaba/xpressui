import TMediaFile from "./TMediaFile";
import TPostConfig from "./TPostConfig";

export type TPostConfigPrams = {
    postConfig: TPostConfig | null;
    mediaFiles: TMediaFile[]; 
    baseUrl: string;
};
