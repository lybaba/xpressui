import FrontendClient from "./frontend";
import TUser from "./TUser";

export type TPostUIConfig = {
    baseUrl: string;
    imagesBaseUrl: string;
    frontend: FrontendClient;
    baseStorageUrl?: string;
    user?: TUser | null;
};
