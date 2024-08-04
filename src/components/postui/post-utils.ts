import { isEmpty } from "lodash";
import TMediaFile from "../../common/TMediaFile";
import TPostConfig from "../../common/TPostConfig";
import { TPostConfigPrams } from "../../common/TPostConfigPrams";

export type TPostConfigWitBaseUrl = {
    postConfig: TPostConfig;
    baseUrl: string;
}

export async function fetchPostConfig(fileName: string): Promise<TPostConfigWitBaseUrl | null> {
    try {
        const response = await fetch(`./${fileName}`);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const url = response.url;
        const index = url.lastIndexOf(fileName);
        const baseUrl = url.substring(0, index);

        const postConfig = await response.json();
        return {
            postConfig,
            baseUrl
        };
    } catch (reason: any) {
        console.error(reason);
    }

    return null;
}

export async function fetchPostAssets(fileName: string): Promise<TMediaFile[] | null> {
    try {
        const response = await fetch(`./${fileName}`);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const mediaFiles = await response.json();
        return mediaFiles;
    } catch (reason: any) {
        console.error(reason);
    }

    return null;
}

export async function fetchPostTemplate(fileName: string): Promise<string | ''> {
    try {
        const response = await fetch(`./${fileName}`);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const template = await response.text();
        return template;
    } catch (reason: any) {
        console.error(reason);
    }

    return '';
}
