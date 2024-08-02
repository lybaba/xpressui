import { PathProps, withRouter } from "../components/router"
import PostUI from "../components/postui/PostUI";
import { usePostUIContext } from "src/components/postui/PostUIProvider";
import TPostUIEvent from "src/common/TPostUIEvent";
import TServerResponse from "src/common/TServerResponse";
import { useEffect } from "react";
import { isEmpty } from "lodash";
import { fetchPostConfig } from "src/components/postui/post-utils";
import { setCurrentPostConfig } from "src/components/postui/Actions";



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
  
        fetchPostConfig(postConfigFileName).then((postConfigWithBaseUrl) => {
            if (postConfigWithBaseUrl) {
              const {
                postConfig,
              } = postConfigWithBaseUrl;
    
              setCurrentPostConfig(postUIContext, postConfig);
            }
        });
      }
  
    }, [postName]);

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