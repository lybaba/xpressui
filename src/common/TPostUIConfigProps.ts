import FrontendClient from "../utils/frontend";
import TMediaFile from "./TMediaFile";
import TPostConfig from "./TPostConfig";

export type TPostUIConfig = {
    postConfig: TPostConfig;
    mediaFiles: TMediaFile[]; 
    mediaFilesMap: Record<string, TMediaFile>;
    template: string;
    baseUrl: string;
    imagesBaseUrl: string;
    frontend: FrontendClient;
};
