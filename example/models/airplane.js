var moose = require("../../lib");

moose.addModel("airplane", {
    static:{
        init:function () {
            this.manyToOne("type", {model:"airplaneType", fetchType:this.fetchType.EAGER})
                .oneToMany("legs", {model:"legInstance"});
        }
    }
});


