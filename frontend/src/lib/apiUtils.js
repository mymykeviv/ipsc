export function handleApiError(error, forceLogout) {
    // Check if it's an authentication error
    if (error.message === 'unauthorized' || error.message.includes('401')) {
        // Force logout if logout function is provided
        if (forceLogout) {
            forceLogout();
            return 'Session expired. Please log in again.';
        }
        return 'Authentication failed. Please log in again.';
    }
    // Return the original error message for other errors
    return error instanceof Error ? error.message : 'An unexpected error occurred';
}
export function createApiErrorHandler(forceLogout) {
    return (error) => {
        return handleApiError(error, forceLogout);
    };
}
