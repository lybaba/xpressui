import TPostUIProps from '../../common/TPostUIProps';
import ContactForm from './contactform';

export default function PostUI(props: TPostUIProps) {

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
