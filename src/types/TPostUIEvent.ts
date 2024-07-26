import { AxiosInstance } from "axios";
import TPostConfig from "./TPostConfig";
import TMediaFile from "./TMediaFile";
import FrontendClient from "../api/frontend";

export enum TPostUIEventType {
    InitEvent = "init-event",
    SubmitFormEvent = "submit-form-event",
    SelectStepEvent = "select-step-event",
    FetchItemListEvent = "fetch-item-list-event",
    FetchSingleItemEvent = "fetch-single-item-event",
    UpdateItemListEvent = "update-item-event",
    DeleteItemEvent = "delete-item-event",
    SelectMenuEvent = "select-menu-event",
    CheckoutEvent = "checkout-event",
    IsSignedInEvent = "is-signed-in-event",
    SignInEvent = "sign-in-event",
    SignUpEvent = "sign-up-event",
    SignOutEvent = "sign-out-event",
    BookEvent = "book-event",
    RentEvent = "rent-event",
    SendEmailEvent = "send-email-event",
    SendSmsEvent = "send-sms-event",
    UploadFileEvent = "upload-file-event",
    PublishOnSocialMediaEvent = "publish-on-social-media-event",
};

type TPostUIEvent = {
    frontend: FrontendClient;
    eventType: string;
    data: Record<string, any>;
    onSuccess: (data: any) => void;
    onError: (data: any) => void
}

export default TPostUIEvent;