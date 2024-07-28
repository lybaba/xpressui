import { PathProps, withRouter } from "../common/router"
import PostUI from "../components/post-ui/PostUI";

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
      <PostUI name={postName} />
    )
  }

  export default withRouter(PostSingle)