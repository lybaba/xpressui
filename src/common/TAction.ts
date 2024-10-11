interface TAction {
    type: string,
    subtype?: number,
    payload?: any
}

export default TAction;