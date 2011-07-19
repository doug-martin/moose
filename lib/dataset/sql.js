var comb = require("comb"), string = comb.string, sql = require("../sql"),

    Expression = sql.sql.Expression,
    ComplexExpression = sql.sql.ComplexExpression,
    AliasedExpression = sql.sql.AliasedExpression,
    Identifier = sql.sql.Identifier,
    QualifiedIdentifier = sql.sql.QualifiedIdentifier,
    Blob = sql.sql.Blob,
    OrderedExpression = sql.sql.OrderedExpression,
    CaseExpression = sql.sql.CaseExpression,
    SubScript = sql.sql.SubScript,
    NumericExpression = sql.sql.NumericExpression,
    Cast = sql.sql.Cast,
    StringExpression = sql.sql.StringExpression,
    BooleanExpression = sql.sql.BooleanExpression,
    SQLFunction = sql.sql.SQLFunction,
    LiteralString = sql.LiteralString,
    PlaceHolderLiteralString = sql.sql.PlaceHolderLiteralString,
    QueryError = require("../errors").QueryError;


var AND_SEPARATOR = " AND ";
var BOOL_FALSE = "'f'";
var BOOL_TRUE = "'t'";
var COMMA_SEPARATOR = ', ';
var COLUMN_REF_RE1 = /^(\w+)__(\w+)___(\w+)$/;
var COLUMN_REF_RE2 = /^([\w]+)___([\w]+)$/;
var COLUMN_REF_RE3 = /^([\w]+)__([\w]+)$/;
var COUNT_FROM_SELF_OPTS = ["distinct", "group", "sql", "limit", "compounds"];
var COUNT_OF_ALL_AS_COUNT = new sql.sql.SQLFunction("count", new LiteralString('*')).as("count");
var DATASET_ALIAS_BASE_NAME = 't';
var FOR_UPDATE = ' FOR UPDATE';
var IS_LITERALS = {NULL :'NULL', true : 'TRUE', false : 'FALSE'};
var IS_OPERATORS = ComplexExpression.IS_OPERATORS;
var N_ARITY_OPERATORS = ComplexExpression.N_ARITY_OPERATORS;
var TWO_ARITY_OPERATORS = ComplexExpression.TWO_ARITY_OPERATORS;
var NULL = "NULL";
var QUALIFY_KEYS = ["select", "where", "having", "order", "group"];
var QUESTION_MARK = /\?/g;
var DELETE_CLAUSE_METHODS = ["deleteFromSql", "deleteWhereSql"];
var INSERT_CLAUSE_METHODS = ["insertIntoSql", "insertColumnsSql", "insertValuesSql"];
var SELECT_CLAUSE_METHODS = ["selectWithSql", "selectDistinctSql", "selectColumnsSql",
    "selectFromSql", "selectJoinSql", "selectWhereSql", "selectGroupSql", "selectHavingSql",
    "selectCompoundsSql", "selectOrderSql", "selectLimitSql", "selectLockSql"];
