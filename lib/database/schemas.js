var comb = require("comb"), hitch = comb.hitch, errors = require("../errors"), NotImplemented = errors.NotImplemented, Table = require("../Table").Table;

var Database = comb.define(null, {
    instance : {

        constructor : function() {
            this.super(arguments);
            this.schemas = {};
        },

        loadSchema : function(name) {
            var promise = null;
            promise = new Promise();
            var schema = this.schemas;
            if (!(name in schema)) {
                this.schema(name)
                    .then(hitch(this, function(table) {
                    if (table) {
                        var schema;
                        if ((schema = this.schemas) == null) {
                            schema = this.schemas = {};
                        }
                        //put the schema under the right database
                        schema[name] = table;
                    }
                    promise.callback(table);
                }), hitch(promise, "errback"));
            } else {
                promise.callback(schema[name]);
            }

            return promise;
        },

        schema : function() {
            throw new NotImplemented("schema must be implemented by the adapter");
        },

        /**
         * <p>Creates a new table. This function should be used while performing a migration.</p>
         * <p>If the table should be created in another DB then the table should have the database set on it.</p>
         *
         * @example
         * //default database table creation
         * moose.createTable("test", function(table){
         *     table.column("id", types.INT())
         *     table.primaryKey("id");
         * });
         *
         * //create a table in another database
         * moose.createTable("test", function(table){
         *     table.database = "otherDB";
         *     table.column("id", types.INT())
         *     table.primaryKey("id");
         * });
         *
         *
         * @param {String} tableName the name of the table to create
         * @param {Funciton} cb this funciton is callback with the table
         *      - All table properties should be specified within this block
         *
         * @return {comb.Promise} There are two different results that the promise can be called back with.
         * <ol>
         *     <li>If a migration is currently being performed then the promise is called back with a
         *     function that should be called to actually perform the migration.</li>
         *     <li>If the called outside of a migration then the table is created immediately and
         *     the promise is called back with the result.</li>
         * </ol>
         *
         * */
        createTable : function(tableName, cb) {
            var table = new Table(tableName, {}), ret = new comb.Promise();
            cb(table);
            //add it to the moose schema map
            var db = this.client.database, schema;
            if ((schema = this.schemas) == null) {
                schema = this.schemas = {};
            }
            schema[tableName] = table;
            this.client.query(table.createTableSql).then(hitch(ret, "callback", true), hitch(ret, "errback"));
            return ret;
        },

        dropAndCreateTable : function(table, cb) {
            var ret = new comb.Promise();
            this.dropTable(table)
                .chain(hitch(this, "createTable", table, cb), hitch(ret, "errback"))
                .then(hitch(ret, "callback"), hitch(ret, "errback"));
            return ret;
        },


        /**
         * Drops a table
         *
         * @example
         *
         * //drop table in default database
         * moose.dropTable("test");
         *
         * //drop table in another database.
         * moose.dropTable("test", "otherDB");
         *
         * @param {String} table the name of the table
         * @param {String} [database] the database that the table resides in, if a database is not
         *                            provided then the default database is used.
         * @return {comb.Promise} There are two different results that the promise can be called back with.
         * <ol>
         *     <li>If a migration is currently being performed then the promise is called back with a
         *     function that should be called to actually perform the migration.</li>
         *     <li>If the called outside of a migration then the table is dropped immediately and
         *     the promise is called back with the result.</li>
         * </ol>
         **/
        dropTable : function(table, database) {
            table = new Table(table, {database : database}),ret = new comb.Promise();
            //delete from the moose schema map
            var db = database || this.client.database;
            var schema = this.schemas;
            if (schema && table in schema) {
                delete schema[table];
            }
            this.client.query(table.createTableSql).then(hitch(ret, "callback", true), hitch(ret, "errback"));
            return ret;

        },

        /**
         * Alters a table
         *
         * @example :
         *
         * //alter table in default database
         * moose.alterTable("test", function(table){
         *     table.rename("test2");
         *     table.addColumn("myColumn", types.STRING());
         * });
         *
         * //alter table in another database
         * moose.alterTable("test", "otherDB", function(table){
         *     table.rename("test2");
         *     table.addColumn("myColumn", types.STRING());
         * });
         *
         * @param {String} name The name of the table to alter.
         * @param {String} [database] the database that the table resides in, if a database is not
         *                            provided then the default database is used.
         * @param {Function} cb the function to execute with the table passed in as the first argument.
         *
         * @return {comb.Promise} There are two different results that the promise can be called back with.
         * <ol>
         *     <li>If a migration is currently being performed then the promise is called back with a
         *     function that should be called to actually perform the migration.</li>
         *     <li>If the called outside of a migration then the table is altered immediately and
         *     the promise is called back with the result.</li>
         * </ol>
         * */
        alterTable : function(name, cb) {
            if (comb.isFunction(database)) {
                cb = database;
            }
            var ret = new Promise();
            var db = this.client.database;
            var schema = this.schemas;
            if (schema && name in schema) {
                delete schema[name];
            }
            this.loadSchema(name, db).then(function(table) {
                cb(table);
                this.client.query(table.alterTableSql).then(hitch(ret, "callback", true), hitch(ret, "errback"));
            }, hitch(ret, "errback"));
            return ret;

        },


        //ALTER TABLE SHORTCUTS


        addColumn : function(table) {
            var ret = new comb.Promise();
            var args = comb.argsToArray(arguments).slice(1);
            this.alterTable(table,
                function(table) {
                    table.dropColumn.apply(table, args);
                }).then(hitch(ret, "callback"), hitch(ret, "errback"));
            return ret;
        },

        renameColumn : function(table) {
            var ret = new comb.Promise();
            var args = comb.argsToArray(arguments).slice(1);
            this.alterTable(table,
                function(table) {
                    table.renameColumn.apply(table, args);
                }).then(hitch(ret, "callback"), hitch(ret, "errback"));
            return ret;
        },

        dropColumn : function(table) {
            var ret = new comb.Promise();
            var args = comb.argsToArray(arguments).slice(1);
            this.alterTable(table,
                function(table) {
                    table.dropColumn.apply(table, args);
                }).then(hitch(ret, "callback"), hitch(ret, "errback"));
            return ret;
        },

        renameTable : function(table, newName) {
            var ret = new comb.Promise();
            this.alterTable(table,
                function(table) {
                    table.rename(newName);
                }).then(hitch(ret, "callback"), hitch(ret, "errback"));
            return ret;
        },

        setColumnDefault : function(table) {
            var ret = new comb.Promise();
            var args = comb.argsToArray(arguments).slice(1);
            this.alterTable(table,
                function(table) {
                    table.setColumnDefault.apply(table, args);
                }).then(hitch(ret, "callback"), hitch(ret, "errback"));
            return ret;
        },

         setColumnType : function(table) {
            var ret = new comb.Promise();
            var args = comb.argsToArray(arguments).slice(1);
            this.alterTable(table,
                function(table) {
                    table.setColumnType.apply(table, args);
                }).then(hitch(ret, "callback"), hitch(ret, "errback"));
            return ret;
        }
    }
});

exports = module.exports = Database;

