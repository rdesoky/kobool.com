var UpdateEmail={
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}

		TopTabs.showTab("Menu.Update");
		TopTabs.select("Update.email");

		_A( _CL("Contents"), "div", {"class":"pg_header title"}, _S("profile:upd_email.page_title"));
		var r = _A("Contents","div",{"class":"pg_body"});

		_A( r, "div", {"class":"pg_intro"}, _S("profile:upd_email.intro") );

		var frm	= _A(r, "form", {id:"ChgEmailForm", "class":"form_frame"} );
		_A( frm, "div", {"class":"form_title"}, _S("profile:upd_email.form_title") );
		var ftbl = _AT( frm, {border:0}, [{style:"width:40%", "class":"vtop right_align"},{"class":"vtop", style:"width:60%"}], 3);
		_HS( ftbl.rows[0][0], "profile:upd_email.password_prompt" );
		_HS( ftbl.rows[1][0], "profile:upd_email.new_email_prompt" );

		_A(ftbl.rows[0][1],"input",{type:"password", name:"pw"});
		_A(ftbl.rows[1][1],"input",{type:"text", name:"email"});
		_A(ftbl.rows[2][1],"input",{type:"submit", value:_S("profile:upd_email.submit")});

		frm.pw.focus();

		frm.onsubmit=function(){
			var chk = Enum(["pw","email"], function(item){
				if(!frm[item].value.trim().length){
					KUI.msgbox({msg:"profile:upd_email.missing_" + item,onclose:function(){
						frm[item].focus();
					}});
					return false;
				}
			});
			
			if( chk !== true ){
				return false;
			}
			
			if(!frm.email.value.trim().isValidEmail()){
				KUI.msgbox({
					title:"a.error", 
					msg:"profile:upd_email.invalid_email", 
					onclose:function(){
						frm.email.focus();
					}
				});
				return false;
			}

			Http.postCGI(gCGI.chg_email,
				{
					pw:frm.pw.value.trim(),
					lname:SSN.login_id,
					email:frm.email.value.trim()
				},
				function(t,x){
					var r=Http.xml2JS(x);
					if(_N(r.success)){
						KUI.msgbox({
							msg:"profile:upd_email.done", 
							onclose:function(){
								PgNav.open("update");
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