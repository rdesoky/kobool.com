define(["jquery", "top-tabs", "page-nav", "http", "kui", "dom-utils", "utils"],function($, $tabs, $pgNav, $http, $kui, $du, $u) {

	return {
		requireStrings:["profile:forgot"],
		onload: function () {

			$tabs.select(null);

			$("#Contents").html(
				'<div class="pg_body">' +
					'<div class="pg_intro">' + _S("profile:forgot.intro") + "</div>" +
					"<form id='ForgotLoginForm' class='form_frame'>" +
						"<div class='field_label'>" + _S("profile:forgot.email_prompt") + "</div>" +
						"<div class='form_field'><input type='text' name='email'></div>" +
						"<div class='buttons_bar'><button>" + _S("profile:forgot.submit") + "</button></div>" +
					"</form>" +
				'</div>'
			);

			var frm = $("#ForgotLoginForm").dom();


			frm.onsubmit = function () {
				var chk = $.each(["email"], function (item) {
					if (!frm[item].value.trim().length) {
						$kui.msgbox({
							msg: "profile:forgot.missing_" + item, onclose: function () {
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
						msg: "profile:forgot.invalid_email",
						onclose: function () {
							frm.email.focus();
						}
					});
					return false;
				}

				$http.postCGI($http.api.get_password,
					{
						email: frm.email.value.trim()
					},
					function (t, x) {
						var r = $http.xml2JS(x);
						if (_N(r.success)) {
							$kui.msgbox({
								msg: "profile:forgot.done",
								onclose: function () {
									$pgNav.open("home");
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