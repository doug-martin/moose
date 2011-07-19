var vows = require('vows'),
    assert = require('assert'),
    Dataset = require("../../lib/dataset"),
    SQL = require("../../lib/sql"),
    sql = SQL.sql,
    Identifier = sql.Identifier,
    SQLFunction = sql.SQLFunction,
    LiteralString = SQL.LiteralString,
    comb = require("comb");


var ret = (module.exports = exports = new comb.Promise());
var suite = vows.describe("Dataset queries");

suite.addBatch({
    "a simple datatset " : {

        topic : function() {
            return new Dataset().from("test");
        },

        "should format a select statement " : function(ds) {
            assert.equal(ds.selectSql(), "SELECT * FROM test");
        },

        "should format a delete statement" : function(ds) {
            assert.equal(ds.deleteSql(), 'DELETE FROM test');
        },
        "should format a truncate statement" : function(ds) {
            assert.equal(ds.truncateSql(), 'TRUNCATE TABLE test');
        },
        "should format an insert statement with default values" : function(ds) {
            assert.equal(ds.insertSql(), 'INSERT INTO test DEFAULT VALUES');
        },
        "should format an insert statement with hash" : function(ds) {
            assert.equal(ds.insertSql({name : 'wxyz', price : 342}), "INSERT INTO test (name, price) VALUES ('wxyz', 342)");
            assert.equal(ds.insertSql({}), "INSERT INTO test DEFAULT VALUES");
        },

        "should format an insert statement with an object that has a values property" : function(ds) {
            var v = {values : {a : 1}};
            assert.equal(ds.insertSql(v), "INSERT INTO test (a) VALUES (1)");
            assert.equal(ds.insertSql({}), "INSERT INTO test DEFAULT VALUES");
        },

        "should format an insert statement with an arbitrary value" : function(ds) {
            assert.equal(ds.insertSql(123), "INSERT INTO test VALUES (123)");
        },

        "should format an insert statement with sub-query" : function(ds) {
            var sub = new Dataset().from("something").filter({x : 2});
            assert.equal(ds.insertSql(sub), "INSERT INTO test SELECT * FROM something WHERE (x = 2)");

        },

        "should format an insert statement with array" : function(ds) {
            assert.equal(ds.insertSql('a', 2, 6.5), "INSERT INTO test VALUES ('a', 2, 6.5)");
        },

        "should format an update statement" : function(ds) {
            assert.equal(ds.updateSql({name : 'abc'}), "UPDATE test SET name = 'abc'");
        }
    },

    "A dataset with multiple tables in its FROM clause" : {
        topic : function() {
            return new Dataset().from("t1", "t2");
        },

        "should raise on //updateSql" : function(ds) {
            assert.throws(comb.hitch(ds, ds.updateSql, {a : 1}));
        },

        "should raise on //deleteSql" : function(ds) {
            assert.throws(comb.hitch(ds, ds.deleteSql));
        },

        "should raise on //truncateSql" : function(ds) {
            assert.throws(comb.hitch(ds, ds.truncateSql));
        },

        "should raise on //insertSql" : function(ds) {
            assert.throws(comb.hitch(ds, ds.insertSql));
        },

        "should generate a select query FROM all specified tables" : function(ds) {
            assert.equal(ds.selectSql(), "SELECT * FROM t1, t2");
        }
    },

    "Dataset.unusedTableAlias " : {

        topic : function() {
            return new Dataset().from("test");
        },

        "should return given symbol if it hasn't already been used" : function(ds) {
            assert.equal(ds.unusedTableAlias("blah"), "blah")
        },

        "should return a symbol specifying an alias that hasn't already been used if it has already been used" : function(ds) {
            assert.equal(ds.unusedTableAlias("test"), "test_0");
            assert.equal(ds.from("test", "test_0").unusedTableAlias("test"), "test_1");
            assert.equal(ds.from("test", "test_0").crossJoin("test_1").unusedTableAlias("test"), "test_2");
        },

        "should return an appropriate symbol if given other forms of identifiers" : function(ds) {
            ds.mergeOptions({from : null});
            ds.from("test");
            assert.equal(ds.unusedTableAlias('test'), "test_0");
            assert.equal(ds.unusedTableAlias("b__t___test"), "test_0");
            assert.equal(ds.unusedTableAlias("b__test"), "test_0");
            assert.equal(ds.unusedTableAlias(new Identifier("test").qualify("b")), "test_0");
            assert.equal(ds.unusedTableAlias(new Identifier("b").as(new Identifier("test"))), "test_0");
            assert.equal(ds.unusedTableAlias(new Identifier("b").as("test")), "test_0");
            assert.equal(ds.unusedTableAlias(new Identifier("test")), "test_0");
        }
    },

    "Dataset.exists" : {
        topic : function() {
            var ds1 = new Dataset().from("test");
            return {
                ds1 : ds1,
                ds2 : ds1.filter({price : {lt :100}}),
                ds3 : ds1.filter({price : {gt :50}})
            };
        },

        "should work in filters"  : function(ds) {
            assert.equal(ds.ds1.filter(ds.ds2.exists()).sql(), 'SELECT * FROM test WHERE (EXISTS (SELECT * FROM test WHERE (price < 100)))');
            assert.equal(ds.ds1.filter(ds.ds2.exists().and(ds.ds3.exists())).sql(), 'SELECT * FROM test WHERE (EXISTS (SELECT * FROM test WHERE (price < 100)) AND EXISTS (SELECT * FROM test WHERE (price > 50)))');
        },

        "should work in select" : function(ds) {
            assert.equal(ds.ds1.select(ds.ds2.exists().as("a"), ds.ds3.exists().as("b")).sql(), 'SELECT EXISTS (SELECT * FROM test WHERE (price < 100)) AS a, EXISTS (SELECT * FROM test WHERE (price > 50)) AS b FROM test');
        }
    },

    "Dataset.where"  : {
        topic : function() {
            var dataset = new Dataset().from("test");
            return {
                dataset : dataset,
                d1 : dataset.where({region : "Asia"}),
                d2 : dataset.where("region = ?", "Asia"),
                d3 : dataset.where("a = 1")
            }
        },

        "should just clone if given an empty argument" : function(ds) {
            assert.equal(ds.dataset.where({}).sql(), ds.dataset.sql());
            assert.equal(ds.dataset.where([]).sql(), ds.dataset.sql());
            assert.equal(ds.dataset.where("").sql(), ds.dataset.sql());

            assert.equal(ds.dataset.filter({}).sql(), ds.dataset.sql());
            assert.equal(ds.dataset.filter([]).sql(), ds.dataset.sql());
            assert.equal(ds.dataset.filter("").sql(), ds.dataset.sql());

        },

        "should work with hashes" : function(ds) {
            assert.equal(ds.dataset.where({name : 'xyz', price : 342}).selectSql(), "SELECT * FROM test WHERE ((name = 'xyz') AND (price = 342))");
        },

        "should work with a string with placeholders and arguments for those placeholders" : function(ds) {
            assert.equal(ds.dataset.where('price < ? AND id in ?', 100, [1, 2, 3]).selectSql(), "SELECT * FROM test WHERE (price < 100 AND id in (1, 2, 3))");
        },

        "should not modify passed array with placeholders" : function(ds) {
            var a = ['price < ? AND id in ?', 100, 1, 2, 3]
            var b = a.slice(0);
            ds.dataset.where(a);
            assert.deepEqual(b, a);
        },

        "should work with strings (custom SQL expressions)" : function(ds) {
            assert.equal(ds.dataset.where('(a = 1 AND b = 2)').selectSql(), "SELECT * FROM test WHERE ((a = 1 AND b = 2))");
        },

        "should work with a string with named placeholders and a hash of placeholder value arguments" : function(ds) {
            assert.equal(ds.dataset.where('price < {price} AND id in {ids}', {price : 100, ids : [1, 2, 3]}).selectSql(), "SELECT * FROM test WHERE (price < 100 AND id in (1, 2, 3))")
        },

        "should not modify passed array with named placeholders" : function(ds) {
            var a = ['price < {price} AND id in {ids}', {price : 100}];
            var b = a.slice(0);
            ds.dataset.where(a)
            assert.deepEqual(b, a);
        },

        "should not replace named placeholders that don't existin in the hash" : function(ds) {
            assert.equal(ds.dataset.where('price < {price} AND id in {ids}', {price : 100}).selectSql(), "SELECT * FROM test WHERE (price < 100 AND id in {ids})")
        },

        "should handle partial names" : function(ds) {
            assert.equal(ds.dataset.where('price < {price} AND id = {p}', {p : 2, price : 100}).selectSql(), "SELECT * FROM test WHERE (price < 100 AND id = 2)");
        },

        "should affect select, delete and update statements" : function(ds) {
            assert.equal(ds.d1.selectSql(), "SELECT * FROM test WHERE (region = 'Asia')");
            assert.equal(ds.d1.deleteSql(), "DELETE FROM test WHERE (region = 'Asia')");
            assert.equal(ds.d1.updateSql({GDP : 0}), "UPDATE test SET GDP = 0 WHERE (region = 'Asia')");

            assert.equal(ds.d2.selectSql(), "SELECT * FROM test WHERE (region = 'Asia')");
            assert.equal(ds.d2.deleteSql(), "DELETE FROM test WHERE (region = 'Asia')");
            assert.equal(ds.d2.updateSql({GDP : 0}), "UPDATE test SET GDP = 0 WHERE (region = 'Asia')");

            assert.equal(ds.d3.selectSql(), "SELECT * FROM test WHERE (a = 1)");
            assert.equal(ds.d3.deleteSql(), "DELETE FROM test WHERE (a = 1)");
            assert.equal(ds.d3.updateSql({GDP : 0}), "UPDATE test SET GDP = 0 WHERE (a = 1)");

        },

        "should be composable using AND operator (for scoping)" : function(ds) {
            // hashes are merged, no problem
            assert.equal(ds.d1.where({size : 'big'}).selectSql(), "SELECT * FROM test WHERE ((region = 'Asia') AND (size = 'big'))");

            // hash and string
            assert.equal(ds.d1.where('population > 1000').selectSql(), "SELECT * FROM test WHERE ((region = 'Asia') AND (population > 1000))");
            assert.equal(ds.d1.where('(a > 1) OR (b < 2)').selectSql(), "SELECT * FROM test WHERE ((region = 'Asia') AND ((a > 1) OR (b < 2)))");

            // hash and array
            assert.equal(ds.d1.where('GDP > ?', 1000).selectSql(), "SELECT * FROM test WHERE ((region = 'Asia') AND (GDP > 1000))");

            // array and array
            assert.equal(ds.d2.where('GDP > ?', 1000).selectSql(), "SELECT * FROM test WHERE ((region = 'Asia') AND (GDP > 1000))");

            // array and hash
            assert.equal(ds.d2.where({name : ['Japan', 'China']}).selectSql(), "SELECT * FROM test WHERE ((region = 'Asia') AND (name IN ('Japan', 'China')))");

            // array and string
            assert.equal(ds.d2.where('GDP > ?').selectSql(), "SELECT * FROM test WHERE ((region = 'Asia') AND (GDP > ?))");

            // string and string
            assert.equal(ds.d3.where('b = 2').selectSql(), "SELECT * FROM test WHERE ((a = 1) AND (b = 2))");

            // string and hash
            assert.equal(ds.d3.where({c : 3}).selectSql(), "SELECT * FROM test WHERE ((a = 1) AND (c = 3))");

            // string and array
            assert.equal(ds.d3.where('d = ?', 4).selectSql(), "SELECT * FROM test WHERE ((a = 1) AND (d = 4))");

            assert.equal(ds.d3.where({e : {lt : 5}}).selectSql(), "SELECT * FROM test WHERE ((a = 1) AND (e < 5))");
        },

        "should accept ranges" : function(ds) {
            assert.equal(ds.dataset.filter({id : {between : [4,7]}}).sql(), 'SELECT * FROM test WHERE ((id >= 4) AND (id <= 7))');
            assert.equal(ds.dataset.filter({table__id : {between : [4, 7]}}).sql(), 'SELECT * FROM test WHERE ((table.id >= 4) AND (table.id <= 7))');
        },

        "should accept nil" : function(ds) {
            assert.equal(ds.dataset.filter({owner_id : null}).sql(), 'SELECT * FROM test WHERE (owner_id IS NULL)');
        },

        "should accept a subquery" : function(ds) {
            assert.equal(ds.dataset.filter('gdp > ?', ds.d1.select(new SQLFunction("avg", "gdp"))).sql(), "SELECT * FROM test WHERE (gdp > (SELECT avg(gdp) FROM test WHERE (region = 'Asia')))");
        },

        "should handle all types of IN/NOT IN queries" : function(ds) {
            assert.equal(ds.dataset.filter({id : ds.d1.select("id")}).sql(), "SELECT * FROM test WHERE (id IN (SELECT id FROM test WHERE (region = 'Asia')))");
            assert.equal(ds.dataset.filter({id : []}).sql(), "SELECT * FROM test WHERE (id != id)");
            assert.equal(ds.dataset.filter({id : [1, 2]}).sql(), "SELECT * FROM test WHERE (id IN (1, 2))");
            assert.equal(ds.dataset.filter({"id1,id2" : ds.d1.select("id1", "id2")}).sql(), "SELECT * FROM test WHERE ((id1, id2) IN (SELECT id1, id2 FROM test WHERE (region = 'Asia')))");
            assert.equal(ds.dataset.filter({"id1,id2" : []}).sql(), "SELECT * FROM test WHERE ((id1 != id1) AND (id2 != id2))");
            assert.equal(ds.dataset.filter({"id1,id2" : [
                [1, 2],
                [3,4]
            ]}).sql(), "SELECT * FROM test WHERE ((id1, id2) IN ((1, 2), (3, 4)))");

            assert.equal(ds.dataset.exclude({id : ds.d1.select("id")}).sql(), "SELECT * FROM test WHERE (id NOT IN (SELECT id FROM test WHERE (region = 'Asia')))");
            //assert.equal(ds.dataset.exclude({id : []}).sql(), "SELECT * FROM test WHERE (1 = 1)");
            assert.equal(ds.dataset.exclude({id : [1, 2]}).sql(), "SELECT * FROM test WHERE (id NOT IN (1, 2))");
            assert.equal(ds.dataset.exclude({"id1,id2" : ds.d1.select("id1", "id2")}).sql(), "SELECT * FROM test WHERE ((id1, id2) NOT IN (SELECT id1, id2 FROM test WHERE (region = 'Asia')))");
            assert.equal(ds.dataset.exclude({"id1,id2" : []}).sql(), "SELECT * FROM test WHERE (1 = 1)");
            assert.equal(ds.dataset.exclude({"id1,id2" : [
                [1, 2],
                [3,4]
            ]}).sql(), "SELECT * FROM test WHERE ((id1, id2) NOT IN ((1, 2), (3, 4)))");
        },

        "should accept a subquery for an EXISTS clause" : function(ds) {
            var a = ds.dataset.filter({price  : {lt : 100}});
            assert.equal(ds.dataset.filter(a.exists()).sql(), 'SELECT * FROM test WHERE (EXISTS (SELECT * FROM test WHERE (price < 100)))');
        },

        "should accept proc expressions" : function(ds) {
            d = ds.d1.select(new SQLFunction("avg", "gdp"));

            assert.equal(ds.dataset.filter({gdp : {gt : d}}).sql(), "SELECT * FROM test WHERE (gdp > (SELECT avg(gdp) FROM test WHERE (region = 'Asia')))");
            assert.equal(ds.dataset.filter({a : {lt : 1}}).sql(), 'SELECT * FROM test WHERE (a < 1)');

            assert.equal(ds.dataset.filter({a : {gte : 1}, b : {lte : 2}}).sql(), 'SELECT * FROM test WHERE ((a >= 1) AND (b <= 2))');

            assert.equal(ds.dataset.filter({c : {like : 'ABC%'}}).sql(), "SELECT * FROM test WHERE (c LIKE 'ABC%')");

            assert.equal(ds.dataset.filter({c : {like : ['ABC%', '%XYZ']}}).sql(), "SELECT * FROM test WHERE ((c LIKE 'ABC%') OR (c LIKE '%XYZ'))");
        },

        "should work for grouped datasets" : function(ds) {
            assert.equal(ds.dataset.group("a").filter({b : 1}).sql(), 'SELECT * FROM test WHERE (b = 1) GROUP BY a');
        },

        "should accept true and false as arguments" : function(ds) {
            assert.equal(ds.dataset.filter(true).sql(), "SELECT * FROM test WHERE 't'");
            assert.equal(ds.dataset.filter(false).sql(), "SELECT * FROM test WHERE 'f'");
        },

        "should allow the use of multiple arguments" : function(ds) {
            assert.equal(ds.dataset.filter(new Identifier("a"), new Identifier("b")).sql(), 'SELECT * FROM test WHERE (a AND b)');
            assert.equal(ds.dataset.filter(new Identifier("a"), {b : 1}).sql(), 'SELECT * FROM test WHERE (a AND (b = 1))');
            assert.equal(ds.dataset.filter(new Identifier("a"), {c : {gt : 3}}, {b: 1}).sql(), 'SELECT * FROM test WHERE (a AND (c > 3) AND (b = 1))');
        },


        "should raise an error if an invalid argument is used" : function(ds) {
            assert.throws(comb.hitch(ds.dataset, "filter", 1));
        }
    },

    "Dataset.or" : {
        topic : function() {
            var dataset = new Dataset().from("test");
            return {
                dataset : dataset,
                d1 : dataset.where({x : 1})
            }
        },

        "should raise if no filter exists" : function(ds) {
            var dataset = ds.dataset;
            assert.throws(comb.hitch(dataset, "or", {a : 1}));
        },

        "should add an alternative expression to the where clause" : function(ds) {
            assert.equal(ds.d1.or({y : 2}).sql(), "SELECT * FROM test WHERE ((x = 1) OR (y = 2))");
        },

        "should accept all forms of filters"  : function(ds) {
            assert.equal(ds.d1.or("y > ?", 2).sql(), 'SELECT * FROM test WHERE ((x = 1) OR (y > 2))');
            assert.equal(ds.d1.or({yy : {gt : 3}}).sql(), 'SELECT * FROM test WHERE ((x = 1) OR (yy > 3))');
        },

        "should correctly add parens to give predictable results" : function(ds) {
            assert.equal(ds.d1.filter({y : 2}).or({z : 3}).sql(), 'SELECT * FROM test WHERE (((x = 1) AND (y = 2)) OR (z = 3))');
            assert.equal(ds.d1.or({y : 2}).filter({z : 3}).sql(), 'SELECT * FROM test WHERE (((x = 1) OR (y = 2)) AND (z = 3))');
        }

    },

    "Dataset.and" : {
        topic : function() {
            var dataset = new Dataset().from("test");
            return {
                dataset : dataset,
                d1 : dataset.where({x : 1})
            }
        },

        "should raise if no filter exists" : function(ds) {
            var dataset = ds.dataset;
            assert.throws(comb.hitch(dataset, "and", {a : 1}));
        },

        "should add an alternative expression to the where clause" : function(ds) {
            assert.equal(ds.d1.and({y : 2}).sql(), "SELECT * FROM test WHERE ((x = 1) AND (y = 2))");
        },

        "should accept all forms of filters"  : function(ds) {
            assert.equal(ds.d1.and("y > ?", 2).sql(), 'SELECT * FROM test WHERE ((x = 1) AND (y > 2))');
            assert.equal(ds.d1.and({yy : {gt : 3}}).sql(), 'SELECT * FROM test WHERE ((x = 1) AND (yy > 3))');
        },

        "should correctly add parens to give predictable results" : function(ds) {
            assert.equal(ds.d1.and({y : 2}).or({z : 3}).sql(), 'SELECT * FROM test WHERE (((x = 1) AND (y = 2)) OR (z = 3))');
            assert.equal(ds.d1.or({y : 2}).and({z : 3}).sql(), 'SELECT * FROM test WHERE (((x = 1) OR (y = 2)) AND (z = 3))');
        }

    },
    
    "dataset.exclude" : {
         topic : new Dataset().from(test),

  "should correctly negate the expression when one condition is given" : function(ds){
    assert.equal(ds.exclude({region : 'Asia'}).selectSql(),"SELECT * FROM test WHERE (region != 'Asia')");
  },

  "should take multiple conditions as a hash and express the logic correctly in SQL" : function(ds){
    assert.equal(ds.exclude({region : 'Asia', name : 'Japan'}).selectSql(), "SELECT * FROM test WHERE (region != 'Asia') or (name != 'Japan')";
},

  "should parenthesize a single string condition correctly" : function(ds){
    assert.equal(ds.exclude("region = 'Asia' AND name = 'Japan'").selectSql(), "SELECT * FROM test WHERE NOT (region = 'Asia' AND name = 'Japan')")
},

  "should parenthesize an array condition correctly" : function(ds){
    assert.equal(ds.exclude('region = ? AND name = ?', 'Asia', 'Japan').selectSql(), "SELECT * FROM test WHERE NOT (region = 'Asia' AND name = 'Japan')");
},

  "should correctly parenthesize when it is used twice" : function(ds){
    assert.equal(ds.exclude({region : 'Asia'}).exclude({name : 'Japan'}).selectSql, "SELECT * FROM test WHERE ((region != 'Asia') AND (name != 'Japan'))");
},
  
  "should support proc expressions" : function(ds){
    ds.exclude({id : {lt : 6}}).sql.should ==
      'SELECT * FROM test WHERE (id >= 6)'
},
  
  "should allow the use of blocks and arguments simultaneously" : function(ds){
    ds.exclude(:id => (7..11)){:id.sql_number < 6}.sql.should == 
      'SELECT * FROM test WHERE ((id < 7) OR (id > 11) OR (id >= 6))'
    ds.exclude([:id, 1], [:x, 3]){:id.sql_number < 6}.sql.should == 
      'SELECT * FROM test WHERE ((id != 1) OR (x != 3) OR (id >= 6))'
}
    }
});

suite.run({reporter : require("vows/reporters/spec")}, function() {
    //helper.dropModels().then(comb.hitch(ret, "callback"), comb.hitch(ret, "errback"))
});
