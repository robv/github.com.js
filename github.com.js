var username = '**';
var apiToken = '**';

// ## Client-side Javascript API wrapper for GitHub
// https://github.com/levidehaan/github-api
// Tries to map one-to-one with the GitHub API V2, but in a Javascripty manner.

(function(globals) {

    // Before we implement the API methods, we will define all of our private
    // variables and helper functions with one `var` statement.
    var

    // The username and authentication token of the library's user.
    authUsername,
    authToken,

    // To save keystrokes when we make JSONP calls to the HTTP API, we will keep
    // track of the root from which all V2 urls extend.
    apiRoot = "https://github.com/api/v2/json/",

    // Send a JSONP request to the Github API that calls `callback` with
    // the `context` argument as `this`.
    //
    // The `url` parameter is concatenated with the apiRoot, for the reasons
    // mentioned above. The way that we are supporting non-global, anonymous
    // functions is by sticking them in the globally exposed
    // `gh.__jsonp_callbacks` object with a "unique" `id` that is the current
    // time in milliseconds. Once the callback is called, it is deleted from the
    // object to prevent memory leaks.
    jsonp = function(url, callback, context) {
        var id = +new Date,
        script = document.createElement("script");

        while (gh.__jsonp_callbacks[id] !== undefined)
        id += Math.random();
        // Avoid slight possibility of id clashes.
        gh.__jsonp_callbacks[id] = function() {
            delete gh.__jsonp_callbacks[id];
            callback.apply(context, arguments);
        };

        var prefix = "?";
        if (url.indexOf("?") >= 0)
        prefix = "&";

        url += prefix + "callback=" + encodeURIComponent("gh.__jsonp_callbacks[" + id + "]");
        if (authUsername && authToken) {
            url += "&login=" + authUsername + "&token=" + authToken;
        }
        script.setAttribute("src", apiRoot + url);

        document.getElementsByTagName('head')[0].appendChild(script);
    },

    jsonp2 = function(url, callback, context) {
        apiRoot2 = 'https://gist.github.com/'
        var id = +new Date,
        script = document.createElement("script");

        while (gh.__jsonp_callbacks[id] !== undefined)
        id += Math.random();
        // Avoid slight possibility of id clashes.
        gh.__jsonp_callbacks[id] = function() {
            delete gh.__jsonp_callbacks[id];
            callback.apply(context, arguments);
        };

        var prefix = "?";
        if (url.indexOf("?") >= 0)
        prefix = "&";

        url += prefix + "callback=" + encodeURIComponent("gh.__jsonp_callbacks[" + id + "]");

        script.setAttribute("src", apiRoot2 + url);
        console.log('jsonp2');
        console.log(script);
        document.getElementsByTagName('head')[0].appendChild(script);
    },

    // Send an HTTP POST. Unfortunately, it isn't possible to support a callback
    // with the resulting data. (Please prove me wrong if you can!)
    //
    // This is implemented with a hack to get around the cross-domain
    // restrictions on ajax calls. Basically, a form is created that will POST
    // to the GitHub API URL, stuck inside an iframe so that it won't redirect
    // this page, and then submitted.
    // THIS FUNCTION NOW DEPENDS ON jQuery
    post = function(url, vals) {
        var key,
        field;

        var iframe = $('<iframe name="githubpull" style="display: none;">').appendTo($("body"));
        var doc = null;
        var values = "";
        doc = window.frames["githubpull"].document;

        console.log(vals);
        if (_.isArray(vals) || !_.isString(vals))
        {
            vals = vals || {};
            for (key in vals) {
                if (vals.hasOwnProperty(key)) {
                    values += "&values[" + key + "]=" + vals[key]
                }
            }
        } else if (_.isString(vals)) {
            values = "&" + vals
        }
        var form = document.createElement("form");
        form.method = "post";
        form.action = apiRoot + url + "?login=" + authUsername + "&token=" + authToken + values;

        console.log(form);
        doc.body.appendChild(form);
        form.submit();
    },

    post2 = function(url, vals) {
        var key,
        field;

        var iframe = $('<iframe name="githubpull" style="display: none;">').appendTo($("body"));
        var doc = null;
        var values = "";
        doc = window.frames["githubpull"].document;

        console.log(vals);
        if (_.isArray(vals) || !_.isString(vals))
        {
            vals = vals || {};
            for (key in vals) {
                if (vals.hasOwnProperty(key)) {
                    values += "&" + key + "=" + vals[key]
                }
            }
        } else if (_.isString(vals)) {
            values = "&" + vals
        }
        var form = document.createElement("form");
        form.method = "post";
        form.action = apiRoot + url + "?login=" + authUsername + "&token=" + authToken + values;

        console.log(form);
        doc.body.appendChild(form);
        form.submit();
    },

    // This helper function will throw a TypeError if the library user is not
    // properly authenticated. Otherwise, it silently returns.
    authRequired = function(username) {
        console.log("authUsername: " + authUsername);
        console.log("authToken: " + authToken)
        if (!authUsername || !authToken || authUsername !== username) {
            throw new TypeError("gh: Must be authenticated to do that.");
        }
    },

    // Convert an object to a url parameter string.
    //
    //     paramify({foo:1, bar:3}) -> "foo=1&bar=3".
    paramify = function(params) {
        var str = "",
        key;
        for (key in params) if (params.hasOwnProperty(key))
        str += key + "=" + params[key] + "&";
        return str.replace(/&$/, "");
    },

    // Get around how the GH team haven't migrated all the API to version 2, and
    // how gists use a different api root.
    withTempApiRoot = function(tempApiRoot, fn) {
        return function() {
            var oldRoot = apiRoot;
            apiRoot = tempApiRoot;
            fn.apply(this, arguments);
            apiRoot = oldRoot;
        };
    },

    // Expose the global `gh` variable, through which every API method is
    // accessed, but keep a local variable around so we can reference it easily.
    gh = globals.gh = {};

    // Psuedo private home for JSONP callbacks (which are required to be global
    // by the nature of JSONP, as discussed earlier).
    gh.__jsonp_callbacks = {};

    // Authenticate as a user. Does not try to validate at any point; that job
    // is up to each individual method, which calls `authRequired` as needed.
    gh.authenticate = function(username, token) {
        authUsername = username;
        authToken = token;
        return this;
    };

    // ### Users
    // The constructor for user objects. Just creating an instance of a user
    // doesn't fetch any data from GitHub, you need to get explicit about what
    // you want to do that.
    //
    //     var huddlej = gh.user("huddlej");
    gh.user = function(username) {
        if (! (this instanceof gh.user)) {
            return new gh.user(username);
        }
        this.username = username;
    };

    // Show basic user info; you can get more info if you are authenticated as
    // this user.
    //
    //    gh.user("fitzgen").show(function (data) {
    //        console.log(data.user);
    //    });
    gh.user.prototype.show = function(callback, context) {
        jsonp("user/show/" + this.username, callback, context);
        return this;
    };

    // Update a user's info. You must be authenticated as this user for this to
    // succeed.
    //
    //     TODO: example
    gh.user.prototype.update = function(params) {
        //authRequired(this.username);
        var key,
        postData = {};
        for (key in params) {
            if (params.hasOwnProperty(key)) {
                postData[key] = encodeURIComponent(params[key]);
            }
        }
        post("user/show/" + this.username, postData);
        return this;
    };

    gh.user.prototype.listKeys = function(callback, context) {
        jsonp("user/keys", callback, context);
        return this;
    }

    // { "title" : "cheese", "key" : "alkj309jv309mz89eur0923m09cvj23=="
    gh.user.prototype.addKey = function(params) {
        var key,
        postData = {};
        for (key in params) {
            if (params.hasOwnProperty(key)) {
                postData[key] = encodeURIComponent(params[key]);
            }
        }
        post("user/key/add" + postData);
        return this;
    }

    // { "id" : "987" }
    gh.user.prototype.removeKey = function(params) {
        var key,
        postData = {};
        for (key in params) {
            if (params.hasOwnProperty(key)) {
                postData[key] = encodeURIComponent(params[key]);
            }
        }
        post("user/key/remove" + postData);
        return this;
    }

    // "email=test@test.com"
    gh.user.prototype.addEmail = function(params) {
        post("user/email/add" + params);
        return this;
    }

    // "email=test@test.com"
    gh.user.prototype.removeEmail = function(params) {
        post("user/email/remove" + params);
        return this;
    }

    gh.user.prototype.listEmail = function(callback, context) {
        jsonp("user/emails", callback, context);
    }

    // Get a list of who this user is following.
    //
    //     TODO: example
    gh.user.prototype.following = function(callback, context) {
        jsonp("user/show/" + this.username + "/following", callback, context);
    };

    // Find out what other users are following this user.
    //
    //     TODO: example
    gh.user.prototype.followers = function(callback, context) {
        jsonp("user/show/" + this.username + "/followers", callback, context);
    };

    // Make this user follow some other user. You must be authenticated as this
    // user for this to succeed.
    //
    //     TODO: example
    gh.user.prototype.follow = function(user) {
        //authRequired.call(this.username);
        post("user/follow/" + user);
        return this;
    };

    // Make this user quit following the given `user`. You must be authenticated
    // as this user to succeed.
    //
    //     TODO: example
    gh.user.prototype.unfollow = function(user) {
        //authRequired.call(this);
        post("user/unfollow/" + user);
        return this;
    };

    // Get a list of repositories that this user is watching.
    //
    //     TODO: example
    gh.user.prototype.watching = function(callback, context) {
        jsonp("repos/watched/" + this.username, callback, context);
        return this;
    };

    // Get a list of this user's repositories.
    //
    //     gh.user("fitzgen").repos(function (data) {
    //         alert(data.repositories.length);
    //     });
    gh.user.prototype.repos = function(callback, context) {
        gh.repo.forUser(this.username, callback, context);
        return this;
    };

    // Get a list of this user's repositories.
    //
    //     gh.user("fitzgen").repos(function (data) {
    //         alert(data.repositories.length);
    //     });
    gh.user.prototype.orgRepos = function(callback, context) {
        gh.repo.orgForUser(this.username, callback, context);
        return this;
    };

    // Make this user fork the repo that lives at
    // http://github.com/user/repo. You must be authenticated as this user for
    // this to succeed.
    //
    //     gh.user("fitzgen").forkRepo("brianleroux", "wtfjs");
    gh.user.prototype.forkRepo = function(user, repo) {
        authRequired(this.username);
        post("repos/fork/" + user + "/" + repo);
        return this;
    };

    // Get a list of all repos that this user can push to (including ones that
    // they are just a collaborator on, and do not own). Must be authenticated
    // as this user.
    gh.user.prototype.pushable = function(callback, context) {
        //authRequired(authUsername);
        jsonp("repos/pushable", callback, context);
    };

    gh.user.prototype.publicGists = withTempApiRoot(
    "http://gist.github.com/api/v1/json/gists/",
    function(callback, context) {
        jsonp(this.username, callback, context);
        return this;
    }
    );

    // Search users for `query`.
    gh.user.search = function(query, callback, context) {
        jsonp("user/search/" + query, callback, context);
        return this;
    };

    // ### Repositories
    // This is the base constructor for creating repo objects. Note that this
    // won't actually hit the GitHub API until you specify what data you want,
    // or what action you wish to take via a prototype method.
    gh.repo = function(user, repo) {
        if (! (this instanceof gh.repo)) {
            return new gh.repo(user, repo);
        }
        this.repo = repo;
        this.user = user;
    };

    // Get basic information on this repo.
    //
    //     gh.repo("schacon", "grit").show(function (data) {
    //         console.log(data.repository.description);
    //     });
    gh.repo.prototype.show = function(callback, context) {
        jsonp("repos/show/" + this.user + "/" + this.repo, callback, context);
        return this;
    };

    // Update the information for this repo. Must be authenticated as the
    // repository owner. Params can include:
    //
    //   * description
    //   * homepage
    //   * has_wiki
    //   * has_issues
    //   * has_downloads
    gh.repo.prototype.update = function(params) {
        authRequired(this.user);
        var key,
        postData = {
            login: authUsername,
            token: authToken
        };
        for (key in params) {
            if (params.hasOwnProperty(key)) {
                postData["values[" + key + "]"] = encodeURIComponent(params[key]);
            }
        }
        post("repos/show/" + this.user + "/" + this.repo, postData);
        return this;
    };

    // Get all tags for this repo.
    gh.repo.prototype.tags = function(callback, context) {
        jsonp("repos/show/" + this.user + "/" + this.repo + "/tags",
        callback,
        context);
        return this;
    };

    // Get all branches in this repo.
    gh.repo.prototype.branches = function(callback, context) {
        jsonp("repos/show/" + this.user + "/" + this.repo + "/branches",
        callback,
        context);
        return this;
    };

    // Gather line count information on the language(s) used in this repo.
    gh.repo.prototype.languages = function(callback, context) {
        jsonp("/repos/show/" + this.user + "/" + this.repo + "/languages",
        callback,
        context);
        return this;
    };

    // Gather data on all the forks of this repo.
    gh.repo.prototype.network = function(callback, context) {
        jsonp("repos/show/" + this.user + "/" + this.repo + "/network",
        callback,
        context);
        return this;
    };

    // All users who have contributed to this repo. Pass `true` to showAnon if you
    // want to see the non-github contributors.
    gh.repo.prototype.contributors = function(callback, context, showAnon) {
        var url = "repos/show/" + this.user + "/" + this.repo + "/contributors";
        if (showAnon)
        url += "/anon";
        jsonp(url,
        callback,
        context);
        return this;
    };

    // Get all of the collaborators for this repo.
    gh.repo.prototype.collaborators = function(callback, context) {
        jsonp("repos/show/" + this.user + "/" + this.repo + "/collaborators",
        callback,
        context);
        return this;
    };

    // Add a collaborator to this project. Must be authenticated.
    gh.repo.prototype.addCollaborator = function(collaborator) {
        authRequired(this.user);
        post("repos/collaborators/" + this.repo + "/add/" + collaborator);
        return this;
    };

    // Remove a collaborator from this project. Must be authenticated.
    gh.repo.prototype.removeCollaborator = function(collaborator) {
        authRequired(this.user);
        post("repos/collaborators/" + this.repo + "/remove/" + collaborator);
        return this;
    };

    // Make this repository private. Authentication required.
    gh.repo.prototype.setPrivate = function() {
        authRequired(this.user);
        post("repo/set/private/" + this.repo);
        return this;
    };

    // Make this repository public. Authentication required.
    gh.repo.prototype.setPublic = function() {
        authRequired(this.user);
        post("repo/set/public/" + this.repo);
        return this;
    };

    // Search for repositories. `opts` may include `start_page` or `language`,
    // which must be capitalized.
    gh.repo.search = function(query, opts, callback, context) {
        var url = "repos/search/" + query.replace(" ", "+");
        if (typeof opts === "function") {
            opts = {};
            callback = arguments[1];
            context = arguments[2];
        }
        url += "?" + paramify(opts);
        jsonp(url, callback, context);
        return this;
    };

    // Get all the repos that are owned by `user`.
    gh.repo.forUser = function(user, callback, context) {
        jsonp("repos/show/" + user, callback, context);
        return this;
    };

    // Get all the repos in organizations that `user` is a part of.
    gh.repo.orgForUser = function(user, callback, context) {
        jsonp("organizations/repositories", callback, context);
        return this;
    };

    // Create a repository. Must be authenticated.
    gh.repo.create = function(name, opts) {
        authRequired(authUsername);
        opts.name = name;
        post("repos/create", opts);
        return this;
    };

    // Delete a repository. Must be authenticated.
    gh.repo.del = function(name) {
        authRequired(authUsername);
        post("repos/delete/" + name);
        return this;
    };

    // ### Commits
    gh.commit = function(user, repo, sha) {
        if (! (this instanceof gh.commit))
        return new gh.commit(user, repo, sha);
        this.user = user;
        this.repo = repo;
        this.sha = sha;
    };

    gh.commit.prototype.show = function(callback, context) {
        jsonp("commits/show/" + this.user + "/" + this.repo + "/" + this.sha,
        callback,
        context);
        return this;
    };

    // Get a list of all commits on a repos branch.
    gh.commit.forBranch = function(user, repo, branch, callback, context) {
        jsonp("commits/list/" + user + "/" + repo + "/" + branch,
        callback,
        context);
        return this;
    };

    // Get a list of all commits on this path (file or dir).
    gh.commit.forPath = function(user, repo, branch, path, callback, context) {
        jsonp("commits/list/" + user + "/" + repo + "/" + branch + "/" + path,
        callback,
        context);
        return this;
    };

    // ### Issues
    gh.issue = function(user, repo, number) {
        if (! (this instanceof gh.issue))
        return new gh.commit(user, repo, number);
        this.user = user;
        this.repo = repo;
        this.number = number;
    };

    // View this issue's info.
    gh.issue.prototype.show = function(callback, context) {
        jsonp("issues/show/" + this.user + "/" + this.repo + "/" + this.number,
        callback,
        context);
        return this;
    };

    // Get a list of all comments on this issue.
    gh.issue.prototype.comments = function(callback, context) {
        jsonp("issues/comments/" + this.user + "/" + this.repo + "/" + this.number,
        callback,
        context);
        return this;
    };

    // Close this issue.
    gh.issue.prototype.close = function() {
        authRequired(this.user);
        post("issues/close/" + this.user + "/" + this.repo + "/" + this.number);
        return this;
    };

    // Reopen this issue.
    gh.issue.prototype.reopen = function() {
        authRequired(this.user);
        post("issues/reopen/" + this.user + "/" + this.repo + "/" + this.number);
        return this;
    };

    // Reopen this issue.
    gh.issue.prototype.update = function(title, body) {
        authRequired(this.user);
        post("issues/edit/" + this.user + "/" + this.repo + "/" + this.number, {
            title: title,
            body: body
        });
        return this;
    };

    // Add `label` to this issue. If the label is not yet in the system, it will
    // be created.
    gh.issue.prototype.addLabel = function(label) {
        post("issues/label/add/" + this.user + "/" + this.repo + "/" + label + "/" + this.number);
        return this;
    };

    // Remove a label from this issue.
    gh.issue.prototype.removeLabel = function(label) {
        post("issues/label/remove/" + this.user + "/" + this.repo + "/" + label + "/" + this.number);
        return this;
    };

    // Comment on this issue as the user that is authenticated.
    gh.issue.prototype.comment = function(comment) {
        authRequired(authUsername);
        post2("issues/comment/" + this.user + "/" + this.repo + "/" + this.number, {
            comment: comment
        });
        return this;
    };

    // Get all issues' labels for the repo.
    gh.issue.prototype.labels = function(user, repo, callback, context) {
        jsonp("issues/labels/" + user + "/" + repo,
        callback,
        context);
        return this;
    };

    // Open an issue. Must be authenticated.
    gh.issue.open = function(repo, title, body) {
        console.log(repo);
        console.log(title);
        console.log(body);
        authRequired(authUsername);
        post2("issues/open/" + authUsername + "/" + repo, {
            title: title,
            body: body
        });
        return this;
    };

    // Search a repository's issue tracker. `state` can be "open" or "closed".
    gh.issue.search = function(user, repo, state, query, callback, context) {
        jsonp("/issues/search/" + user + "/" + repo + "/" + state + "/" + query,
        callback,
        context);
        return this;
    };

    // Get a list of issues for the given repo. `state` can be "open" or
    // "closed".
    gh.issue.list = function(user, repo, state, callback, context) {
        jsonp("issues/list/" + user + "/" + repo + "/" + state,
        callback,
        context);
        return this;
    };

    // ### Gists
    gh.gist = function(id) {
        if (! (this instanceof gh.gist)) {
            return new gh.gist(id);
        }
        this.id = id;
    };

    gh.gist.prototype.show = function(callback, context) {
        jsonp2("api/v1/json/" + this.id, callback, context);
        return this;
    };

    gh.gist.prototype.file = function(filename, callback, context) {
        jsonp2("raw/" + this.id + "/" + filename, callback, context);
        return this;
    };

    // ### Objects
    gh.object = function(user, repo) {
        if (! (this instanceof gh.object)) {
            return new gh.object(user, repo);
        }
        this.user = user;
        this.repo = repo;
    };

    // Get the contents of a tree by tree SHA
    gh.object.prototype.tree = function(sha, callback, context) {
        jsonp("tree/show/" + this.user + "/" + this.repo + "/" + sha,
        callback,
        context);
        return this;
    };

    // Get the data about a blob by tree SHA and path
    gh.object.prototype.blob = function(path, sha, callback, context) {
        jsonp("blob/show/" + this.user + "/" + this.repo + "/" + sha + "/" + path,
        callback,
        context);
        return this;
    };

    // Get only blob meta
    gh.object.prototype.blobMeta = function(path, sha, callback, context) {
        jsonp("blob/show/" + this.user + "/" + this.repo + "/" + sha + "/" + path + "?meta=1",
        callback,
        context);
        return this;
    };

    // Get list of blobs
    gh.object.prototype.blobAll = function(branch, callback, context) {
        jsonp("blob/all/" + this.user + "/" + this.repo + "/" + branch,
        callback,
        context);
        return this;
    };

    // Get meta of each blob in tree
    gh.object.prototype.blobFull = function(sha, callback, context) {
        jsonp("blob/full/" + this.user + "/" + this.repo + "/" + sha,
        callback,
        context);
        return this;
    };

    // ### Network
    gh.network = function(user, repo) {
        if (! (this instanceof gh.network)) {
            return new gh.network(user, repo);
        }
        this.user = user;
        this.repo = repo;
    };

    gh.network.prototype.data = withTempApiRoot(
    "http://github.com/",
    function(nethash, start, end, callback, context) {
        jsonp(this.user + "/" + this.repo + "/network_data_chunk?"
        + nethash + "&" + start + "&" + end,
        callback,
        context);
        return this;
    }
    );

    gh.network.prototype.meta = withTempApiRoot(
    "http://github.com/",
    function(callback, context) {
        jsonp(this.user + "/" + this.repo + "/network_meta",
        callback,
        context);
        return this;
    }
    );

} (window));

