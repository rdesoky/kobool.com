define({
	run:function() {
		require(["jquery", "shortcuts", "str-loader"], function ($) {
			$(document).ready(function () {
				require(["page-nav", "featured", "kevents", "ssn-monitor", "tooltip", "mem-ui", "dom-utils", "layout", "matching_timer"],
					function (pgNav, featured, kevents, sMonitor, tooltip, imem, $du, PgLayout, $mtimer) {
						pgNav.init();
						sMonitor.init();
						featured.init();
						kevents.listen("SSNUpdate", function () {
							imem.refreshHeader();
							//pgNav.reload();
						});

						imem.refreshHeader(true);
						tooltip.init();
						PgLayout.init();
						$mtimer.init();

						// Share this
						window.switchTo5x=true;
						// pgNav.loadScript("http://w.sharethis.com/button/buttons.js",function(){
						// 	window.stLight.options({publisher: "6b3942ea-9ab6-4a40-8e3c-9fda1a7469a0", doNotHash: false, doNotCopy: false, hashAddressBar: false});
						// });
					  
						// (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
						// (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
						// m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
						// })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

						// ga('create', 'UA-74527671-1', 'auto');

					}
				);
			});
		});
	}
});

define("top-tabs",["page-nav","tab-ctrl"], function(pgNav, tabCtrl){
	return new tabCtrl( {//TODO: make it auto detect
			"Menu.My":{panel:"SubMenu.My"}
			,"Menu_Kobool":{panel:"SubMenu.Kobool"}
			,"Menu.Profile":{panel:"SubMenu.Profile"}
			,"Menu.Update":{panel:"SubMenu.Update"}
			,"Menu.Search":{panel:"SubMenu.Search"}
			,"Menu.QA":{panel:"SubMenu.QA"}
			,"Menu.Mailbox":{panel:"SubMenu.Mailbox"}
			,"Menu.CPoints":{panel:"SubMenu.CPoints"}
		}, 1
	);
});

function Log(msg, type){
	type = type || Log.type.info;

	if(!Log.level || !(Log.level & type) ){
		return;
	}

	(type == Log.type.info && console.log(msg));
	(type == Log.type.warn && console.warn(msg));
	(type == Log.type.error && console.error(msg));
}

Log.type = {
	info: 1,
	warn: 2,
	error: 4
};

var SSN = {
	id:0,
	reset:function(){
		for( var key in this ){
			if( typeof this[key] == "string" || typeof this[key] == "number")
				delete this[key];
		}
		this.id=0;
	},
	sync:function(res){
		var me = this;
		Enum(["id", "gender", "activated", "mate", "mtid", "main_pic","mate_pic","black_list","questions", "wishers","visitors", "declines" ], function(key){
			_D(res[key]) ? (me[key] = _N(res[key])) : delete me[key];
		});
		Enum(["sid", "login_id", "mlogin", "error"], function(key){
			_D(res[key]) ? (me[key] = res[key]) : delete me[key];
		});
		return res;
	}
};
