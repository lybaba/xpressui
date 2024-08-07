import FrontendClient from "./frontend";
import TFormConfig from "./TFormConfig";
import TUser from "./TUser";

export type TPostUIConfig = {
    rootFormConfig: TFormConfig;
    rootPostName?: string;
    baseUrl: string;
    imagesBaseUrl: string;
    frontend: FrontendClient;
    baseStorageUrl?: string;
    user?: TUser | null;
};
