export class ApiError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
    }
}

export class BadRequestError extends ApiError {
    constructor(message: string) {
        super(message, 400);
    }
}

export class ConflictError extends ApiError {
    constructor(message: string) {
        super(message, 409);
    }
}

export class ApplicationError extends ApiError {
    constructor(message: string) {
        super(message, 500);
    }
}
