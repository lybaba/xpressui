import TPostUIProps from '../../common/TPostUIProps';
import BodyContent from './BodyContent';


function ProductListingUI(props: TPostUIProps) {
    const {
        template = ''
    } = props;

    return (
        <BodyContent {...props} template={template} />
    );
}

export default ProductListingUI;