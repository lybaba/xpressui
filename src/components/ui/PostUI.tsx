import { PRODUCTFORM_TYPE } from '../../common/TFormConfig';
import TPostUIProps from '../../common/TPostUIProps';
import FormUI from './FormUI';
import ProductListingUI from './ProductListingUI';

export default function PostUI(props: TPostUIProps) {
    if (props.formConfig.type === PRODUCTFORM_TYPE) {
        return (
            <ProductListingUI {...props} />
        )
    }

    return <FormUI {...props} />
}
