export const TColorType = {
    Success: 'success',
    Warning: 'warning',
    Danger: 'danger',
    Neutral: 'neutral',
    Primary: 'primary'
}

type TMessage = {
    color: string;
    lines: Array<string>;
}


export default TMessage;