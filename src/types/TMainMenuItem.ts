import { MENU_POSTS } from "./Constants";

type TMainMenuItem = {
    name: string,
    label: string,
}

export const DEFAULT_MAIN_MENU_ITEM  : TMainMenuItem = {
    name: MENU_POSTS,
    label: MENU_POSTS
}


export default TMainMenuItem;