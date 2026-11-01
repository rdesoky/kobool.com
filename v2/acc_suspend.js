var StopMembership={
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}
		if(!SSN.activated){
			PgNav.open("acc_activate");
			return;
		}

		TopTabs.showTab("Menu.Update");
		TopTabs.select("Update.account");

		_A( _CL("Contents"), "div", {"class":"pg_header title"}, _S("profile:acc_suspend.page_title"));
		var r = _A("Contents","div",{"class":"pg_body"});

		_A( r, "div", {"class":"pg_intro"}, _S("profile:acc_suspend.intro") );

		var frm	= _A(r, "form", {id:"StopMembershipForm", "class":"form_frame"} );
		_A( frm, "div", {"class":"form_title"}, _S("profile:acc_suspend.form_title") );
		var ftbl = _AT( frm, {border:0}, [{style:"width:40%", "class":"vtop right_align"},{"class":"vtop", style:"width:60%"}], 3);
		_HS( ftbl.rows[0][0], "profile:acc_suspend.password_prompt" );
		_HS( ftbl.rows[1][0], "profile:acc_suspend.feedback_prompt" );

		_A(ftbl.rows[0][1],"input",{type:"password", name:"pw"});
		_A(ftbl.rows[1][1],"textarea",{name:"feedback"});
		_A(ftbl.rows[2][1],"input",{type:"submit", value:_S("profile:acc_suspend.submit")});
		frm.pw.focus();

		frm.onsubmit=function(){
			if(!frm.pw.value.trim().length){
				KUI.msgbox({msg:"profile:acc_suspend.missing_pw",onclose:function(){
					frm.pw.focus();
				}});
				return false;
			}

			Http.postCGI(gCGI.unregister,
				{
					pw:frm.pw.value.trim(),
					notes:frm.feedback.value.trim()
				},
				function(t,x){
					var r=JSON.parse(t);
					if(_N(r.success)){
						KUI.msgbox({
							msg:"profile:acc_suspend.done", 
							onclose:function(){
								PgNav.open("update");
								IMem.refreshHeader(true);
							}
						});
					}else{
						KUI.msgbox({msg:"errors:error."+r.error});
					}
				}
			);

			return false;
		};
	}
};