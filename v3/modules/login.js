/**
 * Created by rdeso_000 on 1/16/2015.
 */
define(["jquery","kui","top-tabs","utils","dom-utils"],function($, $kui, $tabs, $u, $du){
	return {
		onload:function(){
			if( SSN.id ){
				var target = _P("target","my");
				if(target == "login"){
					target = "my";
				}
				require("page-nav").open(target,undefined,undefined,true);
				return;
			}

			$tabs.select("GuestMenu.login");
			if( $u.getCParam("target_url") ){
				$du.removeClass( "idLoginIntro", "hidden" );
				$( "#idLoginIntro").html( _S("login.login_required") );
			}
			//document.forms.login.lname.focus();
		},

		onsubmit:function(){
			try {
				var aForm = document.forms.login;
				var chk = $.each(["lname", "pw"], function (item) {
					if (!aForm[item].value.trim().length) {
						$kui.msgbox({
							msg: "login.missing_" + item, onclose: function () {
								aForm[item].focus();
							}
						});
						return false;
					}
					return true;
				});

				if (chk !== true) {
					return false;
				}
			}catch(e){
				alert(e.message);
				return false;
			}

			require(["mem-ui","page-nav"],	function(imem, pgNav){
				imem.login(//it refreshes the header UI
					{	lname: aForm.lname.value,
						pw:aForm.pw.value
					},
					function(res){// success
						aForm.reset();
						pgNav.open(_P("target",_N(SSN.mate)?"chat":"my"),undefined,undefined,true);
						//pgNav.reload();
					},
					function(res){//error
						$kui.msgbox({
							title:"errors:error.title",
							msg:"errors:error." + res.error,
							onclose:function(){
								aForm.lname.focus();
							}
						});

					}
				);

			});
			return false;
		}
	}
});
