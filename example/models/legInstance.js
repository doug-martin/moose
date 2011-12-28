var moose = require("../../lib");

moose.addModel("legInstance", {
    static:{
        init:function () {
            var eager = this.fetchType.EAGER;
            this.manyToOne("airplane", {fetchType:eager})
                .manyToOne("flightLeg", {fetchType:eager, key:"flightLegId"});
        }
    }
});



