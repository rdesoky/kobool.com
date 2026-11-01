/**
 * Created by rdeso_000 on 1/6/2015.
 */
define(["jquery", "page-nav","k-template","top-tabs"],function($,pgNav,tmpl,$tabs){
	return {
		onload:function(){
			if( _N( _GC("id") ) ){
				$tabs.showTab("Menu.Search");
				$tabs.select("Search.Simple");
			}else{
				$tabs.select("GuestMenu.search");
			}
			//tmpl.processTemplateNode( document.getElementById("SearchPage"), {});
			var form = document.forms.searchFrm;
			if(!form){
				return;
			}
			form.onsubmit = function(){
				pgNav.open("list",{
						ls:"act",
						ob:"rl",
						ag:form.ag.value,
						ms:form.ms.value,
						c:form.c.value,
						o:form.o.value,
						g:form.g.value
					}
				);
				return false;
			};

			var cYear=(new Date().getFullYear());

			$.each(form.ag.options,
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
				require(["saved-search"],function(savedSearch){
					_A( _CL("SavedSearches"), savedSearch.render() );
				});
				form.g.value = SSN.gender==0 ? "1":"0";
			}
			_E("Driller").style.clear = SSN.id ? "both" : "none";
			require(["drill"],function(drill){
				drill.renderButtons(_CL("Driller"));
			});

		}
	}
});

