import Ajv from "ajv";
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import { isEmpty } from "lodash";
import TPostConfig from "./TPostConfig";
import TMediaFile from "./TMediaFile";


export const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
addErrors(ajv);

export type FrontendClientArgs = {
  postConfig: TPostConfig;
  mediaFiles: TMediaFile[];
  mediaFilesMap: Record<string, TMediaFile>;
  baseUrl: string;
  imagesBaseUrl: string;
}

export class FrontendClient {
  private _baseUrl: string;
  private _imagesBaseUrl: string;
  private _postConfig: TPostConfig;
  private _mediaFiles: TMediaFile[];
  private _mediaFilesMap: Record<string, TMediaFile>;

  constructor(args: FrontendClientArgs) {
    this._baseUrl = args.baseUrl;
    this._imagesBaseUrl = args.imagesBaseUrl;
    this._postConfig = args.postConfig;
    this._mediaFiles = args.mediaFiles;
    this._mediaFilesMap = args.mediaFilesMap;
  }

  get postConfig() {
    return this._postConfig;
  }

  get mediaFiles() {
    return this._mediaFiles;
  }

  get mediaFilesMap() {
    return this._mediaFilesMap;
  }

  get baseUrl() {
    return this._baseUrl;
  }

  get imagesBaseUrl() {
    return this._imagesBaseUrl;
  }
}

export default FrontendClient;

