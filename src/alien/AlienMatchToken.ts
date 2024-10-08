export default class AlienMatchToken {
    name: string
    value: string

    constructor(osvToken: AlienMatchToken) {
        this.name = osvToken.name;
        this.value = osvToken.value;
    }
}

export function createMatchToken(osvToken: AlienMatchToken) {
    return new AlienMatchToken(osvToken)
}
