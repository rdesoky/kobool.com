var UpdateAttr = {
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}

		var frm = document.forms.updateAttrFrm;

		TopTabs.showTab("Menu.Update");
		TopTabs.select("Update.attr");

		Http.postCGI(gCGI.member, {mem:_N(_GC("id"))}, function(res){
			_E("UpdateAttr").style.visibility = "visible";
			_H("Debug",res);
			var r = JSN(res);
			var info = r;

			if(SSN.gender != "1"){
				DU.hide("po_editor,dt_editor");//hide polygamy and cloth
			}
			frm.country.onchange = function(){
				var st = frm.state;
				_HI("StateEditor,CityEditor");
				frm.state.value = 
				frm.city.value = "0";
				showStates(frm.country.value, "0", "0");
			};
			function showStates(country, state, city){
				var st = frm.state;
				Http.get(PgLinks.geo + "&lang=" + U.lang() + "&id=" + frm.country.value, function(res){
					st.options.length = 1;
					var r = JSN(res);
					if(!_D(r)){	return; }
					_SH("StateEditor");
					var list = r.child_list[0];
					Enum(list, function(val,key){
						_A( st, "option", {value:key}, val );
					});
					frm.state.value = state;
					frm.city.value = city;
				});
			};
			frm.state.onchange = function(){
				var ci = frm.city;
				_HI("CityEditor");
				frm.city.value = "0";
				showCities(frm.country.value, 
					frm.state.value,
					"0"
				);
			};
			function showCities(country, state, city){
				var ci = frm.city;
				Http.get(PgLinks.geo + "&lang=" + U.lang() + "&id=" 
							+ country + "." + state, 
				function(res){
					_SH("CityEditor");
					ci.options.length = 1;
					var r = JSN(res);
					if(!_D(r)){ return; }
					var list = r.child_list[0];
					Enum(list, function(val,key){
						_A( ci, "option", {value:key}, val );
					});
					frm.state.value = state;
					frm.city.value = city;
				});
			};

			Enum(info, function(val, filter){
				if(_D(frm[filter])){
					frm[filter].value = val;
				}
			});
			if(info.state){
				showStates(info.country, info.state, info.city);
			}else{
				showStates(info.country);
			}
			if(info.city){
				showCities(info.country, info.state, info.city);
			}else if(info.state){
				showCities(info.country, info.state);
			}
			
		});
	},
	onsubmit:function(frm){
		Http.postUpdate(gCGI.upd_my_attr, PgNav.form2Hash(frm), function(res){
			if(_P("wz")){
				PgNav.open("upd_txt");
			}else{
				PgNav.open("update",undef,true);
			}
		});
	}
};