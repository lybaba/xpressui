import FrontendClient from "./frontend";
import TMediaFile from "./TMediaFile";
import TPostConfig from "./TPostConfig";

export type TPostUIConfig = {
    rootPostConfig: TPostConfig;
    mediaFiles: TMediaFile[]; 
    mediaFilesMap: Record<string, TMediaFile>;
    rootPostName?: string;
    baseUrl: string;
    imagesBaseUrl: string;
    frontend: FrontendClient;
};
