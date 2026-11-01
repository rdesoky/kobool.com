var ActivateMembership={
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}
		if(SSN.activated){
			PgNav.open("acc_suspend");
			return;
		}

		TopTabs.showTab("Menu.Update");
		TopTabs.select("Update.account");

		_A( _CL("Contents"), "div", {"class":"pg_header title"}, _S("profile:acc_activate.page_title"));
		var r = _A("Contents","div",{"class":"pg_body"});

		_A( r, "div", {"class":"pg_intro"}, _S("profile:acc_activate.intro") );

		var frm	= _A(r, "form", {id:"ActivateMembershipForm", "class":"form_frame"} );
		_A( frm, "div", {"class":"form_title"}, _S("profile:acc_activate.form_title") );
		var ftbl = _AT( frm, {border:0}, [{style:"width:40%", "class":"vtop right_align"},{"class":"vtop", style:"width:60%"}], 2);
		_HS( ftbl.rows[0][0], "profile:acc_activate.password_prompt" );

		_A(ftbl.rows[0][1],"input",{type:"password", name:"pw"});
		_A(ftbl.rows[1][1],"input",{type:"submit", value:_S("profile:acc_activate.submit")});
		frm.pw.focus();

		frm.onsubmit=function(){
			if(!frm.pw.value.trim().length){
				KUI.msgbox({msg:"profile:acc_activate.missing_pw",onclose:function(){
					frm.pw.focus();
				}});
				return false;
			}

			Http.post({
				scr:"activate.pl", 
				refresh:1,
				data:{
					pw:frm.pw.value.trim()
				},
				onload:function(t,x){
					var r=Http.xml2JS(x);
					if(_N(r.success)){
						KUI.msgbox({
							msg:"profile:acc_activate.done", 
							onclose:function(){
								PgNav.open("update");
								IMem.refreshHeader(true);
							}
						});
					}else{
						var msg = _C("div");
						_HS( _A( msg, "div" ), "errors:error."+r.error );

						if(r.error=="blacklist_member"){
							var box = _A(msg, "div", {"class":"box"});
							_A(box,"div",{},_S("profile:acc_activate.blacklist_prompt"));
							_A(box,"div",{"class":"bold"}, r.termination_note);
						}
						var mb = KUI.msgbox({msg:msg});
					}
				}
			});

			return false;
		};
	}
};