// END GITHUB API WRAPPER


$('.usernav').prepend('<li><a href="#" id="projects_dd">Projects<div id="projects_container" style="display:none;"><div id="projects_inner"></div></div></a></li>');

$('body').prepend('<div id="projects_dd_css" />');
$('#projects_dd_css').load('https://gist.github.com/raw/891722/7aea81eb6c0ae3dfc82354362a957f7e1b236235/projects_dropdown.css');

$('#projects_dd').bind('mouseenter', function() {
  $('#projects_container').show();
}).bind('mouseleave', function() {
  $('#projects_container').hide();
});

$('#projects_inner').prepend('<div id="my_column" class="col"><h2>Personal</h2><ul id="my_project_list" /></div>');
$('#projects_inner').prepend('<div id="work_column" class="col"><h2>Work</h2><ul id="org_project_list" /></div>');

gh.authenticate(username, apiToken);

// ME
var me = gh.user(username);
me.repos(function (data) {
    for (var key in data.repositories) {
      $('#my_project_list').prepend('<li><a href="' + data.repositories[key].url + '">' + data.repositories[key].name + '</a></li>')
    }
});

// WORK
me.orgRepos(function (data) {
    for (var key in data.repositories) {
      $('#org_project_list').prepend('<li><a href="' + data.repositories[key].url + '">' + data.repositories[key].name + '</a></li>')
    }
});