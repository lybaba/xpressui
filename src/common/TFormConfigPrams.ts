import TMediaFile from "./TMediaFile";
import TFormConfig from "./TFormConfig";

export type TFormConfigPrams = {
    formConfig: TFormConfig | null;
    mediaFiles: TMediaFile[]; 
    baseUrl: string;
};
