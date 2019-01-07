module.exports = {
    unauthorisedError
};

function unauthorisedError() {
    const error = new Error('Unauthorised access');
    error.status = 403;
    return error;
}
