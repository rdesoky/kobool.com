var ContactUS={
	onload:function(){

		TopTabs.showTab("Menu.Profile");
		TopTabs.select("Profile.update");

		_A( _CL("Contents"), "div", {"class":"pg_header title"}, _S("contact.page_title"));
		var r = _A("Contents","div",{"class":"pg_body"});

		_A( r, "div", {"class":"pg_intro"}, _S("contact.intro") );

		var frm	= _A(r, "form", {id:"ContactForm", "class":"form_frame"} );
		_A( frm, "div", {"class":"form_title"}, _S("contact.form_title") );
		var ftbl = _AT( frm, {border:0}, [{style:"width:40%", "class":"vtop right_align"},{"class":"vtop", style:"width:60%"}], 5);
		_HS( ftbl.rows[0][0], "contact.name_prompt" );
		_HS( ftbl.rows[1][0], "contact.email_prompt" );
		_HS( ftbl.rows[2][0], "contact.title_prompt" );
		_HS( ftbl.rows[3][0], "contact.msg_prompt" );

		_A(ftbl.rows[0][1],"input",{type:"text", name:"name", value:SSN.login_id});
		_A(ftbl.rows[1][1],"input",{type:"text", name:"email", style:"width:200px"});
		_A(ftbl.rows[2][1],"input",{type:"text", name:"msg_title", style:"width:450px"});
		_A(ftbl.rows[3][1],"textarea",{name:"msg"});
		_A(ftbl.rows[4][1],"input",{type:"submit", value:_S("contact.submit")});
		frm.name.focus();

		frm.onsubmit=function(){
			var chk = Enum(["email","msg"], function(item){
				if(!frm[item].value.trim().length){
					KUI.msgbox({msg:"contact.missing_" + item, onclose:function(){
						frm[item].focus();
					}});
					return false;
				}
				return undef;
			});
			
			if(chk!==true){
				return false;
			}

			if(!frm.email.value.trim().isValidEmail()){
				KUI.msgbox({
					title:"a.error", 
					msg:"contact.invalid_email", 
					onclose:function(){
						frm.email.focus();
					}
				});
				return false;
			}

			Http.postCGI( gCGI.contact,
				{
					name:frm.name.value.trim(),
					email:frm.email.value.trim(),
					title:frm.msg_title.value.trim(),
					msg:frm.msg.value.trim()
				},
				function(t,x){
					var r=Http.xml2JS(x);
					if(_N(r.success)){
						frm.msg_title.value = frm.msg.value = "";
						KUI.question({
							msg:"contact.done", 
							yesHandler:function(){
								frm.msg_title.focus();
							},
							noHandler:function(){
								PgNav.open("home",undef,true);
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