import { PropsWithChildren } from 'react';

import TPostUIProps from '../../common/TPostUIProps';
import FormContent from './FormContent';
import { WEBAPP_TYPE } from '../../common/TFormConfig';
import WebAppUI from './WebAppUI';


type Props = TPostUIProps & PropsWithChildren;

export default function PostUI(props: Props) {
    const {
        formConfig
    } = props;


    return (
        <>
            {
                formConfig.type === WEBAPP_TYPE ? (
                    <WebAppUI
                        {...props} 
                    />
                ) : (
                    <FormContent
                    {...props}
                    />
                )
            }
        </>
    );
}
