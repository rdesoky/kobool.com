define(["jquery", "dom-utils","kui", "http", "check-frame"],function($, $du, $kui, $http, CCheckFrame){
	var module;

	function doKobool(frm, memID){
		if( !$kui.chkLogin() ){
			return;
		}

		$http.postUpdate( $http.api.add_kobool,{
				id_wisher:SSN.id
				,id_wished:memID
				,v:frm.visible_k[0].checked?1:0},
			function(t,x){
				//drawUI(Http.xml2JS(x)); update the active page
				require(["page-nav"],function(pgNav){
					pgNav.refresh();
				});
			}
		);
	}
	return module = {
		onclickBlock:function(info, btn,onfinish){
			if(!$kui.chkLogin()){return;}
			$du.addClass(btn,"progress16");
			if(_N(info.blocked)){
				$du.removeClass(btn,"block_on");
				module.unblock(info, function(){
					$du.removeClass(btn,"progress16");
					$du.addClass(btn,"block_off");
					//_SA(btn,{tip:"help:tips.block"});
					$("#Member_" + info.id + " .profile_layout").removeClass("blocked");
					info.blocked = 0;
					if(onfinish){
						onfinish();
					}
				});
			}else{
				$du.removeClass(btn,"block_off");
				module.block(info, function(){
					$du.removeClass(btn,"progress16");
					$du.addClass(btn,"block_on");
					//_SA(btn,{tip:"help:tips.unblock"});
					$("#Member_" + info.id + " .profile_layout").addClass("blocked");
					info.blocked = 1;
					if(onfinish){
						onfinish();
					}
				});
			}
		},
		onclickBookmark:function(info, btn){
			if(!$kui.chkLogin()){return;}
			$du.addClass(btn,"progress16");
			if(_N(info.bookmark)){
				$du.removeClass(btn,"fav_on");
				module.del_bookmark(info, function(){
					$du.removeClass(btn,"progress16");
					$du.addClass(btn,"fav_off");
					_SA(btn,{tip:"help:tips.bookmark"});
					info.bookmark = 0;
				});
			}else{
				$du.removeClass(btn,"fav_off");
				module.bookmark(info, function(){
					$du.removeClass(btn,"progress16");
					$du.addClass(btn,"fav_on");
					_SA(btn,{tip:"help:tips.unbookmark"});
					info.bookmark = 1;
				});
			}
		},
		block:function(info, onSuccess){
			if($kui.chkLogin()){
				$http.post({
					refresh:1,
					silent:1,
					scr: $http.api.block,
					data:{id:info.id},
					onload:function(t,x){
						if(onSuccess){
							onSuccess();
						}
					}});
			}
		},
		unblock:function(info, onSuccess){
			if($kui.chkLogin()){
				$http.post({
					refresh:1,
					silent:1,
					scr: $http.api.unblock,
					data:{id:info.id},
					onload:function(t,x){
						if(onSuccess){
							onSuccess();
						}
					}
				});
			}
		},
		bookmark:function(info, onSuccess){
			if( $kui.chkLogin() ){
				$http.post({
					refresh:1,
					silent:1,
					scr: $http.api.add_bookmark,
					data:{id_watched:info.id},
					onload:function(t,x){
						if(onSuccess){
							onSuccess();
						}
					}
				});
			}
		},
		del_bookmark:function(info, onSuccess){
			if( $kui.chkLogin() ){
				$http.post({
					refresh:1,
					silent:1,
					scr:$http.api.delete_bookmark,
					data:{id:info.id},
					onload:function(t,x){
						if(onSuccess){
							onSuccess();
						}
					}});
			}
		},
		toggleWishVisibility:function($btn,info){
			var $btns = $("#Member_" + info.id + " .visible_wish_icon, #Member_" + info.id + " .hidden_wish_icon");
			$btns.removeClass("hidden_wish_icon visible_wish_icon").addClass("progress16");
			var new_state = info.visible_wish == 1 ? 0 : 1;
			$http.postUpdate($http.api.set_wish_visibility, {id: info.id, v: new_state},
				function () {
					info.visible_wish = new_state;
					$btns.removeClass("progress16").addClass(new_state==0?"visible_wish_icon":"hidden_wish_icon");
					$btns.html(_S((new_state==0)?"a.mk_visible_wish":"a.mk_hidden_wish"));
					$("#Member_" + info.id + " .my_visit_box .visit_heart").removeClass("hidden_acceptance visible_acceptance").addClass(new_state==0?"hidden_acceptance":"visible_acceptance");
				}
			);
		},
		onClickKobool:function(memInfo){
			var frm = _C("form", {"class":"visibility_form"});
			var vsbl = _A(frm, new CCheckFrame().getDOM());
			var hddn = _A(frm, new CCheckFrame().getDOM());
			_A( vsbl, "input", {type:"radio", "class":"visible_acceptance", name:"visible_k",checked:true} );
			_HS( _A( vsbl, "span"), "options:add_wish.visible" );
			_A( hddn, "input", {type:"radio", "class":"hidden_acceptance", name:"visible_k",checked:false} );
			_HS( _A( hddn, "span"), "options:add_wish.invisible" );
			var self = this;
			RS("info:confirm", function(){
				require(["popup"],function(popup){
					var p = popup.open( "ConfirmKobool",
						"info:confirm.add_kobool_title",
						_C("div",undefined,_S("info:confirm.add_kobool").replace(/\%u\%/g, memInfo.login_id)),
						[
							{
								title:_S("a.yes")
								,focus:true
								,onclick:function(){
								doKobool(frm, memInfo.id);
							}
							},
							{
								title:_S("a.no")
							}
						]
					);
					_A(p, frm);
				});
			});
		},
		onClickRemoveKobool:function(memInfo){
			$kui.confirm( "a.sure", function(){
				$http.postUpdate($http.api.delete_wish, {id:memInfo.id,r:memInfo.rank},
					function(){
						require(["page-nav"],function(pgNav){
							pgNav.refresh();
						});
					});
			});
		},
		onClickAsk:function(memInfo){
			require(["qui"],function(qui){
				qui.browseQuestions(
					{
						onclick:function(row, dom){
							if( _N(row.asked_before) ){
								return;
							}else if( _N(row.answer) ) {
								return;
							}

							$kui.confirm("qa:ui.ask_confirm", function(){
								if(!$kui.chkLogin()){
									return;
								}
								$http.postUpdate( $http.api.ask,
									{ from:SSN.id, to:memInfo.id, qid:row.question },
									function(t,x){
										require("popup").open( "Done", "a.information", $kui.askReport($http.xml2JS(x)) );
										row.asked_before = 1;
										$(dom).addClass("q_asked");
										$("#MAnswers4U").removeAttr("memid");//invalidate tab
									}
								);
							});

						}
					},
					{
						memInfo:memInfo,
						g:memInfo.gender,
						c:0,
						to:memInfo.id
					}
				);
			});
		},
		onClickPromote:function(memInfo){
			$http.postUpdate($http.api.promote_wish, {id:memInfo.id,r:memInfo.rank},
				function(){
					require(["page-nav"],function(pgNav){
						pgNav.refresh();
					});
				});
		},
		onClickDemote:function(memInfo){
			$http.postUpdate($http.api.demote_wish, {id:memInfo.id,r:memInfo.rank},
				function(){
					require(["page-nav"],function(pgNav){
						pgNav.refresh();
					});
				});
		}


	};

});
