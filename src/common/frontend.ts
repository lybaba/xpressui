import Ajv from "ajv";
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';

export const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
addErrors(ajv);


const dateTimeRegex = new RegExp(
    '^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])[T ](2[0-3]|[01][0-9]):([0-5][0-9])(?::([0-5][0-9]))?(?:\\.\\d{1,3})?(?:Z|[+-](?:2[0-3]|[01][0-9]):?[0-5][0-9])?$'
);
const timeRegex = new RegExp('^(?:[01][0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$');

ajv.addFormat('date-time', {
    validate: (date: string) => {
        const normalized = String(date || "").trim();
        const res = dateTimeRegex.test(normalized)
        return res
    }
})

// Accept native HTML time input values: HH:mm (and optional seconds HH:mm:ss).
ajv.addFormat('time', {
    validate: (time: string) => {
        return timeRegex.test(String(time || "").trim());
    }
})
