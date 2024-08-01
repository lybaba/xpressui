import { PathProps, withRouter } from "../components/router"
import PostUI from "../components/postui/PostUI";

declare global {
    namespace JSX {
      interface IntrinsicElements {
        "iak-post-ui": PostUIAttributes;
      }
  
      interface PostUIAttributes {
        name: string;
      }
    }
}

function PostSingle(props: PathProps) {
    const {
        params,
    } = props;

    const {
        postName,
    } = params;

    return (
      <PostUI />
    )
  }

  export default withRouter(PostSingle)