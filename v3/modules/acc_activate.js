define(["jquery", "top-tabs", "page-nav", "http", "kui", "dom-utils", "utils", "mem-ui"],
function($, $tabs, $pgNav, $http, $kui, $du, $u, $imem) {

	return {
		requireStrings:["profile:acc_activate"],
		onload: function () {
			if (!$kui.chkLogin({nav: true})) {
				return;
			}
			if (SSN.activated) {
				$pgNav.open("acc_suspend");
				return;
			}

			$tabs.showTab("Menu.Update");
			$tabs.select("Update.account");

			var frm = document.forms.ActivateAccount;

			frm.onsubmit = function () {
				if (!frm.pw.value.trim().length) {
					$kui.msgbox({
						msg: "profile:acc_activate.missing_pw", onclose: function () {
							frm.pw.focus();
						}
					});
					return false;
				}

				$http.post({
					scr: $http.api.activate,
					refresh: 1,
					data: {
						pw: frm.pw.value.trim()
					},
					onload: function (t, x) {
						var r = $http.xml2JS(x);
						if (_N(r.success)) {
							$kui.msgbox({
								msg: "profile:acc_activate.done",
								onclose: function () {
									$pgNav.open("update");
									$imem.refreshHeader(true);
								}
							});
						} else {
							var msg = _C("div");
							_HS(_A(msg, "div"), "errors:error." + r.error);

							if (r.error == "blacklist_member") {
								var box = _A(msg, "div", {"class": "box"});
								_A(box, "div", {}, _S("profile:acc_activate.blacklist_prompt"));
								_A(box, "div", {"class": "bold"}, r.termination_note);
							}
							var mb = $kui.msgbox({msg: msg});
						}
					}
				});

				return false;
			};
		}
	};
});