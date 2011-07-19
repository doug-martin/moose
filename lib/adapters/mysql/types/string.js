var Type = require("index.js").Type,
        comb = require("comb");

var stringDefaults = {
    allowNull : true,
    primaryKey : false,
    foreignKey : false,
    "default" : null,
    unique : false,
    description : ""
};

var getStringType = function(cmpFun) {
    return function(val) {
        if (!val) {
            val = null;
        } else if (typeof val != "string") {
            val = "" + val;
        }
        cmpFun && cmpFun(val);
        return val;
    };
};

var checkStringType = function(type, cmpFun) {
    return function(val) {
        if (typeof val != "string") throw new Error(type + " requires a string type.");
        cmpFun && cmpFun(val);
    };
};

//String Types
/**
 *
 *
 * Mysql CHAR datatype
 *
 * @function
 * @param {Object} options options for the CHAR data type.
 * @param {Number} [options.length=255] the length of the field
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a CHAR column.
 *
 * @name CHAR
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.CHAR = function(options) {
    var ops = comb.merge({}, stringDefaults, {length : 255, type : "CHAR"}, options || {});
    if (ops.length > 4294967295) {
        throw new Error("Max char type length is 255");
    }
    var cmpFun = function(val) {
        if (ops.length == undefined && val.length > 255) throw new Error("value not of length " + (ops.length || 255));
        else if (val && val.length != ops.length) throw new Error("value not of length " + (ops.length || 255));
    };
    ops.setSql = getStringType(cmpFun);
    ops.checkType = checkStringType(ops.type, cmpFun);
    return new Type(ops);
};

/**
 *
 *
 * String alias for {@link varchar} datatype.
 *
 * @function
 * @param {Object} options options for the STRING data type.
 * @param {Number} [options.length=255] the length of the field
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a VARCHAR column.
 *
 * @name STRING
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.STRING = (exports.VARCHAR = function(options) {
    var ops = comb.merge({}, stringDefaults, {length : 255, type : "VARCHAR"}, options || {});
    if (ops.length > 4294967295) {
        throw new Error("Max char type length is 255 please use text");
    }
    var cmpFun = function(val) {
        if ((val.length > ops.length) || val.length > 255)
            throw new Error("value greater than valid varchar length of " + (ops.length || 255));
    };
    ops.setSql = getStringType(cmpFun);
    ops.checkType = checkStringType(ops.type, cmpFun);
    return new Type(ops);
});

/**
 *
 * Mysql TINYTEXT datatype
 *
 * @function
 * @param {Object} options options for the TINYTEXT data type.
 * @param {Number} [options.length] the length of the field
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a TINYTEXT column.
 *
 * @name TINYTEXT
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.TINYTEXT = function(options) {
    var ops = comb.merge({}, stringDefaults, {length : null, type : "TINYTEXT"}, options || {});
    var cmpFun = function(val) {
        if (val.length > 255) throw new Error("value greater than valid tinytext length of 255");
    };
    ops.setSql = getStringType(cmpFun);
    ops.checkType = checkStringType(ops.type, cmpFun);
    return new Type(ops);
};

/**
 *
 *
 * Mysql MEDIUMTEXT datatype
 *
 * @function
 * @param {Object} options options for the MEDIUMTEXT data type.
 * @param {Number} [options.length] the length of the field
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a MEDIUMTEXT column.
 *
 * @name MEDIUMTEXT
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.MEDIUMTEXT = function(options) {
    var ops = comb.merge({}, stringDefaults, {length : null, type : "MEDIUMTEXT"}, options || {});
    var cmpFun = function(val) {
        if (val.length > 16777215) throw new Error("value greater than valid tinytext length of 16777215");
    };
    ops.setSql = getStringType(cmpFun);
    ops.checkType = checkStringType(ops.type, cmpFun);
    return new Type(ops);
};

/**
 *
 *
 * Mysql LONGTEXT datatype
 *
 * @function
 * @param {Object} options options for the LONGTEXT data type.
 * @param {Number} [options.length] the length of the field
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a LONGTEXT column.
 *
 * @name LONGTEXT
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.LONGTEXT = function(options) {
    var ops = comb.merge({}, stringDefaults, {length : null, type : "LONGTEXT"}, options || {});
    var cmpFun = function(val) {
        if (val.length > 4294967295) throw new Error("value greater than valid tinytext length of 4294967295");
    };
    ops.setSql = getStringType(cmpFun);
    ops.checkType = checkStringType(ops.type, cmpFun);
    return new Type(ops);
};

/**
 *
 *
 * Mysql TEXT datatype
 *
 * @function
 * @param {Object} options options for the TEXT data type.
 * @param {Number} [options.length] the length of the field
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a TEXT column.
 *
 * @name TEXT
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.TEXT = function(options) {
    var ops = comb.merge({}, stringDefaults, {length : 4294967295, type : "TEXT"}, options || {});
    var cmpFun = function(val) {
        if (val.length > 65535) throw new Error("value greater than valid tinytext length of 65535");
    };
    ops.setSql = getStringType(cmpFun);
    ops.checkType = checkStringType(ops.type, cmpFun);
    return new Type(ops);
};


var checkEnumType = function(enumTypes, type) {
    var enums = comb.merge([], enumTypes);
    return function(val) {
        if (typeof val != "string" || enums.indexOf(val) == -1) {
            throw new Error(type + " value must be a string and contained in the enum set");
        }
    };
};

var checkSetType = function(enumTypes, type) {
    var check = checkEnumType(enumTypes, type);
    return function(val) {
        if (typeof val == "string") {
            return check(val);
        }
        val.forEach(function(v) {
            return check(v);
        });
    };
};


var getSetType = function(cmpFunc) {
    return function(val) {
        if (typeof val == "string") {
            val = val.split(",");
        }
        cmpFunc && cmpFunc(val);
        return val;
    };
};

/**
 *
 *
 * Mysql ENUM datatype
 *
 * @function
 * @param {Object} options options for the TINYTEXT data type.
 * @param {Array} options.enums the characters allowed for this ENUM
 * @param {Number} [options.length] the length of the field
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a ENUM column.
 *
 * @name ENUM
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.ENUM = function(options) {
    var ops = comb.merge({}, stringDefaults, {type : "ENUM", enums : []}, options || {});
    if (ops.enums && ops.enums.length > 65535) {
        throw new Error("Max number of enum values is 65535");
    }
    ops.setSql = getStringType(checkEnumType(ops.enums, ops.type));
    ops.checkType = checkEnumType(ops.enums, ops.type);
    return new Type(ops);
};

/**
 *
 *
 * Mysql SET datatype
 *
 * @function
 * @param {Object} options options for the SET data type.
 * @param {Array} options.enums the characters  allowed in this SET
 * @param {Number} [options.length] the length of the field
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a SET column.
 *
 * @name SET
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.SET = function(options) {
    var ops = comb.merge({}, stringDefaults, {type : "SET", enums : []}, options || {});
    if (ops.enums && ops.enums.length > 64) {
        throw new Error("Max number of enum values is 64");
    }
    ops.setSql = getSetType(checkSetType(ops.enums, ops.type));
    ops.checkType = checkSetType(ops.enums, ops.type);
    return new Type(ops);
};
