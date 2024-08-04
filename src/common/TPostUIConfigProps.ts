import FrontendClient from "./frontend";
import TPostConfig from "./TPostConfig";
import TUser from "./TUser";

export type TPostUIConfig = {
    rootPostConfig: TPostConfig;
    rootPostName?: string;
    baseUrl: string;
    imagesBaseUrl: string;
    frontend: FrontendClient;
    baseStorageUrl?: string;
    user?: TUser | null;
};
