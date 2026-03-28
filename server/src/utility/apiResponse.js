class ApiResponse {
    constructor(statusCode, message = 'Success', data = null) {
        // Backward compatibility: allow constructor(statusCode, data, message)
        if (
            typeof message === 'object' &&
            message !== null &&
            (typeof data === 'string' || data === null)
        ) {
            const swappedMessage = data || 'Success';
            this.statusCode = statusCode;
            this.message = swappedMessage;
            this.data = message;
            this.success = statusCode < 400;
            return;
        }

        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400;
    }
}

export default ApiResponse;
