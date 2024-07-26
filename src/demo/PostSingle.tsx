import { PathProps, withRouter } from "../common/router"

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
      <iak-post-ui name={postName} />
    )
  }

  export default withRouter(PostSingle)