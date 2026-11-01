var ForgotLogin={
	onload:function(){

		TopTabs.select(null);

		_A( _CL("Contents"), "div", {"class":"pg_header title"}, _S("profile:forgot.page_title"));
		var r = _A("Contents","div",{"class":"pg_body"});

		_A( r, "div", {"class":"pg_intro"}, _S("profile:forgot.intro") );

		var frm	= _A(_A(r,"div",{"class":"indent"}), "form", {id:"ForgotLoginForm", "class":"form_frame"} );
		_A( frm, "div", {"class":"form_title"}, _S("profile:forgot.form_title") );
		var ftbl = _AT( frm, {border:0}, [{style:"width:40%", "class":"vtop right_align"},{"class":"vtop", style:"width:60%"}], 2);
		_HS( ftbl.rows[0][0], "profile:forgot.email_prompt" );

		_A(ftbl.rows[0][1],"input",{type:"text", name:"email"});
		_A(ftbl.rows[1][1],"input",{type:"submit", value:_S("profile:forgot.submit")});

		frm.onsubmit=function(){
			var chk = Enum(["email"], function(item){
				if(!frm[item].value.trim().length){
					KUI.msgbox({msg:"profile:forgot.missing_" + item,onclose:function(){
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
					msg:"profile:forgot.invalid_email", 
					onclose:function(){
						frm.email.focus();
					}
				});
				return false;
			}

			Http.postCGI(gCGI.get_password,
				{
					email:frm.email.value.trim()
				},
				function(t,x){
					var r=Http.xml2JS(x);
					if(_N(r.success)){
						KUI.msgbox({
							msg:"profile:forgot.done", 
							onclose:function(){
								PgNav.open("home");
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