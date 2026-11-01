define(["jquery","kui","top-tabs","http"],function($,$kui,$tabs,$http){
	return {
		requireStrings:["str:contact"],
		onload:function(){

			$tabs.select("Menu.ContactUs");

			var frm = document.forms.contact_us;

			//frm.name.focus();

			frm.onsubmit=function(){
				var chk = Enum(["email","msg"], function(item){
					if(!frm[item].value.trim().length){
						$kui.msgbox({msg:"contact.missing_" + item, onclose:function(){
							frm[item].focus();
						}});
						return false;
					}
					return undefined;
				});

				if(chk!==true){
					return false;
				}

				if(!frm.email.value.trim().isValidEmail()){
					$kui.msgbox({
						title:"a.error",
						msg:"contact.invalid_email",
						onclose:function(){
							frm.email.focus();
						}
					});
					return false;
				}

				$http.postCGI( $http.api.contact,
					{
						name:frm.name.value.trim(),
						email:frm.email.value.trim(),
						title:frm.msg_title.value.trim(),
						msg:frm.msg.value.trim()
					},
					function(t,x){
						var r=$http.xml2JS(x);
						if(_N(r.success)){
							frm.msg_title.value = frm.msg.value = "";
							$kui.question({
								msg:"contact.done",
								yesHandler:function(){
									frm.msg_title.focus();
								},
								noHandler:function(){
									require("page-nav").open("home",undefined,true);
								}
							});
						}else{
							$kui.msgbox({msg:"errors:error."+r.error});
						}
					}
				);

				return false;
			};
		}
	};
});
