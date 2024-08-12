import TPostUIProps from '../../common/TPostUIProps';
import FormSectionList from './FormSectionList';


function ProductListingUI(props: TPostUIProps) {
    const {
        template = ''
    } = props;

    return (
        <FormSectionList {...props}  />
    );
}

export default ProductListingUI;