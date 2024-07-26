import { PathProps, withRouter } from '../../common/router';
import ContactForm from './contactform';

type PostUIProps = {
    isLivePreview: boolean;
}

type Props = PostUIProps & PathProps;

function PostUI(props: Props) {
    /*const postUIContext = usePostUIContext();

    const {
        postConfig,
    } = postUIContext;*/
    
    return <ContactForm {...props} />
    /*switch (postConfig.type) {
        case MULTI_STEP_FORM_TYPE:
            return <CustomPost />
        
        case ONLINESTORE_TYPE:
            return <ProductPost />

        default:
            return <AdvancedForm />
    }*/
}

export default withRouter(PostUI)