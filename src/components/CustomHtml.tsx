import FormFieldProps from './FormFieldProps';
import parse, { attributesToProps } from 'html-react-parser';

import {
    TEXT_NODE
} from '../types/IDomNode';
import { FormRenderProps } from 'react-final-form';
import { Box } from '@mui/joy';


//const TWIG_VALUE_REGEX = new RegExp(/^\{{2}\s*[A-Za-z0-9]+(?:_[A-Za-z0-9]+)\s*\}{2}$/);

const OPEN_TWIG_TAG = '{{';
const CLOSE_TWIG_TAG = '}}';

type FormProps = FormRenderProps<any, any>;

type Props = FormFieldProps & FormProps;

function CustomHtml(props: Props) {
    const {
        fieldConfig : {
            desc = ''
        },
        values = { name: 'Ly', lastName: 'Babaly' }
    } = props;

    console.log("____VALUES55555555555555555 ", values)

    const choices = {
        replace(domNode: any) {
            const data = domNode.data;
            console.log("replace", domNode)
            if (domNode.nodeType === TEXT_NODE) {

                let prevStartIndex = 0;
                let startIndex = data.indexOf(OPEN_TWIG_TAG)
                const res = [];
                while (startIndex != -1) {

                    const closeIndex = data.indexOf(CLOSE_TWIG_TAG, startIndex + 1);
                    if (closeIndex === -1) {
                        res.push(data.substring(startIndex));
                        break;
                    }

                    if (startIndex > prevStartIndex) {
                        res.push(data.substring(prevStartIndex, startIndex));
                    }

                    const fieldName = data.substring(startIndex + 2, closeIndex).trim();
                    if (fieldName in values) {
                        res.push(values[fieldName]);
                    }

                    prevStartIndex = closeIndex + 2;
                    startIndex = data.indexOf(OPEN_TWIG_TAG, prevStartIndex);

                    if (startIndex === -1 && prevStartIndex < data.length) {
                        res.push(data.substring(prevStartIndex));
                    }
                }

                console.log("___GRRRRRRRRRRRRRRRRRR ", res);


                return <div>{res.join('')}</div>;
            }
        },
    };

    return (
        <Box>
            {
                parse(`<div>${desc}</div>`, choices)
            }
        </Box>
     )
}

export default CustomHtml;