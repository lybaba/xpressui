import Ajv from "ajv";
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import TPostConfig from "./TPostConfig";

export const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
addErrors(ajv);

export type FrontendClientArgs = {
  postConfig: TPostConfig;
  baseUrl: string;
  imagesBaseUrl: string;
}

export class FrontendClient {
  private _baseUrl: string;
  private _imagesBaseUrl: string;
  private _postConfig: TPostConfig;

  constructor(args: FrontendClientArgs) {
    this._baseUrl = args.baseUrl;
    this._imagesBaseUrl = args.imagesBaseUrl;
    this._postConfig = args.postConfig;
  }

  get postConfig() {
    return this._postConfig;
  }


  get baseUrl() {
    return this._baseUrl;
  }

  get imagesBaseUrl() {
    return this._imagesBaseUrl;
  }
}

export default FrontendClient;

