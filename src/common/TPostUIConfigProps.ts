import FrontendClient from "./frontend";
import TMediaFile from "./TMediaFile";
import TPostConfig from "./TPostConfig";
import TUser from "./TUser";

export type TPostUIConfig = {
    rootPostConfig: TPostConfig;
    mediaFiles: TMediaFile[]; 
    mediaFilesMap: Record<string, TMediaFile>;
    rootPostName?: string;
    baseUrl: string;
    imagesBaseUrl: string;
    frontend: FrontendClient;
    baseStorageUrl?: string;
    user?: TUser | null;
};
