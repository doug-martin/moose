var moose = require("../../lib");

moose.addModel("airplaneType", {
    static:{
        init:function () {
            this.manyToMany("supportedAirports", {model:"airport", joinTable:"canLand", fetchType:this.fetchType.EAGER})
                .oneToMany("airplanes");
        }
    }
});

