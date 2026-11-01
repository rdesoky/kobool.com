/**
 * Created by rdeso_000 on 1/20/2015.
 */
define(["jquery", "top-tabs", "page-nav", "http", "kui", "utils"],function($, $tabs, $pgNav, $http, $kui, $u) {
	return {
		onload:function(){
			if( !$kui.chkLogin({nav:true}) ){
				return;
			}
			var frm = document.forms.updateTextFrm;
			$tabs.showTab("Menu.Update");
			$tabs.select("Update.text");

			$http.postCGI($http.api.member, {mem:_N(_GC("id"))}, function(res){
				_E("UpdateText").style.visibility = "visible";
				//frm.ad_title.focus();
				var r = JSN(res);
				var info = r;
				frm.ad_title.value = info.ad_title? info.ad_title.replace("|u|","").replace("|r|","") : "";
				frm.self_desc.value = info.self_desc ? info.self_desc.replace("|u|","").replace("|r|","") : "";
				frm.mate_desc.value = info.mate_desc ? info.mate_desc.replace("|u|","").replace("|r|","") : "";
			});
		},
		onsubmit:function(frm){
			$http.postUpdate($http.api.upd_my_text, $u.form2Hash(frm), function(res){
				if(_P("wz")){
					$pgNav.open("upd_pics");
				}else{
					$pgNav.open("update",undefined,true);
				}
			});
		}
	}
});