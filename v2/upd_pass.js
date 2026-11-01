var UpdatePassword = {
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}

		TopTabs.showTab("Menu.Update");
		TopTabs.select("Update.pass");

		_A( _CL("Contents"), "div", {"class":"pg_header title"}, _S("profile:upd_pass.page_title"));
		var r = _A("Contents","div",{"class":"pg_body"});

		_A( r, "div", {"class":"pg_intro"}, _S("profile:upd_pass.intro") );

		var frm	= _A(r, "form", {id:"ChgPassForm", "class":"form_frame"} );
		_A( frm, "div", {"class":"form_title"}, _S("profile:upd_pass.form_title") );
		var ftbl = _AT( frm, {border:0}, [{style:"width:40%", "class":"vtop right_align"},{"class":"vtop", style:"width:60%"}], 4);
		_HS( ftbl.rows[0][0], "profile:upd_pass.old_prompt" );
		_HS( ftbl.rows[1][0], "profile:upd_pass.new_prompt" );
		_HS( ftbl.rows[2][0], "profile:upd_pass.retype_prompt" );

		_A(ftbl.rows[0][1],"input",{type:"password", name:"old_pw"});
		_A(ftbl.rows[1][1],"input",{type:"password", name:"new_pw"});
		_A(ftbl.rows[2][1],"input",{type:"password", name:"retype_pw"});
		_A(ftbl.rows[3][1],"input",{type:"submit", value:_S("profile:upd_pass.submit")});
		
		frm.old_pw.focus();
		frm.onsubmit=function(){
			var chk = Enum(["old_pw","new_pw","retype_pw"], function(item){
				if(!frm[item].value.trim().length){
					KUI.msgbox({msg:"profile:upd_pass.missing_" + item,onclose:function(){
						frm[item].focus();
					}});
					return false;
				}
				return undef;
			});

			if( chk !== true){
				return false;
			}

			if( frm.new_pw.value != frm.retype_pw.value ){
				KUI.msgbox({msg:"profile:upd_pass.pw_mismatch", onclose:function(){frm.new_pw.focus();}});
				return false;
			}

			Http.postCGI(gCGI.chg_pass,
				{
					cpw:frm.old_pw.value.trim(),
					pw:frm.new_pw.value.trim()
				},
				function(t,x){
					var r=Http.xml2JS(x);
					if( _N(r.success) ){
						KUI.msgbox({
							msg:"profile:upd_pass.done", 
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