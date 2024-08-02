import { PathProps, withRouter } from "../components/router"
import PostUI from "../components/postui/PostUI";
import { usePostUIContext } from "../components/postui/PostUIProvider";
import TPostUIEvent from "../common/TPostUIEvent";
import TServerResponse from "../common/TServerResponse";
import { useEffect } from "react";
import { isEmpty } from "lodash";
import { fetchPostConfig, TPostConfigWitBaseUrl } from "../components/postui/post-utils";
import { setCurrentPostConfig } from "../components/postui/Actions";



function PostUIPage(props: PathProps) {
    const {
        params: {
          postName
        },
    } = props;

    const postUIContext = usePostUIContext();
    const {
      currentPostConfig
    } = postUIContext;


    useEffect(() => {
      if (!isEmpty(postName)) {
        const postConfigFileName = `config/${postName}.json`;
  
        fetchPostConfig(postConfigFileName).then((postConfigWithBaseUrl: TPostConfigWitBaseUrl | null) => {
            if (postConfigWithBaseUrl) {
              const {
                postConfig,
              } = postConfigWithBaseUrl;
    
              setCurrentPostConfig(postUIContext, postConfig);
            }
        });
      }
  
    }, [postName]);

    // callback for submit data to server.  
    async function onPostUIEvent(event: TPostUIEvent) : Promise<TServerResponse> {

      console.log("PostUIPage____onPostUIEvent : ", event);

      const serverRes : TServerResponse = {
        success: true,
        message: 'success',
        data: {message: 'It Works'}
      };

      return serverRes;
    }



    return (
      <PostUI postConfig={currentPostConfig} onPostUIEvent={onPostUIEvent}/>
    )
}

export default withRouter(PostUIPage)