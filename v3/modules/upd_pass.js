define(["jquery", "top-tabs", "page-nav", "http", "kui", "dom-utils", "utils"],function($, $tabs, $pgNav, $http, $kui, $du, $u) {

	return {
		requireStrings:["profile:upd_pass"],
		onload: function () {
			if (!$kui.chkLogin({nav: true})) {
				return;
			}

			$tabs.showTab("Menu.Update");
			$tabs.select("Update.pass");

			var frm = document.forms.updatePwd;

			//frm.old_pw.focus();
			frm.onsubmit = function () {
				var chk = Enum(["old_pw", "new_pw", "retype_pw"], function (item) {
					if (!frm[item].value.trim().length) {
						$kui.msgbox({
							msg: "profile:upd_pass.missing_" + item, onclose: function () {
								frm[item].focus();
							}
						});
						return false;
					}
					return undefined;
				});

				if (chk !== true) {
					return false;
				}

				if (frm.new_pw.value != frm.retype_pw.value) {
					$kui.msgbox({
						msg: "profile:upd_pass.pw_mismatch", onclose: function () {
							frm.new_pw.focus();
						}
					});
					return false;
				}

				$http.postCGI( $http.api.chg_pass,
					{
						cpw: frm.old_pw.value.trim(),
						pw: frm.new_pw.value.trim()
					},
					function (t, x) {
						var r = $http.xml2JS(x);
						if (_N(r.success)) {
							$kui.msgbox({
								msg: "profile:upd_pass.done",
								onclose: function () {
									$pgNav.open("update");
								}
							});
						} else {
							$kui.msgbox({msg: "errors:error." + r.error});
						}
					}
				);

				return false;
			};
		}
	};
});