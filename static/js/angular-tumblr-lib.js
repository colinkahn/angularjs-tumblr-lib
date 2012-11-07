var app = angular.module('Tumblr', ['ngResource']).
    config(function($routeProvider){
        $routeProvider.
            when('/page/:page', {template:'/static/partials/tumblr-posts.html', controller:"TumblrPostsCtrl"}).
            when('/post/:id', {template: '/static/partials/tumblr-post-detail.html', controller:"TumblrPostDetailCtrl"}).
            otherwise({redirectTo:'/page/1', template:'partials/tumblr-posts.html', controller:"TumblrPostsCtrl"})
    });

api_key = '3Uj5hvL773MVNlhFJC5gyVftNh4Qxci3hqoPkU3nAzp9bFJ8UB'
base_hostname = 'demo.tumblr.com'

app.run(function($rootScope, $resource) {
    $rootScope.tumblr = $resource('http://api.tumblr.com/v2/blog/:base_hostname/:action',
        {action:'posts', api_key:api_key, base_hostname:base_hostname, callback:'JSON_CALLBACK'},
        {get:{method:'JSONP'}});

    $rootScope.simplifyJSONProperties = function(json) {
        if (json.response.posts) {
            json.response.posts.forEach(function(post){
                post.template = '/static/partials/tumblr-'+post.type+'-post.html'
                if (post.photos) {
                    post.photos.forEach(function(photo){
                        photo.alt_sizes.forEach(function(alt_size){
                            if (alt_size.width == 75) {
                                post.thumbnail = alt_size.url
                            } else {
                                var key = 'photo_url_'+alt_size.width
                                photo[key] = alt_size.url
                            }
                        })
                    })
                }
                if (post.type == 'video' && post.player) {
                    post.player.forEach(function(embed){
                        var key = 'video_embed_'+embed.width
                        post[key] = embed.embed_code
                    })
                }
            })
        }
    }

    $rootScope.like = function(post) {
        var url = 'http://www.tumblr.com/like/'+post.reblog_key+'?id='+post.id
        console.log(url)
    }
});

function TumblrCtrl($scope, $resource, $rootScope) {
    $rootScope.tumblr.get({action:'info'}, function(json){
        $scope.blog = $rootScope.blog = json.response.blog
    })
}

function TumblrPostsCtrl($scope, $resource, $routeParams, $location, $rootScope) {
    $scope.currentPage = $routeParams.page || 1
    $scope.postsPerPage = 5

    $rootScope.tumblr.get({offset:($scope.currentPage-1)*$scope.postsPerPage, limit:$scope.postsPerPage}, function(json){
        $rootScope.simplifyJSONProperties(json)
        $scope.posts = json.response.posts
    });

    $scope.stepPageUrl = function(interval) {
        var page = parseInt($scope.currentPage) + parseInt(interval)
            url = '/page/' + page
        return url
    }

    $scope.firstPage = function() {
        return $scope.currentPage == 1
    }

    $scope.lastPage = function() {
        try {
            return $rootScope.blog.posts < ($scope.currentPage*$scope.postsPerPage)
        } finally {
            return false
        }
    }

    $scope.like = function(post) {
        var url = 'http://www.tumblr.com/like/'+post.reblog_key+'?id='+post.id
        post.liked = true
        jQuery('body').append('<iframe src="'+url+'" style="position:absolute;left:-9999em">')
    }
}

function TumblrPostDetailCtrl($scope, $resource, $routeParams, $location, $rootScope) {
    $scope.id = $routeParams.id

    $rootScope.tumblr.get({id:$scope.id}, function(json){
        $rootScope.simplifyJSONProperties(json)
        $scope.post = json.response.posts[0]
        $scope.post.is_detail = true
    })
}