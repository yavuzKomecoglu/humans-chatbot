//graphql humans endpoint
var humansEndPoint = 'https://api.graph.cool/simple/v1/cj0jnmqnnfm7a0133p9uuxhy1'

var fetch = require('graphql-fetch')(humansEndPoint)


//humans functions
exports.getAllTags = function(callback) {
    var query = '{\
                    allTags {\
                        name,\
                        id\
                    }\
                }'
    var queryVars = {
        // queryVars
    }

    var opts = {
        // custom fetch options
    }

    fetch(query, queryVars, opts).then(function (results) {
        if (results.errors) {
            console.log(results.errors);
        }
        callback(results.data.allTags);
        //console.log(results.data.allTags);
        //...
    });
}

//test: TagID = "cj2q2at1jh6ju0105w1ixc2b9"
exports.getHumansByTagID = function(tagID, pageSize, callback) {
    var query = 'query ($id: ID, $page_size: Int) {\
      Tag(id: $id) {\
        id\
        name\
        humans(filter: {private:false}, orderBy:createdAt_DESC, first:10, skip:$page_size){\
        id\
          name\
          title\
          username\
          videoId\
        }\
      }\
    }'
    var queryVars = {
        // queryVars
        id: tagID,
        page_size: pageSize
    }

    var opts = {
        // custom fetch options
    }

    fetch(query, queryVars, opts).then(function (results) {
        if (results.errors) {
            console.log(results.errors);
        }

        callback(results.data.Tag.humans);
        //console.log(results.data.Tag.humans);
        //...
    });

}

exports.getHumansByTagID_TotalCount = function (tagID, callback) {

    var query = 'query ($id: ID) {\
        Tag (id: $id){\
          id,\
          name,\
          humans(filter: {private:false}){\
            id,\
            name,\
            title,\
            username,\
            videoId\
          }\
        }\
    }'
    var queryVars = {
        // queryVars
        id: tagID
    }

    var opts = {
        // custom fetch options
    }

    fetch(query, queryVars, opts).then(function (results) {
        if (results.errors) {
            console.log(results.errors);
        }
        callback(results.data.Tag.humans.length);
        //console.log(results.data.Tag.humans);
        //...
    });

}

exports.getAccountsByHumanID = function(humanID, pageSize, callback) {

    var query = 'query ($id: ID, $page_size: Int) {\
                    Human(id: $id) {\
                        id\
                        name\
                        username\
                        accounts(orderBy: id_ASC, first: 3, skip: $page_size) {\
                        username\
                        website {\
                            url\
                            name\
                        }\
                        }\
                    }\
                }'
    var queryVars = {
        // queryVars
        id: humanID,
        page_size: pageSize
    }

    var opts = {
        // custom fetch options
    }

    fetch(query, queryVars, opts).then(function (results) {
        if (results.errors) {
            console.log(results.errors);
        }
        callback(results.data.Human);
        //console.log(results.data.Tag.humans);
        //...
    });

}

//test: HumanID = "cj2ucfcyqj7sp010353dywtz8"
exports.getAccountsByHumanID_TotalCount = function(humanID, callback) {
    var query = 'query ($id: ID) {\
            Human(id: $id) {\
                id\
                name\
                username\
                accounts {\
                username\
                website {\
                    url\
                    name\
                }\
                }\
            }\
        }'
    var queryVars = {
        // queryVars
        id: humanID
    }

    var opts = {
        // custom fetch options
    }

    fetch(query, queryVars, opts).then(function (results) {
        if (results.errors) {
            console.log(results.errors);
        }
        callback(results.data.Human.accounts.length);
        //console.log(results.data.Tag.humans);
        //...
    });

}

exports.getHumansByName = function(humanSearchName, callback) {
    var query = 'query ($name: String) {\
            allHumans(filter: {OR: [{name_contains: $name}, {title_contains: $name}]}, orderBy: name_ASC) {\
                id\
                name\
                username\
                title\
                videoId\
            }\
        }'
    var queryVars = {
        // queryVars
        name: humanSearchName,
    }

    var opts = {
        // custom fetch options
    }

    fetch(query, queryVars, opts).then(function (results) {
        if (results.errors) {
            console.log(results.errors);
        }

        callback(results.data.allHumans);
        //console.log(results.data.Tag.humans);
        //...
    });

}