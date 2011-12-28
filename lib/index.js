var mooseQuery = require("moose-query"),
    dataset = mooseQuery.Dataset,
    model = require("./model"),
    comb = require("comb"),
    hitch = comb.hitch,
    Promise = comb.Promise,
    PromiseList = comb.PromiseList,
    plugins = require("./plugins");

var connectionReady = false;

var LOGGER = comb.logging.Logger.getLogger("moose");
new comb.logging.BasicConfigurator().configure();
LOGGER.level = comb.logging.Level.INFO;

/**
 * @class A singleton class that acts as the entry point for all actions performed in moose.
 *
 * @constructs
 * @name moose
 * @augments Migrations
 * @param options
 *
 * @property {String} database the default database to use, this property can only be used after the conneciton has
 *                             initialized.
 * @property {moose.adapters} adapter the adapter moose is using. <b>READ ONLY</b>
 *
 */
var Moose = comb.singleton(mooseQuery.__Moose, {
    instance:{

        __inImportOfModels:false,

        __addModelProxy:function (file) {
            var promises = [];
            var repl = [];

            var orig = this["addModel"];
            repl.push({name:"addModel", orig:orig});
            this["addModel"] = function (arg1, arg2) {
                try {
                    var ret;
                    ret = orig.apply(this, arguments);
                    promises.push(comb.when(ret));
                } catch (e) {
                    promises.push(new Promise().errback(e));
                }
                return ret;
            };
            require(file);
            if (promises.length == 0) {
                promises.push(new Promise().callback());
            }
            return new PromiseList(promises, true).both(hitch(this, function () {
                repl.forEach(function (o) {
                    this[o.name] = o.orig;
                }, this)
            }));
        },

        import:function () {
            var args = comb.argsToArray(arguments);
            return new PromiseList(args.map(hitch(this, "__addModelProxy")), true);
        },

        addModel:function (table, proto) {
            var ret = new Promise();
            model.create(table, proto).then(hitch(this, function (model) {
                ret.callback(model);
            }), hitch(ret, "errback"));
            return ret;
        },

        getModel:function (name, db) {
            return model.getModel(name, db);
        },

        setters:{
            camelize:function () {
                model.Model.camelize = true;
            },

            underscore:function () {
                model.Model.underscore = true;
            }
        },

        getters:{
            camelize:function () {
                return model.Model.camelize;
            },

            underscore:function () {
                return model.Model.underscore;
            }
        }
    }
});

var moose = exports;
module.exports = moose = new Moose();

/**
 * @namespace
 */
moose.plugins = plugins;