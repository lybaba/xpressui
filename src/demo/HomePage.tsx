import TPostUIEvent from "src/common/TPostUIEvent";
import TServerResponse from "src/common/TServerResponse";
import PostUI from "src/components/postui/PostUI";
import { usePostUIContext } from "src/components/postui/PostUIProvider";

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