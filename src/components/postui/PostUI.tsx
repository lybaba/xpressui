import { PRODUCTLISTING_TYPE } from '../../common/TPostConfig';
import TPostUIProps from '../../common/TPostUIProps';
import FormUI from './FormUI';
import ProductListingUI from './ProductListingUI';

export default function PostUI(props: TPostUIProps) {
    if (props.postConfig.type === PRODUCTLISTING_TYPE) {
        return (
            <ProductListingUI {...props} />
        )
    }

    return <FormUI {...props} />
}
