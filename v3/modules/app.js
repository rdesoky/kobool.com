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

						// Analytics is configured in shared/config.js; ga() is a
						// no-op unless a measurement ID is set there.
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
