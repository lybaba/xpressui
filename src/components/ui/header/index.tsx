import TPostUIProps from '../../../common/TPostUIProps';
import { TPageConfig } from '../../../common/page';
import HeaderMenu, { MenuList } from './HeaderMenu';
import HeaderTitle from './HeaderTitle';

import './index.css';
import Layout from '../layout';


type OwnProps = {
    pageConfig: TPageConfig;
}

type Props = OwnProps & TPostUIProps;


export default function HeaderSection(props: Props) {
    const {
        formConfig,
        pageConfig
    } = props;

    if (pageConfig.headerTitleConfig && pageConfig.headerMenuConfig) {


        return (
            <Layout.Header>
                <HeaderTitle {...props} headerTitleConfig={pageConfig.headerTitleConfig} />
                <HeaderMenu {...props} headerMenuConfig={pageConfig.headerMenuConfig} />
            </Layout.Header>
        )
    } else if (pageConfig.headerTitleConfig) {
        return (
            <Layout.Header>
                <HeaderTitle {...props} headerTitleConfig={pageConfig.headerTitleConfig} />
            </Layout.Header>
        )
    } else if (pageConfig.headerMenuConfig) {
        return (
            <Layout.Header>
                <HeaderMenu {...props} headerMenuConfig={pageConfig.headerMenuConfig} />
            </Layout.Header>
        )
    }

    return null;
}
