define(["jquery","top-tabs","kui","page-nav","http","utils","ui-selector","check-frame"],
function($,$tabs,$kui,$pgNav,$http,$u,CSelector,CCheckFrame) {
	var module;
	return module = {
		requireCSS:["decline"],
		requireStrings:["str:declines","str:decline_msgs","contact:decline"],
		onload: function () {
			if (!$kui.chkLogin({nav: true})) {
				return;
			}

			if (!SSN.mate) {
				$pgNav.open("home", undefined, undefined, true);
			}

			$tabs.showTab("Menu_Kobool");
			$tabs.select("Kobool.Decline");
			
			var mate_name = "<b>" + SSN.mlogin + "</b>";

			$("#PageActions").html(_S("contact:decline.title"));

			var $pageRoot = $("<div class='pg_body'></div>");

			$("#Contents").append($pageRoot);

			$pageRoot.append(
				"<div>" + _S("contact:decline.intro").replace(/\%m\%/g, mate_name) + "</div>" +
				"<div>" + _S("contact:decline.form_title") + ": </div>"
			);


			var $form = $("<form class='form_frame' id='DeclineForm'></form>").append($kui.getProgress());

			$pageRoot.append($form);

			$pageRoot.append(
				"<div>" + _S("contact:decline.note").replace(/\%m\%/g, mate_name) + "</div>" +
				"<div>" + _S("contact:decline.warning").replace(/\%m\%/g, mate_name) + "</div>"
			);

			$http.postCGI($http.api.match_cards_status, undefined, function (t, x) {
				var r = $http.xml2JS(x);
				module.populateForm($form.html(""), r);
			});
		},

		populateForm: function ($form, pstatus) {
			var frm = $form.dom();

			$form.html(
				'<div id="decline_note"></div>' +
				'<div>' + _S("contact:decline.msg_title") + ':</div>' +
				'<div id="written_msg_toggler"><input type="checkbox" name="pd" id="paid_msg" value="0"/><label for="paid_msg">' + _S("contact:decline.written_msg") + '</label></div>' +
				'<ul id="decline_fixed_msgs"></ul>' +
				'<div id="decline_written_msg"><textarea name="msg"></textarea></div>' +
				'<div id="decline_points_status"></div>' +
				'<div class="field_label">' + _S("contact:decline.password") + ':</div>' +
				'<div><input type="password" name="pw"></div>' +
				'<div id="decline_status"></div>' +
				'<div class="buttons_bar"><button>' + _S("contact:decline.submit_title") + '</button></div>'
			);

			var $fmsg_list = $("#decline_fixed_msgs", $form);

			var $points_status = $("#decline_status", $form);
			var $decline_note = $("#decline_note", $form);

			if (_N(pstatus.need_card)) {
				$decline_note.html(_S("contact:decline.need_point"));
			} else if (_N(pstatus.mate_needs_card)) {
				$decline_note.html(_S("contact:decline.mate_need_point"));
			}else{
				$decline_note.hide();
			}

			function setStatusText(pd) {

				if (pd == 0) {// written unchecked
					if (!_N(pstatus.need_card)) {
						if (_N(pstatus.refundable)) {
							$points_status.html( _S("contact:decline.usable_points") );
						} else {
							$points_status.html( _S("contact:decline.used_points") );
						}
					}
				} else {//written checked
					if (_N(pstatus.refundable)) {
						$points_status.html( _S("contact:decline.lose_points"));
					} else {
						$points_status.html( _S("contact:decline.used_points"));
					}
				}
			}

			if (!_N(pstatus.need_card) && !_N(pstatus.mate_needs_card)) {// can write

				$form.addClass("can_write");
				$("#paid_msg",$form).listen("change", function(e){
					var rtm=e.target;
					if (rtm.checked) {
						$form.addClass("writing_on");
						$("textarea",$form).focus();
					} else {
						$form.removeClass("writing_on");
					}
					setStatusText(rtm.checked);
				});
				setStatusText(0);
			} else {
				setStatusText(0);
				$points_status.hide();
			}


			frm.onsubmit = function () {
				var rtm;

				if (!this.pw.value.trim().length) {
					$kui.msgbox({
						title: "a.error",
						msg: "contact:decline.no_password",
						onclose: function () {
							frm.pw.focus();
						}
					});
					return false;
				}

				var paid = ( frm.pd && frm.pd.checked ) ? 1 : 0;
				var par = {
					pw: frm.pw.value.trim(),
					pd: paid,
					msg: paid ? frm.msg.value.trim() : ( sel.selItem ? sel.selItem.innerHTML : "" )
				};
				var msg_error = (par.msg.length > 10) ? null : ( (par.msg.length == 0) ? "contact:decline.no_msg" : "contact:decline.msg_too_short");
				if (msg_error) {
					$kui.msgbox({
						msg: msg_error,
						onclose: function () {
							if (rtm && rtm.checked) {
								frm.msg.focus();
							}
						}
					});
					return false;
				}
				var msg = _C("div");

				_HS(_A(msg, "p"), "contact:decline.confirm");
				_A(msg, "div", {"class": "box padding"}, par.msg);

				$kui.confirm(
					msg,
					function () {
						$http.postUpdate($http.api.decline, par, function (t, x) {
							var r = $http.xml2JS(x);
							if (_N(r.success)) {
								require(["mem-ui"],function(mem_ui){
									mem_ui.refreshHeader(true);
								});

								$kui.msgbox({
									msg: "contact:decline.done",
									onclose: function () {
										$pgNav.open("declines", undefined, true, true);
									}
								});
							} else {
								$kui.msgbox({msg: "errors:error." + r.error, onclose:function(){
									$(frm.pw).focus();
								}});
							}
						});
					},
					"contact:decline.title"
				);
				return false;
			};

			var sel = new CSelector();

			$.each(_E("str:decline_msgs").childNodes, function (el) {
				if (_D(el.innerHTML) && el.innerHTML.length) {
					$fmsg_list.append("<li>" + el.innerHTML + "</li>").click(function(e){
						sel.select(e.target);
					});
				}
			});


		}
	};
});