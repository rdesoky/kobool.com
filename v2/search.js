var Search = {
	onload:function(){
		if( _N( _GC("id") ) ){
			TopTabs.showTab("Menu.Search");
			TopTabs.select("Search.Simple");
		}else{
			TopTabs.select("GuestMenu.search");
		}

		var cYear=(new Date().getFullYear());
		var form = document.forms.searchFrm;
		if(!form){
			return;
		}
		Enum(form.ag.options, 
			function(option){
				//alert(txt);
				if(option.value.length){
					var txt = option.innerHTML;
					ar = txt.split("-");
					option.value = (cYear - _N(ar[1])).toString() + "-" + (cYear - _N(ar[0])).toString();
				}
			}
		);
		
		
		if( SSN.id ){
			_A( _CL("SavedSearches"), SavedSearch.render() );
			Drill.renderButtons(_CL("Driller"));
		}else{
			Drill.renderButtons(_CL("SavedSearches"));
		}
	},
	submit:function(form){
		PgNav.open("list",{
				ls:"act",
				ob:"rl",
				ag:form.ag.value,
				ms:form.ms.value,
				c:form.c.value,
				o:form.o.value,
				g:form.g[0].checked?0:(form.g[1].checked?1:false)
			}
		);
	}
};

