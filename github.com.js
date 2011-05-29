var username = '**';
var apiToken = '**';

$('.usernav').prepend('<li id="projects_dd"><a href="#">Repositories</a><div id="projects_container" style="display:none;"><div id="projects_inner"></div></div></li>');

$('body').append("<style type=\"text/css\">\n .clearfix:after\n {\n clear: both;\n content: '.';\n display: block;\n visibility: hidden;\n height: 0;\n }\n\n .clearfix\n {\n display: inline-block;\n }\n\n * html .clearfix\n {\n height: 1%;\n }\n\n .clearfix\n {\n display: block;\n }\n #projects_container {\n   position: absolute;\n }\n #projects_container ul li a {\n   display: block;\n   padding: 5px 0;\n }\n \n \n #projects_container {\n  margin-top: -5px;\n  padding-top: 20px;\n  position:absolute;\n  width: 300px;\n }\n \n #projects_inner {\n  position:absolute;\n  z-index:9999;\n  background-color:#eee;\n  -webkit-border-radius: 0 0 5px 5px;\n  -moz-border-radius: 0 0 5px 5px;\n  border-radius: 0 0 5px 5px;\n  -moz-box-shadow: 0 1px 3px #aaa;\n  -webkit-box-shadow: 0 1px 3px #aaa;\n  box-shadow: 0 1px 3px #ccc;\n  border: 1px solid #ddd;\n filter:progid:DXImageTransform.Microsoft.gradient(GradientType=0,startColorstr='#FCFCFC',endColorstr='#efefef'); background:-webkit-gradient(linear,0% 0,0% 100%,from(#FCFCFC),to(#efefef)); background: -moz-linear-gradient(270deg, #FCFCFC, #efefef) repeat scroll 0 0 transparent;\n  width: 300px;\n  margin: -7px auto 0;\n  padding: 10px 20px 10px;\n }\n #projects_inner h2 {\n  margin: 0;\n }\n#projects_inner { text-decoration: none !important; }\n #projects_inner .col {\n  width: 45%;\n }\n #projects_inner #my_column {\n  float: left;\n }\n #projects_inner #work_column {\n  float: right;\n }\n #projects_inner .col ul {\n  margin: 0;\n  padding: 0;\n  border-top: 1px solid #eee;\n }\n #projects_inner .col ul li {\n  background: none;\n  padding: 0;\n }\n #projects_inner .col ul li a, #projects_inner .col ul li a:link, #projects_inner .col ul li a:active, #projects_inner .col ul li a:visited {\n  display: block;\n  padding: 5px 0;\n  color: #666;\n }\n</style>");

$('#projects_dd').bind('mouseenter', function() {
  $('#projects_container').show();
}).bind('mouseleave', function() {
  $('#projects_container').hide();
});

$('#projects_inner').prepend('<div id="my_column" class="col"><h2>Personal</h2><ul id="my_project_list" /></div>');
$('#projects_inner').prepend('<div id="work_column" class="col"><h2>Work</h2><ul id="org_project_list" /></div>');

// ME
$.ajax({
  url: 'https://github.com/api/v2/json/repos/show/' + username + '?login=' + username + '&token=' + apiToken,
  dataType: 'json',
  success: function(data) {
    for (var key in data.repositories) {
      $('#my_project_list').prepend('<li><a href="' + data.repositories[key].url + '">' + data.repositories[key].name + '</a></li>')
    }
  }
});

// WORK
$.ajax({
  url: 'https://github.com/api/v2/json/organizations/repositories?login=' + username + '&token=' + apiToken,
  dataType: 'json',
  success: function(data) {
    for (var key in data.repositories) {
      $('#org_project_list').prepend('<li><a href="' + data.repositories[key].url + '">' + data.repositories[key].name + '</a></li>')
    }
  }
});