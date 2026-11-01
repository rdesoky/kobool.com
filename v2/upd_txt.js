var UpdateText = {
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}
		var frm = document.forms.updateTextFrm;
		TopTabs.showTab("Menu.Update");
		TopTabs.select("Update.text");

		Http.postCGI(gCGI.member, {mem:_N(_GC("id"))}, function(res){
			_E("UpdateText").style.visibility = "visible";
			frm.ad_title.focus();
			_H("Debug",res);
			var r = JSN(res);
			var info = r;
			frm.ad_title.value = info.ad_title? info.ad_title.replace("|u|","").replace("|r|","") : "";
			frm.self_desc.value = info.self_desc ? info.self_desc.replace("|u|","").replace("|r|","") : "";
			frm.mate_desc.value = info.mate_desc ? info.mate_desc.replace("|u|","").replace("|r|","") : "";
		});
	},
	onsubmit:function(frm){
		Http.postUpdate(gCGI.upd_my_text, PgNav.form2Hash(frm), function(res){
			if(_P("wz")){
				PgNav.open("upd_pics");
			}else{
				PgNav.open("update",undef,true);
			}
		});
	}

};