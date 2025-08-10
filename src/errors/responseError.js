export class ResponseError extends Error {
    constructor(status, message, errors = null) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}