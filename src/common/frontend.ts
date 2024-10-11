import Ajv from "ajv";
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';

export const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
addErrors(ajv);


const dateTimeRegex = new RegExp('^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9]) (2[0-3]|[01][0-9]):([0-5][0-9])?$');

ajv.addFormat('date-time', {
    validate: (date: string) => {
        const res =  dateTimeRegex.test(date)
        return res
    }
})