var UPDATE_CLAUSE_METHODS = ["updateTableSql", "updateSetSql", "updateWhereSql"];
var TIMESTAMP_FORMAT = "'Y-M-d H:m:s Z'";
var STANDARD_TIMESTAMP_FORMAT = "TIMESTAMP " + TIMESTAMP_FORMAT;
var YEAR_FORMAT = "YYYY";
var WILDCARD = new sql.LiteralString('*');
var SQL_WITH = "WITH ";
var Dataset = comb.define(null, {

    instance : {
        adapter : null,

        AND_SEPARATOR : AND_SEPARATOR,
        BOOL_FALSE : BOOL_FALSE,
        BOOL_TRUE : BOOL_TRUE,
        COMMA_SEPARATOR : COMMA_SEPARATOR,
        COLUMN_REF_RE1 : COLUMN_REF_RE1,
        COLUMN_REF_RE2 : COLUMN_REF_RE2,
        COLUMN_REF_RE3 : COLUMN_REF_RE3,
        COUNT_FROM_SELF_OPTS : COUNT_FROM_SELF_OPTS,
        COUNT_OF_ALL_AS_COUNT : COUNT_OF_ALL_AS_COUNT,
        DATASET_ALIAS_BASE_NAME : DATASET_ALIAS_BASE_NAME,
        FOR_UPDATE : FOR_UPDATE,
        IS_LITERALS : IS_LITERALS,
        IS_OPERATORS : IS_OPERATORS,
        N_ARITY_OPERATORS : N_ARITY_OPERATORS,
        NULL : NULL,
        QUALIFY_KEYS : QUALIFY_KEYS,
        YEAR_FORMAT : YEAR_FORMAT,
        QUESTION_MARK : QUESTION_MARK,
        DELETE_CLAUSE_METHODS : DELETE_CLAUSE_METHODS,
        INSERT_CLAUSE_METHODS : INSERT_CLAUSE_METHODS,
        SELECT_CLAUSE_METHODS : SELECT_CLAUSE_METHODS,
        UPDATE_CLAUSE_METHODS : UPDATE_CLAUSE_METHODS,
        TIME_STAMP_FORMAT : TIMESTAMP_FORMAT,
        STANDARD_TIMESTAMP_FORMAT : STANDARD_TIMESTAMP_FORMAT,
        TWO_ARITY_OPERATORS : TWO_ARITY_OPERATORS,
        WILDCARD : WILDCARD,
        SQL_WITH : SQL_WITH,

        // Returns a DELETE SQL query string.  See +delete+.
        //
        //   dataset.filter{|o| o.price >= 100}.delete_sql
        //   // => "DELETE FROM items WHERE (price >= 100)"
        deleteSql : function() {
            var opts = this.__opts;
            if (opts.sql) {
                return this.staticSql(this.sql);
            } else {
                this.checkModificationAllowed();
                return this.clauseSql("delete");
            }
        },

        //Returns an INSERT SQL query string.  See +insert+.
        //     //  DB[:items].insert_sql(:a=>1)
        //  //=> "INSERT INTO items (a) VALUES (1)"
        insertSql : function() {
            var values = comb.argsToArray(arguments);
            var opts = this.__opts;
            if (opts.sql) {
                return this.staticSql(opts.sql);
            }
            this.checkModificationAllowed();

            var columns = [];

            switch (values.length) {
                case 0 :
                    return this.insertSql({});
                case 1 :
                    var vals = values[0], v;
                    if (comb.isInstanceOf(vals, this.constructor) || comb.isArray(vals) || comb.isInstanceOf(vals, LiteralString)) {
                        values = vals;
                    } else if (vals.hasOwnProperty("values") && comb.isObject((v = vals.values))) {
                        return this.insertSql(v);
                    } else if (comb.isHash(vals)) {
                        vals = comb.merge({}, opts.defaults || {}, vals);
                        vals = comb.merge({}, opts.overrides || {}, vals);
                        values = [];
                        for (var i in vals) {
                            columns.push(i);
                            values.push(vals[i]);
                        }
                    }
                    break;
                case 2 :
                    var v0 = values[0], v1 = values[1]
                    if (comb.isArray(v0) && comb.isArray(v1) | comb.isInstanceOf(v1, this.constructor) || comb.isInstanceOf(LiteralString)) {
                        columns = v0,values = v1;
                        if (comb.isArray(values) && columns.length != values.length) {
                            throw new QueryError("Different number of values and columns given to insertSql");
                        }
                    }
                    break;
            }
            columns = columns.map(function(k) {
                return comb.isString(k) ? new Identifier(k) : k;
            }, this);
            return this.mergeOptions({columns : columns, values : values})._insertSql();
        },

        //Returns an array of insert statements for inserting multiple records.
        //This method is used by +multi_insert+ to format insert statements and
        //expects a keys array and and an array of value arrays.
        //     //This method should be overridden by descendants if the support
        //inserting multiple records in a single SQL statement.
        multiInsertSql : function(columns, values) {
            values.map(function(r) {
                this.insertSql(columns, r)
            }, this);
        },

        //Returns a SELECT SQL query string.
        //     //  dataset.select_sql //=> "SELECT * FROM items"
        selectSql :  function() {
            if (this.__opts.sql) return this.staticSql(this.__opts.sql);
            else return this.clauseSql("select");
        },

        //Same as +select_sql+, not aliased directly to make subclassing simpler.
        sql :  function() {
            return this.selectSql();
        },


        //Returns a TRUNCATE SQL query string.  See +truncate+
        //     //  DB[:items].truncate_sql //=> 'TRUNCATE items'
        truncateSql :  function() {
            if (this.__opts.sql) {
                return this.staticAql(this.__opts.sql);
            } else {
                this.checkModificationAllowed();
                if (this.__opts.where) {
                    throw new QueryError("cant truncate filtered datasets");
                }
                return this._truncateSql(this.sourceList(this.__opts.from));
            }
        },

        //Formats an UPDATE statement using the given values.  See +update+.
        //     //  DB[:items].update_sql(:price => 100, :category => 'software')
        //  //=> "UPDATE items SET price = 100, category = 'software'
        //     //Raises an +Error+ if the dataset is grouped or includes more
        //than one table.
        updateSql : function(values) {
            values = values || {};
            if (this.__opts.sql) return this.staticSql(this.__opts.sql);
            this.checkModificationAllowed();
            return this.mergeOptions({values : values})._updateSql();
        },



        // Returns an EXISTS clause for the dataset as a +LiteralString+.
        //
        //   DB.select(1).where(DB[:items].exists)
        ///   // SELECT 1 WHERE (EXISTS (SELECT * FROM items))
        exists :  function() {
            return new LiteralString("EXISTS (" + this.selectSql() + ")");
        },

        /**
         *     //Qualify the given expression e to the given table.
         * @param column
         * @param table
         */

        qualifiedExpression : function(e, table) {
            var h, i, args;
            if (comb.isString(e)) {
                var parts = this.splitSymbol(e)
                var t = parts[0], column = parts[1], alias = parts[2];
                if (t) {
                    return e;
                } else if (alias) {
                    return new AliasedExpression(new QualifiedIdentifier(table, new Identifier(column)), alias);
                } else {
                    return new QualifiedIdentifier(table, e);
                }
            } else if (comb.isArray(e)) {
                return e.map(function(exp) {
                    return this.qualifiedExpression(e, table);
                }, this);
            } else if (comb.isInstanceOf(e, Expression)) {
                if (comb.isInstanceOf(e, Identifier)) {
                    return new QualifiedIdentifier(table, e);
                } else if (comb.isInstanceOf(e, OrderedExpression)) {
                    return new OrderedExpression(this.qualifiedExpression(e.expression, table), e.descending, {nulls : e.nulls});
                } else if (comb.isInstanceOf(e, AliasedExpression)) {
                    return new AliasedExpression(this.qualifiedExpression(e.expression, table), e.alias);
                } else if (comb.isInstanceOf(e, CaseExpression)) {
                    args = [this.qualifiedExpression(e.conditions, table), this.qualifiedExpression(e.def, table)];
                    if (e.hasExpression) {
                        args.push(this.qualifiedExpression(e.expression, table));
                    }
                    return CaseExpression.fromArgs(args);
                } else if (comb.isInstanceOf(e, Cast)) {
                    return new Cast(this.qualifiedExpression(e.expr, table), e.type);
                } else if (comb.isInstanceOf(e, SQLFunction)) {
                    return SQLFunction.fromArgs([e.f].concat(this.qualifiedExpression(e.args, table)));
                } else if (comb.isInstanceOf(e, ComplexExpression)) {
                    return ComplexExpression.fromArgs([e.op].concat(this.qualifiedExpression(e.args, table)));
                } else if (comb.isInstanceOf(e, SubScript)) {
                    return new SubScript(this.qualifiedExpression(e.f, table), this.qualifiedExpression(e.sub, table));
                } else if (comb.isInstanceOf(e, PlaceHolderLiteralString)) {
                    args = [];
                    var eArgs = e.args;
                    if (comb.isHash(eArgs)) {
                        h = {};
                        for (i in eArgs) {
                            h[i] = this.qualifiedExpression(eArgs[i], table);
                        }
                        args = h;
                    } else {
                        args = this.qualifiedExpression(eArgs, table);
                    }
                    return new PlaceHolderLiteralString(e.str, args, e.parens);
                }
            } else if (comb.isHash(e)) {
                h = {};
                for (i in e) {
                    h[this.qualifiedExpression(i, table) + ""] = this.qualifiedExpression(e[i], table);
                }
                return h;
            } else {
                return e;
            }
        },
        /**
         *    //Returns a qualified column name (including a table name) if the column
         * name isn't already qualified.
         */
        qualifiedColumnName : function(column, table) {
            if (comb.isString(column)) {
                var parts = this.splitSymbol(column);
                var columnTable = parts[0], alias = parts[2], tableAlias;
                column = parts[1];
                if (!columnTable) {
                    if (comb.isInstanceOf(table, AliasedExpression)) {
                        tableAlias = table.alias;
                    } else {
                        parts = this.splitSymbol(table);
                        var schema = parts[0], tableAlias = parts[2];
                        table = parts[1];
                        if (schema) {
                            tableAlias = tableAlias || new QualifiedIdentifier(schema, table);
                        }
                    }
                    columnTable = tableAlias || table;
                }
                return new QualifiedIdentifier(columnTable, column);
            } else {
                return column;
            }
        },

        // The first source (primary table) for this dataset.  If the dataset doesn't
        // have a table, raises an +Error+.  If the table is aliased, returns the aliased name.
        //
        //   DB[:table].first_source_alias
        //   //=> :table
        //
        //   DB[:table___t].first_source_alias
        //   //=> :t
        firstSourceAlias :  function() {
            var source = this.__opts.from;
            if (comb.isUndefined(source) || !source || !source.length) {
                throw new QueryError("No source specified for the query");
            }
            var source = source[0];
            if (comb.isInstanceOf(source, sql.sql.AliasedExpression)) {
                return s.alias;
            } else {
                var parts = this.splitSymbol(source);
                var alias = parts[2];
                return alias ? alias : source;
            }
        },

        // Splits a possible implicit alias in C, handling both SQL::AliasedExpressions
        // and Symbols.  Returns an array of two elements, with the first being the
        // main expression, and the second being the alias.
        splitAlias :  function(c) {
            var ret;
            if (comb.isInstanceOf(c, AliasedExpression)) {
                ret = [c.expression, c.alias];
            } else if (comb.isString(c)) {
                var parts = this.splitSymbol(c), cTable = parts[0],column = parts[1], alias = parts[2];
                if (alias) {
                    ret = [cTable ? new QualifiedIdentifier(cTable, column) : column, alias];
                } else {
                    ret = [c, null];
                }
            } else {
                ret = [c, null];
            }
            return ret;
        },

        // either be a string or nil.
        //
        // For columns, these parts are the table, column, and alias.
        // For tables, these parts are the schema, table, and alias.
        splitSymbol :  function(s) {
            var ret, m;
            if ((m = s.match(this.COLUMN_REF_RE1)) != null)
                ret = m.slice(1);
            else if ((m = s.match(this.COLUMN_REF_RE2)) != null)
                ret = [null, m[1], m[2]];
            else if ((m = s.match(this.COLUMN_REF_RE3)) != null)
                ret = [m[1], m[2], null];
            else
                ret = [null, s, null];
            return ret;
        },

        toAliasedTableName :  function(alias) {
            var ret;
            if (comb.isString(alias)) {
                ret = alias;
            } else if (comb.isInstanceOf(alias, Identifier)) {
                ret = alias.value;
            } else {
                throw new QueryError("Invalid table alias");
            }
            return ret;
        },


        toTableName :  function(name) {
            var ret;
            if (comb.isString(name)) {
                var parts = this.splitSymbol(name);
                var schema = parts[0], table = parts[1], alias = parts[2];
                ret = (schema || alias) ? alias || table : table;
            } else if (comb.isInstanceOf(name, Identifier)) {
                ret = name.value;
            } else if (comb.isInstanceOf(name, QualifiedIdentifier)) {
                ret = this.toTableName(name.column);
            } else if (comb.isInstanceOf(name, AliasedExpression)) {
                ret = this.toAliasedTableName(name.alias);
            } else {
                throw new QueryError("Invalid object to retrieve the table name from");
            }
            return ret;
        },

        /**
         * //Return the unaliased part of the identifier.  Handles both
         //implicit aliases in symbols, as well as SQL::AliasedExpression
         //objects.  Other objects are returned as is.
         unaliased_identifier :  function(c){
         case c
         when Symbol
         c_table, column, _ = split_symbol(c)
         c_table ? SQL::QualifiedIdentifier.new(c_table, column.to_sym) : column.to_sym
         when SQL::AliasedExpression
         c.expression
         else
         c
         end
         end
         * @param tableAlias
         */

        unaliasedIdentifier :  function(c) {
            if (comb.isString(c)) {
                var parts = this.splitSymbol(c);
                var table = parts[0], column = parts[1];
                if (table) {
                    return new QualifiedIdentifier(table, column);
                }
                return column;

            } else if (comb.isInstanceOf(c, AliasedExpression)) {
                return c.expression;
            } else {
                throw new QueryError("Invalid Identifier");
            }
        },

        // Creates a unique table alias that hasn't already been used in the dataset.
        // table_alias can be any type of object accepted by alias_symbol.
        // The symbol returned will be the implicit alias in the argument,
        // possibly appended with "_N" if the implicit alias has already been
        // used, where N is an integer starting at 0 and increasing until an
        // unused one is found.
        //
        //   DB[:table].unused_table_alias(:t)
        //   //=> :t
        //
        //   DB[:table].unused_table_alias(:table)
        //   //=> :table_0
        //
        //   DB[:table, :table_0].unused_table_alias(:table)
        //   //=> :table_1
        unusedTableAlias :  function(tableAlias) {
            tableAlias = this.toTableName(tableAlias);
            var usedAliases = [], from, join;
            if ((from = this.__opts.from) != null) {
                usedAliases = usedAliases.concat(from.map(function(n) {
                    return this.toTableName(n)
                }, this));
            }
            if ((join = this.__opts.join) != null) {
                usedAliases = usedAliases.concat(join.map(function(join) {
                    if (join.tableAlias) {
                        return this.toAliasedTableName(join.tableAlias);
                    } else {
                        return this.toTableName(join.table);
                    }
                }, this));
            }
            if (usedAliases.indexOf(tableAlias) != -1) {
                var base = tableAlias, i = 0;
                do{
                    tableAlias = comb.string.format("%s_%d", base, i++);
                } while (usedAliases.indexOf(tableAlias) != -1)
            }
            return tableAlias;
        },

        // Return a from_self dataset if an order or limit is specified, so it works as expected
        // with UNION, EXCEPT, and INTERSECT clauses.
        _compoundFromSelf :  function() {
            var opts = this.__opts;
            return (opts["limit"] || opts["order"]) ? this.fromSelf() : this;
        },

        // Return true if the dataset has a non-nil value for any key in opts.
        _optionsOverlap :  function(opts) {
            var o = [];
            for (var i in this.__opts) {
                if (this.__opts[i] != null) {
                    o.push(i);
                }
            }
            return comb.array.intersect(o, opts).length == 0;
        },

        //Formats in INSERT statement using the stored columns and values.
        _insertSql :  function() {
            return this.clauseSql("insert");
        },

        //Formats an UPDATE statement using the stored values.
        _updateSql :  function() {
            return this.clauseSql("update")
        },
        //Formats the truncate statement.  Assumes the table given has already been
        //literalized.
        _truncateSql :  function(table) {
            return "TRUNCATE TABLE" + table;
        },

        //Clone of this dataset usable in aggregate operations.  Does
        //a from_self if dataset contains any parameters that would
        //affect normal aggregation, or just removes an existing
        //order if not.
        aggregateDataset :  function() {
            this.optionsOverlap(this.COUNT_FROM_SELF_OPTS) ? this.fromSelf() : this.unordered();
        },

        //Raise an InvalidOperation exception if deletion is not allowed
        //for this dataset
        checkModificationAllowed :  function() {
            if (this.__opts.group) {
                throw new QueryError("Grouped datasets cannot be modified");
            }
            if (!this.supportsModifyingJoins && this.joinedDataset()) {
                throw new Error("Joined datasets cannot be modified");
            }
        },

        //Prepare an SQL statement by calling all clause methods for the given statement type.
        clauseSql :  function(type) {
            var sql = ("" + type).toUpperCase();
            this[sql + "_CLAUSE_METHODS"].forEach(function(m) {
                if (m.match("With")) {
                    sql = this[m](sql);
                } else {
                    sql += this[m]();
                }
            }, this);
            return sql;
        },


        //SQL fragment specifying the table to insert INTO
        insertIntoSql :  function(sql) {
            return string.format(" INTO%s", this.sourceList(this.__opts.from));
        },

//SQL fragment specifying the columns to insert into
        insertColumnsSql :  function(sql) {
            var columns = this.__opts.columns, ret = "";
            if (columns && columns.length) {
                ret = " (" + columns.map(
                    function(c) {
                        return c.toString(this);
                    }, this).join(this.COMMA_SEPARATOR) + ")";
            }
            return ret;
        },

        //SQL fragment specifying the values to insert.
        insertValuesSql :  function(sql) {
            var values = this.__opts.values, ret = "";
            if (comb.isArray(values)) {
                ret += values.length == 0 ? " DEFAULT VALUES" : " VALUES " + this.literal(values);
            } else if (comb.isInstanceOf(values, this.constructor)) {
                ret += " " + this.subselectSql(values);
            } else if (comb.isInstanceOf(values, LiteralString)) {
                ret += " " + values.toString(this);
            } else {
                throw new QueryError("Unsupported INSERT values type, should be an array or dataset");
            }
            return ret;
        },

        //Whether this dataset is a joined dataset
        joinedDataset :  function() {
            var from = this.__opts.from;
            return (comb.isArray(from) && from.length > 1) || this.__opts.join != null
        },

        // either be a string or nil.
        //
        // For columns, these parts are the table, column, and alias.
        // For tables, these parts are the schema, table, and alias.
        splitSymbol :  function(s) {
            var ret, m;
            if ((m = s.match(this.COLUMN_REF_RE1)) != null)
                ret = m.slice(1);
            else if ((m = s.match(this.COLUMN_REF_RE2)) != null)
                ret = [null, m[1], m[2]];
            else if ((m = s.match(this.COLUMN_REF_RE3)) != null)
                ret = [m[1], m[2], null];
            else
                ret = [null, s, null];
            return ret;
        },

        //SQL fragment for AliasedExpression
        aliasedExpressionSql :  function(ae) {
            return this.asSql(this.literal(ae.expression), ae.alias);
        },

        //SQL fragment for Array
        arraySql :  function(a) {
            return !a.length ? '(NULL)' : "(" + this.expressionList(a) + ")";
        },

        //SQL fragment for BooleanConstants
        booleanConstantSql :  function(constant) {
            return this.literal(constant)
        },

        //SQL fragment for CaseExpression
        caseExpressionSql :  function(ce) {
            var sql = '(CASE ';
            if (ce.expression) {
                sql += this.literal(ce.expression);
            }
            var conds;
            for (var i in conds) {
                sql += string.format("WHEN %s THEN %s", this.literal(i), this.literal(conds[i]));
            }
            return string.format("%s ELSE %s END)", sql, this.literal(ce.def));
        },

        //SQL fragment for the SQL CAST expression
        castSql : function(expr, type) {
            return string.format("CAST(%s AS %s)", this.literal(expr), this.db.castTypeLiteral(type));
        },

        //SQL fragment for specifying all columns in a given table
        columnAllSql :  function(ca) {
            return  string.format("%s.*", this.quoteSchemaTable(ca.table));
        },

        //SQL fragment for complex expressions
        complexExpressionSql : function(op, args) {
            var newOp;
            if ((newOp = this.IS_OPERATORS[op]) != null) {
                var r = args[1], v = comb.isNull(r) ? this.IS_LITERALS.NULL : this.IS_LITERALS[r];
                if (r == null || this.supportsIsTrue) {
                    if (!v) {
                        throw new QueryError("Invalid argument used for IS operator");
                    }
                    l = args[0];
                    return string.format("(%s %s %s)", comb.isString(l) ? l : this.literal(l), newOp, v);
                } else if (op == "IS") {
                    return this.complexExpressionSql("EQ", args);
                } else {
                    return this.complexExpressionSql("OR", [BooleanExpression.fromArgs(["NEQ"].concat(args)), new BooleanExpression("IS", args[0], null)]);
                }

            } else if (["IN", "NOTIN"].indexOf(op) != -1) {
                var cols = args[0], vals = args[1], colArray = comb.isArray(cols), valArray = false, emptyValArray = false;

                if (comb.isArray(vals)) {
                    valArray = true;
                    emptyValArray = vals.length == 0;
                }
                if (colArray) {
                    if (emptyValArray) {
                        if (op == "IN") {
                            return this.literal(BooleanExpression.fromValuePairs(cols.map(function(x) {
                                return  [x, x];
                            }), "AND", true));
                        } else {
                            return this.literal({1 : 1});
                        }
                    } else if (!this.supportsMultipleColumnIn) {
                        if (valArray) {
                            var expr = BooleanExpression.fromArgs(["OR"].concat(vals.map(function(vs) {
                                return BooleanExpression.fromValuePairs(array.zip(cols, vs))
                            })));
                            return this.literal(op == "IN" ? expr : expr.invert())
                        }
                    } else {
                        //If the columns and values are both arrays, use array_sql instead of
                        //literal so that if values is an array of two element arrays, it
                        //will be treated as a value list instead of a condition specifier.
                        return string.format("(%s %s %s)", comb.isString(cols) ? cols : this.literal(cols), ComplexExpression.IN_OPERATORS[op], valArray ? this.arraySql(vals) : this.literal(vals));
                    }
                }
                else {
                    if (emptyValArray) {
                        if (op == "IN") {
                            return this.literal(BooleanExpression.fromValuePairs([
                                [cols, cols]
                            ], "AND", true));
                        } else {
                            return this.literal({1 : 1});
                        }
                    } else {
                        return string.format("(%s %s %s)", comb.isString(cols) ? cols : this.literal(cols), ComplexExpression.IN_OPERATORS[op], this.literal(vals));
                    }
                }
            } else if ((newOp = this.TWO_ARITY_OPERATORS[op]) != null) {
                var l = args[0];
                return string.format("(%s %s %s)", comb.isString(l) ? l : this.literal(l), newOp, this.literal(args[1]));
            } else if ((newOp = this.N_ARITY_OPERATORS[op]) != null) {
                return string.format("(%s)", args.map(this.literal, this).join(" " + newOp + " "));
            } else if (op == "NOT") {
                return string.format("NOT %s", this.literal(args[0]));
            } else if (op == "NOOP") {
                return this.literal(args[0]);
            } else {
                throw new QueryError("Invalid operator " + op);
            }
        },

        //SQL fragment for constants
        constantSql :  function(constant) {
            return "" + constant;
        },

        //SQL fragment specifying an SQL function call
        functionSql :  function(f) {
            var args = f.args
            return string.format("%s%s", f.f, args.length == 0 ? '()' : this.literal(args));
        },

        //SQL fragment specifying a JOIN clause without ON or USING.
        joinClauseSql :  function(jc) {
            var table = jc.table
            var tableAlias = jc.tableAlias
            if (table == tableAlias) {
                tableAlias = null;
            }
            var tref = this.tableRef(table);
            return string.format(" %s #s", this.joinTypeSql(jc.joinType), tableAlias ? this.asSql(tref, tableAlias) : tref);
        },

        //SQL fragment specifying a JOIN clause with ON.
        joinOnClauseSql :  function(jc) {
            return string.format("%s ON %s", this.joinClauseSql(jc), this.literal(this._filterExpr(jc.on)));
        },

        //SQL fragment specifying a JOIN clause with USING.
        joinUsingClauseSql :  function(jc) {
            return string.format("%s USING %s", this.joinClauseSql(jc), this.columnList(jc.using));
        },

        //SQL fragment for NegativeBooleanConstants
        negativeBooleanConstantSql :  function(constant) {
            return string.format("NOT %s", this.booleanConstantSql(constant));
        },

        //SQL fragment for the ordered expression, used in the ORDER BY
        //clause.
        orderedExpressionSql :  function(oe) {
            var s = string.format("%s %s", this.literal(oe.expression), oe.descending ? "DESC" : "ASC");
            if (oe.nulls) {
                s = string.format("%s NULLS %s", s, oe.nulls == "first" ? "FIRST" : "LAST");
            }
            return s;
        },

        //SQL fragment for a literal string with placeholders
        placeholderLiteralStringSql :  function(pls) {
            var args = pls.args;
            var s;
            if (comb.isHash(args)) {
                for (var i in args) {
                    args[i] = this.literal(args[i]);
                }
                s = string.format(pls.str, args);
            } else {
                s = pls.str.replace(this.QUESTION_MARK, "%s");
                args = args.map(this.literal, this);
                s = string.format(s, args);

            }
            if (pls.parens) {
                s = string.format("(%s)", s);
            }
            return s;
        },


        //SQL fragment for the qualifed identifier, specifying
        //a table and a column (or schema and table).
        qualifiedIdentifierSql :  function(qcr) {
            [qcr.table, qcr.column].map(
                function(x) {
                    [QualifiedIdentifier, Identifier, String].some(function(c) {
                        return x instanceof c
                    }) ? this.literal(x) : this.quoteIdentifier(x)
                }).join('.');
        },

        //Adds quoting to identifiers (columns and tables). If identifiers are not
        //being quoted, returns name as a string.  If identifiers are being quoted
        //quote the name with quoted_identifier.
        quoteIdentifier :  function(name) {
            if (comb.isInstanceOf(LiteralString)) {
                return name;
            } else {
                if (comb.isInstanceOf(name, Identifier)) {
                    name = name.value;
                    var parts = this.splitSymbol(name), cTable = parts[0], column = parts[1];
                    name = string.format("%s%s", cTable ? this.quoteIdentifier(cTable) + "." : "", this.quoteIdentifier(column));
                }
                name = this.inputIdentifier(name);
                if (this.quoteIdentifiers) {
                    name = this.quotedIdentifier(name);
                }
                return name
            }
        },

        // Modify the identifier returned from the database based on the
        // identifier_output_method.
        inputIdentifier : function(v) {
            return v.toString(this);
        },

        //Separates the schema from the table and returns a string with them
        //quoted (if quoting identifiers)
        quoteSchemaTable :  function(table) {
            var parts = this.schemaAndTable(table);
            var schema = parts[0];
            table = parts[1];
            return string.format("%s%s", schema ? this.quoteIdentifier(schema) + "." : "", this.quoteIdentifier(table));
        },

        //This method quotes the given name with the SQL standard double quote.
        //should be overridden by subclasses to provide quoting not matching the
        //SQL standard, such as backtick (used by MySQL and SQLite).
        quotedIdentifier :  function(name) {
            return string.format("\"%s\"", ("" + name).replace('"', '""'));
        },

        //Split the schema information from the table
        schemaAndTable :  function(tableName) {
            var sch = this.db.defaultSchema || null;
            if (comb.isString(table)) {
                var parts = this.splitSymbol(tableName);
                var s = parts[0], table = parts[1];
                return [s || sch, table];
            } else if (comb.isInstanceOf(tableName, QualifiedIdentifier)) {
                return [tableName.table, tableName.column]
            } else if (comb.isInstanceOf(tableName, Identifier)) {
                return [null, tableName.value];
            } else {
                throw new QueryError("table should be a QualifiedIdentifier, Identifier, or String");
            }

        },

        //SQL fragment for specifying subscripts (SQL array accesses)
        subscriptSql :  function(s) {
            return string.format("%s[%s]", this.literal(s.f), this.expressionList(s.sub));
        },


        //Do a simple join of the arguments (which should be strings or symbols) separated by commas
        argumentList :  function(args) {
            return args.join(this.COMMA_SEPARATOR)
        },

        //SQL fragment for specifying an alias.  expression should already be literalized.
        asSql : function(expression, alias) {
            return string.format("%s AS %s", expression, this.quoteIdentifier(alias));
        },

        //Converts an array of column names into a comma seperated string of
        //column names. If the array is empty, a wildcard (*) is returned.
        columnList :  function(columns) {
            return (!columns || columns.length == 0) ? WILDCARD : this.expressionList(columns);
        },

        //The alias to use for datasets, takes a number to make sure the name is unique.
        datasetAlias :  function(number) {
            return this.DATASET_ALIAS_BASE_NAME + number;
        },

        //Converts an array of expressions into a comma separated string of
        //expressions.
        expressionList :  function(columns) {
            return columns.map(this.literal, this).join(this.COMMA_SEPARATOR);
        },

        //The strftime format to use when literalizing the time.
        defaultTimestampFormat :  function() {
            return this.requiresSqlStandardDateTimes() ? this.STANDARD_TIMESTAMP_FORMAT : this.TIMESTAMP_FORMAT;
        },

        //Format the timestamp based on the default_timestamp_format, with a couple
        //of modifiers.  First, allow %N to be used for fractions seconds (if the
        //database supports them), and override %z to always use a numeric offset
        //of hours and minutes.
        formatTimestamp :  function(v) {
            return comb.date.format(this.TIME_STAMP_FORMAT, v);
        },

        //Return the SQL timestamp fragment to use for the timezone offset.
        formatTimestampOffset : function(hour, minute) {
            return string.format("%+03d%02d", hour, minute)
        },

        //Return the SQL timestamp fragment to use for the fractional time part.
        //Should start with the decimal point.  Uses 6 decimal places by default.
        formatTimestampUsec :  function(usec) {
            return string.format(".%06d", usec);
        },

        //SQL fragment specifying a list of identifiers
        identifierList :  function(columns) {
            return columns.map(this.quotedIdentifier, this).join(this.COMMA_SEPARATOR);
        },

        //SQL fragment specifying a JOIN type, converts underscores to
        //spaces and upcases.
        joinTypeSql :  function(joinType) {
            return ("" + joinType).replace(/([a-z]*)|([A-Z][a-z]*)/g,
                function(m) {
                    return m.toUpperCase() + " "
                }
            ).trimRight() + "JOIN";
        },

        //Returns a literal representation of a value to be used as part
        //of an SQL expression.
        //
        //  DB[:items].literal("abc'def\\") //> "'abc''def\\\\'"
        //  DB[:items].literal(:items__id) //> "items.id"
        //  DB[:items].literal([1, 2, 3]) => "(1, 2, 3)"
        //  DB[:items].literal(DB[:items]) => "(SELECT * FROM items)"
        //  DB[:items].literal(:x + 1 > :y) => "((x + 1) > y)"
        //     //If an unsupported object is given, an +Error+ is raised.
        literal :  function(v) {
            if (comb.isInstanceOf(v, LiteralString)) {
                return "" + v;
            } else if (comb.isInstanceOf(v, Blob)) {
                return this.literalBlob(v);
            } else if (comb.isString(v)) {
                return this.literalString(v);
            } else if (comb.isNumber(v)) {
                return this.literalNumber(v);
            }
            else if (comb.isInstanceOf(v, Expression)) {
                return this.literalExpression(v);
            }
            else if (comb.isInstanceOf(v, this.constructor)) {
                return this.literalDataset(v);
            }
            else if (comb.isArray(v)) {
                return this.literalArray(v);
            } else if (comb.isInstanceOf(v, sql.Time)) {
                return this.literalTime(v);
            } else if (comb.isInstanceOf(v, sql.Year)) {
                return this.literalYear(v);
            } else if (comb.isInstanceOf(v, sql.DateTime)) {
                return this.literalDateTime(v);
            } else if (comb.isInstanceOf(v, sql.TimeStamp)) {
                return this.literalTimestamp(v);
            } else if (comb.isDate(v)) {
                return this.literalDate(v);
            }
            else if (comb.isNull(v)) {
                return this.literalNull();
            }
            else if (comb.isBoolean(v)) {
                return this.literalBoolean(v);
            }
            else if (comb.isHash(v)) {
                return this.literalObject(v);
            }
        },

        //SQL fragment for Hash, treated as an expression
        literalObject : function(v) {
            return this.literalExpression(BooleanExpression.fromValuePairs(v));
        },


        //SQL fragment for Array.  Treats as an expression if an array of all two pairs, or as a SQL array otherwise.
        literalArray :  function(v) {
            return Expression.isConditionSpecifier(v) ? this.literalExpression(BooleanExpression.fromValuePairs(v)) : this.arraySql(v);
        },

        literalNumber : function(num) {
            var ret = "" + num;
            if (isNaN(num) || num == Infinity) {
                ret = string.format("'%s'", ret);
            }
            return ret;
        },

        literalBlob : function(blob) {
            return this.literalString(blob);
        },

        //SQL fragment for Dataset.  Does a subselect inside parantheses.
        literalDataset :  function(dataset) {
            return string.format("(%s)", this.subselectSql(dataset));
        },

        //SQL fragment for Date, using the ISO8601 format.
        literalDate :  function(date) {
            var ret = this.requiresSqlStandardDateTimes ? "DATE" : "";
            ret += "%[YYYY-mm-dd]D";
            return comb.date.format(ret, date);
        },

        literalTime : function(v) {
            return this.formatTimestamp(v);
        },
        literalYear : function(o) {
            return comb.date.format(this.YEAR_FORMAT, o);
        },
        literalDateTime : function(v) {
            this.formatTimestamp(v)
        },
        literalTimestamp : function(v) {
            this.formatTimestamp(v)
        },

        literalBoolean : function(b) {
            return b ? this.BOOL_TRUE : this.BOOL_FALSE;
        },

        //SQL fragment for SQL::Expression, result depends on the specific type of expression.
        literalExpression :  function(v) {
            return v.toString(this);
        },

        //SQL fragment for Hash, treated as an expression
        literalHash :  function(v) {
            return this.literalExpression(BooleanExpression.fromValuePairs(v));
        },

        //SQL fragment for nil
        literalNull :  function() {
            return this.NULL;
        },

        //SQL fragment for String.  Doubles \ and ' by default.
        literalString :  function(v) {
            return "'" + v.replace(/\\/g, "\\\\\\\\").replace(/'/g, "''") + "'";
        },

        //Modify the sql to add the columns selected
        selectColumnsSql :  function() {
            return " " + this.columnList(this.__opts.select);
        },

        //Modify the sql to add the DISTINCT modifier
        selectDistinctSql :  function() {
            var distinct = this.__opts.distinct, ret = "";
            if (distinct) {
                ret = " DISTINCT";
                if (distinct.length) {
                    ret += string.format(" ON (%s)", this.expressionList(distinct));
                }
            }
            return ret;
        },

        //Modify the sql to add a dataset to the via an EXCEPT, INTERSECT, or UNION clause.
        //This uses a subselect for the compound datasets used, because using parantheses doesn't
        //work on all databases.  I consider this an ugly hack, but can't I think of a better default.
        selectCompoundsSql :  function() {
            var opts = this.__opts, compounds = opts.compounds, ret = "";
            if (compounds) {
                compounds.forEach(function(c) {
                    var type = c[0], dataset = c[1], all = c[2];
                    ret += string.format(" %s%s %s", type.toUpperCase(), all ? " ALL" : "", this.subselectSql(dataset));
                });
            }
            return ret;
        },

        //Modify the sql to add the list of tables to select FROM
        selectFromSql :  function() {
            var from = this.__opts.from;
            return from ? string.format(" FROM%s", this.sourceList(from)) : "";
        },

        deleteFromSql : function() {
            return this.selectFromSql();
        },

        //Modify the sql to add the expressions to GROUP BY
        selectGroupSql :  function() {
            var group = this.__opts.group;
            return group ? string.format(" GROUP BY %s", this.expressionList(group)) : "";
        },


        //Modify the sql to add the filter criteria in the HAVING clause
        selectHavingSql :  function() {
            var having = this.__opts.having;
            return having ? string.format(" HAVING %s", this.literal(having)) : "";
        },

        //Modify the sql to add the list of tables to JOIN to
        selectJoinSql :  function() {
            var join = this.__opts.join, ret = "";
            return join ? join.forEach(function(j) {
                ret += this.literal(j)
            }, this) : "";
        },

        //Modify the sql to limit the number of rows returned and offset
        selectLimitSql :  function() {
            var ret = "", limit = this.__opts.limit, offset = this.__opts.offset;
            limit && (ret += string.format(" LIMIT ", this.literal(limit)));
            offset && (ret += string.format(" OFFSET ", this.literal(offset)));
            return ret;
        },

        //Modify the sql to support the different types of locking modes.
        selectLockSql :  function(sql) {
            var lock = this.__opts.lock, ret = "";
            if (lock) {
                if (lock == "update") {
                    ret += this.FOR_UPDATE;
                } else {
                    ret += " " + lock;
                }
            }
            return ret;
        },

        //Modify the sql to add the expressions to ORDER BY
        selectOrderSql :  function(sql) {
            var order = this.__opts.order;
            return order ? string.format(" ORDER BY %s", this.expressionList(order)) : "";
        },

        deleteOrderSql : function() {
            return this.selectOrderSql();
        },
        updateOrderSql : function() {
            return this.selectOrderSql();
        },


        selectWhereSql : function() {
            var where = this.__opts.where;
            return where ? string.format(" WHERE %s", this.literal(where)) : "";
        },

        deleteWhereSql : function() {
            return this.selectWhereSql();
        },
        updateWhereSql : function() {
            return this.selectWhereSql();
        },

        selectWithSql : function(sql) {
            var wit = this.__opts["with"], ret = "";
            if (wit && wit.length) {
                ret = string.format(" %s %s %s", this.selectWithSqlBase(), wit.map(
                    function(w) {
                        var r = "";
                        r += this.quotedIdentifier(w.name);
                        w.args && (r += this.argumentList(w.args));
                        r += " AS " + this.literalDataset(w.dataset());

                    }, this).join(COMMA_SEPARATOR), sql);
            } else {
                ret = sql;
            }
            return ret;
        },

        //The base keyword to use for the SQL WITH clause
        selectWithSqlBase :  function() {
            return SQL_WITH
        },

        //Converts an array of source names into into a comma separated list.
        sourceList :  function(source) {
            if (!source || !source.length) {
                throw new QueryError("No source specified for the query");
            }
            return " " + source.map(
                function(s) {
                    return this.tableRef(s);
                }, this).join(this.COMMA_SEPARATOR);
        },

        //SQL to use if this dataset uses static SQL.  Since static SQL
        //can be a PlaceholderLiteralString in addition to a String,
        //we literalize nonstrings.
        staticSql :  function(sql) {
            return comb.isString(sql) ? sql : this.literal(sql);

        },

        //SQL fragment for a subselect using the given database's SQL.
        subselectSql :  function(ds) {
            return ds.sql();
        },

        //SQL fragment specifying a table name.
        tableRef :  function(t) {
            return comb.isString(t) ? this.quotedIdentifier(t) : this.literal(t);
        },


        //SQL fragment specifying the tables from with to delete.
        //Includes join table if modifying joins is allowed.
        updateTableSql :  function(sql) {
            var ret = this.sourceList(this.__opts.from);
            if (this.supportsModifyingJoins) {
                ret += this.selectJoinSql();
            }
            return ret;
        },


        //The SQL fragment specifying the columns and values to SET.
        updateSetSql :  function(sql) {
            var values = this.__opts.values, defs = this.__opts.defaults, overrides = this.__opts.overrides;
            var st = "";
            if (comb.isObject(values)) {
                values = comb.merge({}, defs || {}, values);
                values = comb.merge({}, overrides || {}, values);
                var v = [];
                for (var i in values) {
                    v.push(this.quoteIdentifier(i) + " = " + this.literal(values[i]));
                }
                st = v.join(this.COMMA_SEPERATOR);
            } else {
                st = values;
            }
            return " SET " + st;
        }



    }
}).export(module);
