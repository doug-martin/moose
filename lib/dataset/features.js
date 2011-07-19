var comb = require("comb");


comb.define(null, {
    instance : {
        getters : {

            // Whether this dataset quotes identifiers.
            quoteIdentifiers : function() {
                return this.__quoteIdentifiers;
            },

            // Whether this dataset will provide accurate number of rows matched for
            // delete and update statements.  Accurate in this case is the number of
            // rows matched by the dataset's filter.
            providesAccurateRowsMatched : function() {
                return true;
            },

            //Whether the dataset requires SQL standard datetimes (false by default,
            // as most allow strings with ISO 8601 format).
            requiresSqlStandardDateTimes : function() {
                return false;
            },

            // Whether the dataset supports common table expressions (the WITH clause).
            supportsCte : function() {
                return true;
            },

            // Whether the dataset supports the DISTINCT ON clause, false by default.
            supportsDistinctOn : function() {
                return false;
            },

            //Whether the dataset supports the INTERSECT and EXCEPT compound operations, true by default.
            supportsIntersectExcept : function() {
                return true;
            },

            //Whether the dataset supports the INTERSECT ALL and EXCEPT ALL compound operations, true by default.
            supportsIntersectExceptAll : function() {
                return true;
            },

            //Whether the dataset supports the IS TRUE syntax.
            supportsIsTrue : function() {
                return true;
            },

            //Whether the dataset supports the JOIN table USING (column1, ...) syntax.
            supportsJoinUsing : function() {
                return true;
            },

            //Whether modifying joined datasets is supported.
            supportsModifyingJoins : function() {
                return false;
            },

            //Whether the IN/NOT IN operators support multiple columns when an
            supportsMultipleColumnIn : function() {
                return true;
            },

            //Whether the dataset supports timezones in literal timestamps
            supportsTimestampTimezones : function() {
                return false;
            },

            //Whether the dataset supports fractional seconds in literal timestamps
            supportsTimestampUsecs : function() {
                return true;
            },

            //Whether the dataset supports window functions.
            supportsWindowFunctions : function() {
                return false;
            }

        }
    }
}).export(module);
