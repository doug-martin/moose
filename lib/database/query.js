var comb = require("comb"), hitch = comb.hitch, errors = require("../errors"), NotImplemented = errors.NotImplemented;


var Database = comb.define(null, {
    instance : {
        /**Executes the given SQL on the database. This method should be overridden in descendants.
         This method should not be called directly by user code.
         */
        execute : function(sql, options) {
            throw new NotImplemented("execute should be implemented by adapter");
        },

        /**
         * Method that should be used when submitting any DDL (Data DefinitionLanguage) SQL, such as +create_table+.
         * By default, calls +execute_dui+.
         *This method should not be called directly by user code.
         */
        executeDdl : function(sql, opts, cb) {
            opts = opts || {};
            return this.executeDui(sql, opts, cb)
        },


        /**Method that should be used when issuing a DELETE, UPDATE, or INSERT
         *statement.  By default, calls execute.
         *This method should not be called directly by user code.
         * */
        executeDui : function(sql, opts, cb) {
            opts = opts || {};
            return this.execute(sql, opts, cb)
        },

        /**
         * Method that should be used when issuing a INSERT
         *statement.  By default, calls execute_dui.
         *This method should not be called directly by user code.
         * */
        executeInsert : function(sql, opts, cb) {
            opts = opts || {};
            return this.executeDui(sql, opts, block);
        },

        /** Return a hash containing index information. Hash keys are index name symbols.
         * Values are subhashes with two keys, :columns and :unique.  The value of :columns
         * is an array of symbols of column names.  The value of :unique is true or false
         * depending on if the index is unique.
         *
         * Should not include the primary key index, functional indexes, or partial indexes.
         *
         *   DB.indexes(:artists) => {artists_name_ukey : {columns : [name], unique : true}}
         *   */
        indexes : function(table, opts) {
            throw new NotImplemented("indexes should be overridden by adapters");
        },


        /** Runs the supplied SQL statement string on the database server. Returns nil.
         * Options:
         * :server :: The server to run the SQL on.
         *
         *   DB.run("SET some_server_variable = 42")
         *   */
        run : function(sql, opts) {
            opts = opts || {};
            this.executeDdl(sql, opts);
            return null;
        },

        /**
         * Retreives a table from the database and returns a {@link moose.Table} from the parsed schema.
         * @param table
         */
        schema : function(table) {
            throw new NotImplemented("schema should be implemented by the adapter");
        },

        /**
         * Determine if a table exists;
         * @param table
         */
        tableExists : function(table) {
            var ret = new Promise();
            this.dataset(table).then(hitch(ret, "callback", true), hitch(ret, "callback", false));
            return ret;
        },

        tables : function() {
            throw new NotImplemented("tables should be implemented by the adapter");
        }
    },

    static : {
        SQL_BEGIN : 'BEGIN',
        SQL_COMMIT : 'COMMIT',
        SQL_RELEASE_SAVEPOINT : 'RELEASE SAVEPOINT autopoint_%d',
        SQL_ROLLBACK : 'ROLLBACK',
        SQL_ROLLBACK_TO_SAVEPOINT : 'ROLLBACK TO SAVEPOINT autopoint_%d',
        SQL_SAVEPOINT : 'SAVEPOINT autopoint_%d',

        TRANSACTION_BEGIN : 'Transaction.begin',
        TRANSACTION_COMMIT : 'Transaction.commit',
        TRANSACTION_ROLLBACK : 'Transaction.rollback',

        TRANSACTION_ISOLATION_LEVELS : {
            uncommitted : 'READ UNCOMMITTED',
            committed : 'READ COMMITTED',
            repeatable : 'REPEATABLE READ',
            serializable : 'SERIALIZABLE'
        }

    }
});

exports = module.exports = Database;

