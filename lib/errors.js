exports.NotImplemented = function(message) {
    return new Error("Not Implemented :  " + message);
};

exports.ExpressionError = function(message) {
    return new Error("Expression Error :" + message);
};

exports.QueryError = function(message){
    return new Error("QueryError : " + message);
}