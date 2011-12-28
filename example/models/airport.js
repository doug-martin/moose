var moose = require("../../lib"),
    expressPlugin = require("../plugins/ExpressPlugin");


moose.addModel("airport", {
    plugins:[moose.plugins.CachePlugin, expressPlugin],

    static:{
        init:function () {
            this.manyToMany("supportedAirplaneTypes", {
                joinTable:"canLand",
                model:"airplaneType"
            });
        }
    }
});

