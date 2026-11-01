//TODO: obsolete
var Login = {
	onload:function(){
		TopTabs.select("GuestMenu.login");
		if( PgNav.getCParam("target_url") ){
			DU.removeClass( "idLoginIntro", "hidden" );
			_E("idLoginIntro").innerHTML = _S("login.login_required");
		}
		document.forms.login.lname.focus();
	},

	onsubmit:function(){
		var aForm = document.forms["login"];
		var chk = Enum(["lname","pw"], function(item){
				if(!aForm[item].value.trim().length){
					RSCR("KUI",function(){
						KUI.msgbox({msg:"login.missing_" + item,onclose:function(){
							aForm[item].focus();
						}});
					});
					return false;
				}
				return true;
		});
		
		if(chk!==true){
			return false;
		}
		
		Req("imem",	function(){
			IMem.login(//it refreshes the header UI
				{	lname: aForm.lname.value, 
					pw:aForm.pw.value 
				},
				function(res){// success
					aForm.reset();
					//PgNav.open(_P("target",_N(SSN.mate)?"chat":"my"),undef,true);
					PgNav.reload();
				},
				function(res){//error
					RSCR("KUI",function(){
						KUI.msgbox({title:"errors:error.title", msg:"errors:error." + res.error,onclose:function(){
							aForm.lname.focus();
						}});
					});
				} 

			);
		});
		return false;
	}
};

var Logout={
	onload:function(){
		//Req("imem",function(){IMem.logout();});
		//if(SSN.id){
		//	PgNav.open("home",undef,true,true)
		//	return;
		//}
		setTimeout(
			function(){
				if(PgNav.currPage=="logout"){
					PgNav.open("home",undef,true,true);
				}
			},
			3000
		);
	}
};