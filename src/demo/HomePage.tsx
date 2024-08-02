import TPostUIEvent from "../common/TPostUIEvent";
import TServerResponse from "../common/TServerResponse";
import PostUI from "../components/postui/PostUI";
import { usePostUIContext } from "../components/postui/PostUIProvider";

export default function HomePage(props: any) {
    const postUIContext = usePostUIContext();
    const {
        rootPostConfig,
    } = postUIContext;

    console.log("___current ", rootPostConfig)

    async function onPostUIEvent(event: TPostUIEvent): Promise<TServerResponse> {

        console.log("PostUIPage____onPostUIEvent : ", event);

        const serverRes: TServerResponse = {
            success: true,
            message: 'success',
            data: { message: 'It Works' }
        };

        return serverRes;
    }


    return (
        <PostUI postConfig={rootPostConfig} onPostUIEvent={onPostUIEvent} />
    )
}