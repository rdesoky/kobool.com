define(["jquery", "top-tabs", "page-nav", "http", "kui", "dom-utils", "utils"],function($, $tabs, $pgNav, $http, $kui, $du, $u) {
	return {
		requireStrings:["profile:upd_email"],
		onload: function () {
			if (!$kui.chkLogin({nav: true})) {
				return;
			}

			$tabs.showTab("Menu.Update");
			$tabs.select("Update.email");

			var frm = document.forms.updateEmail;
			//frm.pw.focus();
			frm.onsubmit = function () {
				var chk = $.each(["pw", "email"], function (item) {
					if (!frm[item].value.trim().length) {
						$kui.msgbox({
							msg: "profile:upd_email.missing_" + item, onclose: function () {
								frm[item].focus();
							}
						});
						return false;
					}
				});

				if (chk !== true) {
					return false;
				}

				if (!frm.email.value.trim().isValidEmail()) {
					$kui.msgbox({
						title: "a.error",
						msg: "profile:upd_email.invalid_email",
						onclose: function () {
							frm.email.focus();
						}
					});
					return false;
				}

				$http.postCGI($http.api.chg_email,
					{
						pw: frm.pw.value.trim(),
						lname: SSN.login_id,
						email: frm.email.value.trim()
					},
					function (t, x) {
						var r = $http.xml2JS(x);
						if (_N(r.success)) {
							$kui.msgbox({
								msg: "profile:upd_email.done",
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