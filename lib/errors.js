
exports.ModelError = function(message){
    return new Error("Model error : " + message);
};

exports.AssociationError = function(message){
    return new Error("Association error : " + message);
};

exports.MooseError = function(message){
    return new Error("Moose error : " + message);
};