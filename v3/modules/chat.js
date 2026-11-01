define(["jquery","page-nav", "kui", "k-template", "http","utils","dom-utils","top-tabs","ui-selector","check-frame","inline-edit"],
function($, $pgNav, $kui, $ktmpl, $http, $u, $du, $tabs, CSelector,CCheckFrame) {
	var module, msgSelector = new CSelector();

	return module = {
		requireCSS:["chat"],
		requireStrings:["options:chat","str:chat","contact:contact_m","contact:points", "contact:contact"],

		initMsgTemplate:function(el, $d, $actions){// called from template
			var $menu = $du.initMenuBtn(el,$d);
			$menu.click(function(e){
				var menu_id = $(e.target).attr("data-menu-id");
				switch(menu_id){
					case "report":
						$kui.showNotImplemented();
						break;
					case "edit":
						require(["popup"], function (popup) {
							var editor = _C("textarea", {style: "width:100%;height:120px"}, $d.body);

							popup.open("update_msg", _TXT(_S("a.update") + " #" + $d.msg_index), editor, [
								{
									title: _S("a.save"),
									onclick: function () {
										$http.post({
											scr: $http.api.contact_m,
											data: {
												pd: 1,
												update: $d.id,
												mid: SSN.mate,
												mtid: SSN.mtid,
												msg: editor.value
											},
											onload: function (t, x) {
												$d.body = editor.value;
												$ktmpl.render({
													$root:$(el).html(""),
													data:$d,
													tid:".chat_msg"
												});
											}
										});
									}
								},
								{
									title: _S("a.cancel")
								}
							]);
							//setTimeout(function(){editor.focus()},1000);
						});
						break;
					case "delete":
						require(["popup"], function (popup) {
							popup.open("confirm", undefined, "a.sure", [
								{
									title: _S("a.yes"),
									onclick: function () {
										$http.post({
											scr: $http.api.delete_msg,
											data: {
												msg: $d.id,
												mid: SSN.mate,
												mtid: SSN.mtid
											},
											onload: function (t, x) {
												$(el).remove();
											}
										});
									}
								},
								{
									title: _S("a.no"),
									focus: true
								}
							]);
						});

				}
			});
		},
		onload: function (viewRoot) {
			if (!$kui.chkLogin({nav: true})) {
				return;
			}

			if (!SSN.mate) {
				$pgNav.open("my", undefined, true, true);
			}
			$tabs.showTab("Menu_Kobool");
			$tabs.select("Kobool.Chat");

			var $intro = $(".chat_intro_text", viewRoot);
			$intro.html( $intro.html().replace(/\%m\%/g, SSN.mlogin).replace(/\%h.{1}\%/g, "") );

			this.initFixedMsgs($(".pdm_frame", viewRoot));

			document.forms.ChatEditor.onsubmit = function () {
				var frm = this;
				frm.msg.value = frm.msg.value.trim();
				frm.live.value = module.live ? "1" : "0";

				var pdata = $u.form2Hash(this);
				pdata.pd = ( frm.rtm && frm.rtm.checked ? 1 : 0 );

				if (!pdata.pd || frm.msg.value.length) {
					$http.post({
						scr: $http.api.contact_m,
						data: pdata,
						onload: function (t, x) {
							var info = $http.xml2JS(x);
							if (_N(info.success)) {
								frm.msg.value = "";
								frm.msg.focus();
								module.onchange(viewRoot);
							} else {
								//TODO: show error
							}
						},
						silent: true
					});
				}
				return false;
			};

			this.ping();
			this.onchange(viewRoot);
		},
		onchange:function(viewRoot){
			var $root = $("#ChatBody", viewRoot);

			this.getPage(0).done(function(pageInfo){
				var results = pageInfo.results;
				if(results.can_type!=0){
					$("#chkTyping").dom().checked = true;
					module.toggleTyping();
				}
				if( _N(results.total) ) {
					$root.html("").append(pageInfo.$docFrag);
				}else{
					$root.html("").append("<div class='subtitle'>" + _S("contact:contact_m.no_msgs") + "</div>");
				}
				module.scrollBottom();
			});
		},
		scrollBottom:function(){
			window.scrollTo(0,document.body.scrollHeight - window.innerHeight )
		},
		initFixedMsgs: function (rootEl) {
			var ndx = 1;
			var selected_msg;
			var sendBtn = _C("button", {"class": "float_right"}, _S("contact:contact_m.submit"));
			$(sendBtn).click(function(e){
				document.forms.ChatEditor.msid.value = selected_msg;
			});
			$("div",rootEl).each(function (el) {
				var msg_id = _N(el.id.substr(14));
				if (_D(el.innerHTML)) {
					if (el.innerHTML.trim().length) {
						$(el).click(function (e) {
							msgSelector.select(this);
							this.insertBefore(sendBtn, this.firstChild);
							sendBtn.focus();
							selected_msg = msg_id;
						});
					} else {
						_A(el, "hr");
					}
					ndx++;
				}
			});

		},

		ping: function () {
			if (!document.forms.ChatEditor) {// not in chat page
				return;
			}

			$http.post({
				scr: $http.api.chat_ping,
				data: {
					id: SSN.id,
					mid: SSN.mate,
					t: (document.forms.ChatEditor.msg.value.trim().length ? "1" : "0")
				},
				silent: true,
				onload: function (t, x) {
					var info = $http.xml2JS(x);
					var $pgActions = $("#PageActions");
					if (_N(info.mate_online)) {
						module.live = true;
						if (_N(info.t)) {//typing
							$pgActions.html("<span class='online typing'>" + _S("contact:contact_m.mate_typing").replace(/\%m\%/g, SSN.mlogin) + "</span>")
						} else {
							$pgActions.html("<span class='online'>" + _S("contact:contact_m.mate_online").replace(/\%m\%/g, SSN.mlogin) + "</span>")
						}
						if (_N(info.new_post)) {
							module.onchange();
						}
					} else {
						module.live = false;
						$pgActions.html("<span class='offline'>" + _S("contact:contact_m.mate_offline").replace(/\%m\%/g, SSN.mlogin) + "</span>")
					}

					setTimeout(function () {
						module.ping();
					}, 5000);
				}
			});
		},

		getPage: function (page) {

			var $docFrag = $(document.createDocumentFragment());
			var results;

			return $http.post({
				scr: $http.api.chat_msgs,
				data: {"p": page, js: 1},
				silent: true
			}).then(function (res) {
				results = JSN(res.responseText);

				module.showPStatus(results);
				var msgs = results.child_list;
				var isFirstPage = (msgs === undefined) || (msgs.length == 0) || (msgs[0].msg_index == 1);
				return $ktmpl.render({
						$root:$docFrag,
						tid:".chat_msg",
						data:msgs,
						top_puller:isFirstPage ? null : function(){
							return module.getPage(page + 1);
						}
					},
					results
				);
			}).then(function(){
				return {
					$docFrag:$docFrag,
					results:results
				}
			});
		},

		showPStatus: function (res) {
			$root = $("#Contents");

			$root.removeClass("my_point my_gift mate_point mate_gift");

			switch(_N(res.my_cards) ) {
				case 0:
					break;
				case 1:
					$root.addClass("my_point");
					break;
				default:
					$root.addClass("my_gift");
					break;
			}
			switch (_N(res.mate_cards) ) {
				case 0:
					break;
				case 1:
					$root.addClass("mate_point");
					break;
				default:
					$root.addClass("mate_gift");
			}
			if( _N(res.my_cards) + _N(res.mate_cards) > 1) {
				$root.addClass("no_points_needed");
			}

			$("#MatePointsCount").html(res.mate_cards);
			$("#MyPointsCount").html(res.my_cards);

		},

		toggleTyping:function(){
			var $cBox = $("#Contents");
			var chk = $("#chkTyping").dom();
			if( chk.checked){
				$cBox.addClass("show_typing")
				//$("#ChatTypingBox .chat_editor textarea").focus();
			}else{
				$cBox.removeClass("show_typing") 
			}
		}
	};

});

