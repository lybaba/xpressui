type TChoice = {
    name: string;
    label: string;
    desc?: string;
    imageList?: string[];
    permalink?: string;
    videoList?: string[];
    regularPrice?: number;
    salePrice?: number;
    disabled?: boolean;
    meta?: Record<string, string>
}

export default TChoice;