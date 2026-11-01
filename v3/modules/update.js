define(["jquery", "top-tabs", "page-nav", "http", "kui"],function($, $tabs, $pgNav, $http, $kui) {

	return {
		requireStrings:["str:profile"],
		onload: function () {
			if (!$kui.chkLogin({nav: true})) {
				return;
			}
			$tabs.showTab("Menu.Update");
			$tabs.select(null);
			this.showOptions();
		},
		showOptions: function () {
			var $pageRoot = $("#Contents");
			_A("Contents", "div", {"class": "pg_header title"}, _S("profile.select_update"));
			$pageRoot.html("<div class='pg_header title'>" + _S("profile.select_update") +"</div>");
			var $root = $("<div class='pg_body'></div>");
			$pageRoot.append($root);
			var $lst = $("<ul id='UpdateBtns'>");
			$root.append($lst);

			$.each({
					upd_attr: {title:"update_attr",icon:"user"},
					upd_txt: {title:"update_text",icon:"edit"},
					upd_pics: {title:"update_pics",icon:"camera"},
					upd_pass: {title:"update_pass",icon:"key"},
					upd_email: {title:"update_email",icon:"envelope"},
					acc_suspend: {title:"stop_account",icon:"moon"},
					acc_activate: {title:"activate_account",icon:"sun"}
				},
				function (info, key) {
					if (key == "acc_suspend" && !SSN.activated) {
					} else if (key == "acc_activate" && SSN.activated) {
					} else {
						var $li = $("<li class='drill_btn update_btn'><div><span class='sym-icon icon-" + info.icon + "'></span></div>" + _S("profile." + info.title) + "</li>");
						$lst.append($li);
						$li.click(function(e){
							$pgNav.open(key, undefined, true);
						});
					}
				}
			);

			var $showMyPage = $("<button>" + _S("a.show_my_page") + "</button>");
			$lst.append($("<p>").append($showMyPage));
			$showMyPage.click(function(){
				$pgNav.open("mem", {mem: false}, true);
			});
		}
	};
});