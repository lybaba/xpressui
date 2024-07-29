import axios, { AxiosInstance } from "axios";
import Ajv from "ajv";
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import { isEmpty } from "lodash";
import TPostConfig from "../common/TPostConfig";
import TMediaFile from "../common/TMediaFile";


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
  private _axiosServerClient: AxiosInstance;
  private _axiosImagesClient: AxiosInstance;
  private _postConfig: TPostConfig;
  private _mediaFiles: TMediaFile[];
  private _mediaFilesMap: Record<string, TMediaFile>;

  constructor(args: FrontendClientArgs) {
    this._baseUrl = args.baseUrl;
    this._imagesBaseUrl = args.imagesBaseUrl;
    this._postConfig = args.postConfig;
    this._mediaFiles = args.mediaFiles;
    this._mediaFilesMap = args.mediaFilesMap;

    const axiosServerConfig: any = {};

    if (!isEmpty(this._baseUrl)) {
      axiosServerConfig['baseURL'] = this._baseUrl;
    }

    this._axiosServerClient = axios.create(axiosServerConfig);

    const axiosAssetsConfig: any = {};

    if (!isEmpty(this._imagesBaseUrl)) {
      axiosAssetsConfig['baseURL'] = this._imagesBaseUrl;
    }

    this._axiosImagesClient = axios.create(axiosAssetsConfig);
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

  get serverClient() {
    return this._axiosServerClient;
  }

  get imagesClient() {
    return this._axiosImagesClient;
  }
}

export default FrontendClient;

