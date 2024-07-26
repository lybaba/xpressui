import TFieldConfig from "../types/TFieldConfig";
import { EMAIL_TYPE, TEXT_TYPE } from "./field";
import LABELS from "./config/labels";

export const EMAIL_FIELD : TFieldConfig = {
    type: EMAIL_TYPE,
    label: LABELS.email,
    name: 'email',
    choices: [],
    canDelete: false
};

export const FIRSTNAME : TFieldConfig = {
    type: TEXT_TYPE,
    label:LABELS.firstname,
    name: 'firstname',
    choices: [],
    canDelete: false
};

export const LASTNAME_FIELD : TFieldConfig = {
    type: TEXT_TYPE,
    label:LABELS.lastname,
    name: 'lastname',
    choices: [],
    canDelete: false
};

export const PHONE_NUMBER_FIELD : TFieldConfig = {
    type: TEXT_TYPE,
    label:LABELS.phone,
    name: 'phone',
    choices: [],
    canDelete: false
};