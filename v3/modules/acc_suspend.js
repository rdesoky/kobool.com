define(["jquery", "top-tabs", "page-nav", "http", "kui", "dom-utils", "utils", "mem-ui"],function($, $tabs, $pgNav, $http, $kui, $du, $u, $imem) {

	return {
		requireStrings:["profile:acc_suspend"],
		onload: function () {
			if (!$kui.chkLogin({nav: true})) {
				return;
			}
			if (!SSN.activated) {
				$pgNav.open("acc_activate");
				return;
			}

			$tabs.showTab("Menu.Update");
			$tabs.select("Update.account");

			var frm = document.forms.AccountSuspend;

			frm.onsubmit = function () {
				if (!frm.pw.value.trim().length) {
					$kui.msgbox({
						msg: "profile:acc_suspend.missing_pw", onclose: function () {
							frm.pw.focus();
						}
					});
					return false;
				}

				$http.postCGI($http.api.unregister,
					{
						pw: frm.pw.value.trim(),
						notes: frm.feedback.value.trim()
					},
					function (t, x) {
						var r = x ? $http.xml2JS(x) : JSN(t);
						if (_N(r.success)) {
							$kui.msgbox({
								msg: "profile:acc_suspend.done",
								onclose: function () {
									$pgNav.open("update");
									$imem.refreshHeader(true);
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