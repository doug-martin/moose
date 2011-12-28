var moose = require("../lib"),
    data = require("./data"),
    helper = require("./schemas"),
    comb = require("comb");


exports.loadData = function () {
    moose.camelize = true;
    return comb.executeInOrder(helper, moose,
        function (helper, moose) {
            helper.createTables();
            moose.import(__dirname + "/models");
            var Airport = moose.getModel("airport"), AirplaneType = moose.getModel("airplaneType"), Flight = moose.getModel("flight");
            Airport.save(data.airports);
            AirplaneType.save(data.airplaneTypes);
            Flight.save(data.flights);
        });
};

exports.dropModels = function () {
    return helper.dropTableAndDisconnect();
};