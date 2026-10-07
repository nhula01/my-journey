(function () {
    'use strict';

    var bodyChangeFactory = function () {
        var BodyChange = function (df, dl, dg, dDecw, dtherm) {
            this.df = df || 0;
            this.dl = dl || 0;
            this.dg = dg || 0;
            this.dDecw = dDecw || 0;
            this.dtherm = dtherm || 0;
        };

        return BodyChange;
    };

    services.factory('BodyChange', [bodyChangeFactory]);
}());
